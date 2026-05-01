'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function CandidatePage() {
  return (
    <Suspense>
      <CandidatePageInner />
    </Suspense>
  )
}

function CandidatePageInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const utmSource = searchParams.get('utm_source')
    const utmJob = searchParams.get('utm_job')
    const utmEmployer = searchParams.get('utm_employer')

    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    role: 'candidate',
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error)
                setLoading(false)
                return
            }

            // Auto sign in after signup
            const result = await signIn('credentials', {
                email: form.email,
                password: form.password,
                redirect: false,
            })

            if (result?.error) {
                setError('Account created but sign in failed. Please sign in manually.')
                setLoading(false)
                return
            }

            // Store UTM attribution on the candidate record. Non-fatal if it fails.
            if (data.userId && (utmSource || utmJob)) {
                try {
                    await fetch(`/api/candidates/${data.userId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...(utmSource && { utm_source: utmSource }),
                            ...(utmJob && { utm_job: utmJob }),
                        }),
                    })
                } catch {
                    // UTM attribution loss is acceptable; do not block onboarding
                }
            }

            router.push('/apply/onboarding')

        } catch (err) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false,
        })

        if (result?.error) {
            setError('Invalid email or password')
            setLoading(false)
            return
        }

        router.push('/apply/dashboard')
    }

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#FBFBFD',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'white',
                borderRadius: '20px',
                padding: '2.5rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 300,
                        color: '#1D1D1F',
                        marginBottom: '0.5rem',
                    }}>
                        High Point Search
                    </h1>
                    <p style={{ fontSize: '0.95rem', color: '#86868b' }}>
                        {mode === 'signin' ? 'Welcome back' : 'Create your candidate account'}
                    </p>
                </div>

                {/* Toggle */}
                <div style={{
                    display: 'flex',
                    background: '#F5F5F7',
                    borderRadius: '10px',
                    padding: '4px',
                    marginBottom: '1.5rem',
                }}>
                    {(['signin', 'signup'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError('') }}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: mode === m ? 500 : 400,
                                background: mode === m ? 'white' : 'transparent',
                                color: mode === m ? '#1D1D1F' : '#86868b',
                                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {m === 'signin' ? 'Sign in' : 'Sign up'}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#1D1D1F', marginBottom: '0.4rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="you@example.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid #E5E5E5',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: '#FAFAFA',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: mode === 'signup' ? '1rem' : '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#1D1D1F', marginBottom: '0.4rem' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="Minimum 8 characters"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid #E5E5E5',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: '#FAFAFA',
                            }}
                        />
                    </div>

                    {mode === 'signup' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#1D1D1F', marginBottom: '0.4rem' }}>
                                Confirm password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Repeat your password"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '10px',
                                    border: '1px solid #E5E5E5',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    background: '#FAFAFA',
                                }}
                            />
                        </div>
                    )}

                    {error && (
                        <div style={{
                            background: '#FFF0F0',
                            border: '1px solid #FFD0D0',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            color: '#CC0000',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.85rem',
                            background: loading ? '#86868b' : '#1F6F8B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: 400,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                </form>

                {/* Employer link */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.875rem',
                    color: '#86868b',
                }}>
                    Are you an employer?{' '}
                    <a href="/employers" style={{ color: '#1F6F8B', textDecoration: 'none' }}>
                        Sign in here
                    </a>
                </p>

            </div>
        </main>
    )
}