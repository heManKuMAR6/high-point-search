import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'candidate') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF and Word documents are accepted' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${session.user.id}/resume.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // Ensure the bucket exists — create it if not (error is ignored when it already exists)
  await supabaseAdmin.storage.createBucket('resumes', { public: true })

  const { error: uploadError } = await supabaseAdmin.storage
    .from('resumes')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[resume-upload]', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from('resumes').getPublicUrl(path)
  return NextResponse.json({ url: urlData.publicUrl })
}
