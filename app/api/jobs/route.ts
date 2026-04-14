import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const employer_id = searchParams.get('employer_id')

    let query = supabaseAdmin
        .from('jobs')
        .select('*, applications(count)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (employer_id) {
        query = supabaseAdmin
            .from('jobs')
            .select('*, applications(count)')
            .eq('employer_id', employer_id)
            .order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'employer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, location, job_type } = body

    if (!title || !description) {
        return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Get employer record
    const { data: employer } = await supabaseAdmin
        .from('employers')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

    if (!employer) return NextResponse.json({ error: 'Employer not found' }, { status: 404 })

    const { data, error } = await supabaseAdmin
        .from('jobs')
        .insert({
            employer_id: employer.id,
            title,
            description,
            location: location || 'Remote',
            job_type: job_type || 'full-time',
            status: 'active',
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}
