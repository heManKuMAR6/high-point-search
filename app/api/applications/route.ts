import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const job_id = searchParams.get('job_id')
    const candidate_id = searchParams.get('candidate_id') // this is the user_id from the client

    if (candidate_id) {
        // Resolve user_id → candidates.id (the FK stored on applications)
        const { data: candidateRecord, error: cErr } = await supabaseAdmin
            .from('candidates')
            .select('id')
            .eq('user_id', candidate_id)
            .single()

        if (cErr || !candidateRecord) {
            // No candidate profile yet — return empty list rather than 500
            return NextResponse.json([])
        }

        const { data, error } = await supabaseAdmin
            .from('applications')
            .select('*, jobs(id, title, location, job_type)')
            .eq('candidate_id', candidateRecord.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[applications GET candidate]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data ?? [])
    }

    if (job_id) {
        // Employer viewing applicants for a job — include candidate info from users
        const { data, error } = await supabaseAdmin
            .from('applications')
            .select('*, candidates(id, skills, user_id, users(email, name))')
            .eq('job_id', job_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[applications GET job]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data ?? [])
    }

    return NextResponse.json({ error: 'job_id or candidate_id required' }, { status: 400 })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'candidate') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { job_id } = await req.json()
    if (!job_id) return NextResponse.json({ error: 'job_id is required' }, { status: 400 })

    // Get candidate record
    const { data: candidate } = await supabaseAdmin
        .from('candidates')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

    // Check for duplicate application
    const { data: existing } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('candidate_id', candidate.id)
        .eq('job_id', job_id)
        .single()

    if (existing) return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('applications')
        .insert({ candidate_id: candidate.id, job_id, status: 'submitted' })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, status, employer_feedback } = await req.json()
    if (!id) return NextResponse.json({ error: 'Application id required' }, { status: 400 })

    const updates: Record<string, string> = {}
    if (status) updates.status = status
    if (employer_feedback) updates.employer_feedback = employer_feedback

    const { data, error } = await supabaseAdmin
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
