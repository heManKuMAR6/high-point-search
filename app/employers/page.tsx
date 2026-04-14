'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function EmployerAuthPage() {
    const router = useRouter()
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', company_name: '' })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')

        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); setLoading(false); return }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
        if (!form.company_name.trim()) { setError('Company name is required'); setLoading(false); return }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password, role: 'employer', company_name: form.company_name }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error); setLoading(false); return }

            const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
            if (result?.error) { setError('Account created but sign in failed. Please sign in.'); setLoading(false); return }
            router.push('/employers/onboarding')
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
        if (result?.error) { setError('Invalid email or password'); setLoading(false); return }
        router.push('/employers/dashboard')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', fontFamily: 'var(--font-body-var)' }}>
            {/* Left panel */}
            <div style={{ display: 'none', flex: 1, background: 'linear-gradient(135deg, #1F6F8B 0%, #0d4f68 100%)', padding: '60px', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' }} className="employer-panel">
                <div style={{ color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>High Point Search</span>
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 300, lineHeight: 1.3, marginBottom: 20 }}>Hire experienced professionals who deliver results.</h2>
                    <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.7 }}>Connect with motivated 50+ professionals and veterans who bring decades of expertise and unmatched commitment to your team.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                        { n: '10+ years', l: 'Average experience' },
                        { n: '94%', l: 'Retention rate' },
                        { n: '48hr', l: 'Avg. match time' },
                        { n: '500+', l: 'Verified employers' },
                    ].map(({ n, l }) => (
                        <div key={l} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 20px' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 300, color: 'white', marginBottom: 4 }}>{n}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — Form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
                <div style={{ width: '100%', maxWidth: 440 }}>
                    {/* Mobile logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#1F6F8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F' }}>High Point Search · Employers</span>
                    </div>

                    <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: '#1D1D1F', marginBottom: 6, letterSpacing: '-0.02em' }}>
                        {mode === 'signin' ? 'Welcome back' : 'Create an employer account'}
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#86868b', marginBottom: 28 }}>
                        {mode === 'signin' ? 'Sign in to your employer dashboard' : 'Use your business email to get started'}
                    </p>

                    {/* Toggle */}
                    <div style={{ display: 'flex', background: '#F5F5F7', borderRadius: 12, padding: 4, marginBottom: 28 }}>
                        {(['signin', 'signup'] as const).map(m => (
                            <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: mode === m ? 500 : 400, background: mode === m ? 'white' : 'transparent', color: mode === m ? '#1D1D1F' : '#86868b', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                                {m === 'signin' ? 'Sign in' : 'Create account'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
                        {mode === 'signup' && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: '#1D1D1F' }}>Company name</label>
                                <input name="company_name" value={form.company_name} onChange={handleChange} required placeholder="Acme Corporation" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                            </div>
                        )}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: '#1D1D1F' }}>Business email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@company.com" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                            {mode === 'signup' && <p style={{ fontSize: '0.76rem', color: '#86868b', marginTop: 5 }}>Personal email providers (Gmail, Yahoo, etc.) are not accepted.</p>}
                        </div>
                        <div style={{ marginBottom: mode === 'signup' ? 16 : 24 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: '#1D1D1F' }}>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Minimum 8 characters" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                        </div>
                        {mode === 'signup' && (
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: '#1D1D1F' }}>Confirm password</label>
                                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Repeat your password" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                            </div>
                        )}
                        {error && <div style={{ padding: '11px 15px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, fontSize: '0.875rem', color: '#CC0000', marginBottom: 16 }}>{error}</div>}
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#86868b' : '#1F6F8B', color: 'white', fontSize: '0.95rem', fontWeight: 400, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.22)', transition: 'all 0.2s' }}>
                            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: '#86868b' }}>
                        Looking for work?{' '}
                        <a href="/apply" style={{ color: '#1F6F8B', textDecoration: 'none' }}>Candidate sign in</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
