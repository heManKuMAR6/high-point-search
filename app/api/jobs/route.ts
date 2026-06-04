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
    const {
        title, description, location,
        employment_type, experience_level,
        required_skills, preferred_qualifications, benefits,
        is_remote, application_deadline,
        hiring_manager_name, hiring_manager_email, number_of_openings,
        salary_min, salary_max, veteran_friendly,
    } = body

    if (!title || !description) {
        return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const { data: employer } = await supabaseAdmin
        .from('employers')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

    if (!employer) return NextResponse.json({ error: 'Employer not found' }, { status: 404 })

    const resolvedType = employment_type || 'full-time'

    const { data, error } = await supabaseAdmin
        .from('jobs')
        .insert({
            employer_id: employer.id,
            title,
            description,
            location: location || null,
            job_type: resolvedType,
            employment_type: resolvedType,
            experience_level: experience_level ?? null,
            required_skills: required_skills ?? [],
            preferred_qualifications: preferred_qualifications ?? null,
            benefits: benefits ?? [],
            is_remote: is_remote ?? false,
            application_deadline: application_deadline ?? null,
            hiring_manager_name: hiring_manager_name ?? null,
            hiring_manager_email: hiring_manager_email ?? null,
            number_of_openings: number_of_openings ?? 1,
            salary_min: salary_min ?? null,
            salary_max: salary_max ?? null,
            veteran_friendly: veteran_friendly ?? false,
            status: 'active',
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}
