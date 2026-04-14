import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import bcrypt from 'bcryptjs'

const FREE_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'me.com', 'protonmail.com', 'aol.com',
    'live.com', 'msn.com'
]

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password, role, company_name } = body

        // Basic validation
        if (!email || !password || !role) {
            return NextResponse.json(
                { error: 'Email, password and role are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Block free email domains for employers
        if (role === 'employer') {
            const domain = email.split('@')[1]?.toLowerCase()
            if (FREE_EMAIL_DOMAINS.includes(domain)) {
                return NextResponse.json(
                    { error: 'Please use your business email address' },
                    { status: 400 }
                )
            }
            if (!company_name) {
                return NextResponse.json(
                    { error: 'Company name is required' },
                    { status: 400 }
                )
            }
        }

        // Check if email already exists
        const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashed_password = await bcrypt.hash(password, 12)

        // Create user
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .insert({ email, hashed_password, role })
            .select()
            .single()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Failed to create account' },
                { status: 500 }
            )
        }

        // Create role-specific profile
        if (role === 'candidate') {
            await supabaseAdmin
                .from('candidates')
                .insert({ user_id: user.id })
        }

        if (role === 'employer') {
            const domain = email.split('@')[1]?.toLowerCase()
            await supabaseAdmin
                .from('employers')
                .insert({
                    user_id: user.id,
                    company_name,
                    business_email_domain: domain,
                    verification_status: 'pending'
                })
        }

        return NextResponse.json(
            { message: 'Account created successfully', userId: user.id },
            { status: 201 }
        )

    } catch (err) {
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        )
    }
}