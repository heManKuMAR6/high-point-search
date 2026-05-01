import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'

async function requireSuperadmin() {
  const session = await auth()
  if (!session || session.user.role !== 'superadmin') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireSuperadmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidateId = req.nextUrl.searchParams.get('candidateId')
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('pipeline_events')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await requireSuperadmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId, stage, notes } = await req.json()
  if (!candidateId || !stage) return NextResponse.json({ error: 'candidateId and stage required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('pipeline_events')
    .insert({ candidate_id: candidateId, stage, notes: notes ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
