import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

// Unauthenticated — returns only active jobs, no company names, no PII.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
