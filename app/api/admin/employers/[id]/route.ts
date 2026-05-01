import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'
import { Resend } from 'resend'

async function requireSuperadmin() {
  const session = await auth()
  if (!session || session.user.role !== 'superadmin') return null
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireSuperadmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [employerRes, jobsRes] = await Promise.all([
    supabaseAdmin.from('employers').select('*, users(email)').eq('id', id).single(),
    supabaseAdmin.from('jobs').select('id, title, status, created_at').eq('employer_id', id).order('created_at', { ascending: false }),
  ])

  if (employerRes.error || !employerRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    employer: employerRes.data,
    jobs: jobsRes.data ?? [],
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireSuperadmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action } = await req.json()

  if (action !== 'verify' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be verify or reject' }, { status: 400 })
  }

  const verified_status = action === 'verify' ? 'verified' : 'rejected'
  const verified_at = action === 'verify' ? new Date().toISOString() : null

  const { data, error } = await supabaseAdmin
    .from('employers')
    .update({ verified_status, verified_at })
    .eq('id', id)
    .select('*, users(email, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'verify') {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM ?? 'High Point Search <noreply@highpointsearch.com>'
    const employerEmail = (data as { users?: { email?: string } }).users?.email

    if (apiKey && apiKey !== 'will_add_later' && employerEmail) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from,
        to: employerEmail,
        subject: 'Your employer account has been verified',
        html: `<p>Your High Point Search employer account has been verified. You can now post jobs and access candidate matches.</p>`,
      }).catch(() => undefined)
    }
  }

  return NextResponse.json(data)
}
