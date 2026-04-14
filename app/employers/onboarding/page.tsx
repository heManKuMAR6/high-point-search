'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const STEPS = ['Company', 'EIN & Legal', 'Review']

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Nonprofit', 'Real Estate', 'Transportation', 'Construction', 'Professional Services', 'Other']
const SIZES = ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,000+']

function StepIndicator({ current }: { current: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
            {STEPS.map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: i <= current ? '#1F6F8B' : '#E5E5E7', color: i <= current ? 'white' : '#86868b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 500, border: i === current ? '3px solid rgba(31,111,139,0.2)' : '3px solid transparent', transition: 'all 0.3s' }}>
                            {i < current ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg> : i + 1}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: i <= current ? '#1F6F8B' : '#86868b', fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>{step}</span>
                    </div>
                    {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 8px', marginBottom: 20, background: i < current ? '#1F6F8B' : '#E5E5E7', transition: 'background 0.3s' }} />}
                </div>
            ))}
        </div>
    )
}

export default function EmployerOnboarding() {
    const router = useRouter()
    const { data: session } = useSession()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [company, setCompany] = useState({ company_name: '', industry: '', size: '', city: '', state: '' })
    const [legal, setLegal] = useState({ ein: '', agreed: false })

    const next = () => { setError(''); setStep(s => s + 1) }
    const back = () => { setError(''); setStep(s => s - 1) }

    const validate = () => {
        if (step === 0) {
            if (!company.company_name || !company.industry || !company.size) { setError('Company name, industry, and size are required'); return false }
        }
        if (step === 1) {
            if (!legal.ein) { setError('EIN is required'); return false }
            if (!legal.agreed) { setError('Please agree to the terms to continue'); return false }
        }
        return true
    }

    const handleNext = () => { if (validate()) next() }

    const handleSubmit = async () => {
        if (!session?.user?.id) return
        setLoading(true); setError('')
        try {
            const res = await fetch(`/api/employers/${session.user.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...company, ein: legal.ein, onboarding_complete: true }),
            })
            if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to save'); setLoading(false); return }
            router.push('/employers/dashboard')
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-body-var)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#1F6F8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F' }}>High Point Search · Employer Setup</span>
            </div>

            <div style={{ background: 'white', borderRadius: 24, padding: '40px 44px', boxShadow: '0 4px 40px rgba(0,0,0,0.07)', width: '100%', maxWidth: 560 }}>
                <div style={{ marginBottom: 8 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1D1D1F', marginBottom: 4, letterSpacing: '-0.02em' }}>Set up your employer account</h1>
                    <p style={{ fontSize: '0.875rem', color: '#86868b' }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
                </div>
                <div style={{ height: 1, background: '#F0F0F2', margin: '20px 0 28px' }} />
                <StepIndicator current={step} />

                {/* Step 0 — Company Details */}
                {step === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Company name <span style={{ color: '#CC3333' }}>*</span></label>
                            <input value={company.company_name} onChange={e => setCompany(c => ({ ...c, company_name: e.target.value }))} placeholder="Acme Corporation" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Industry <span style={{ color: '#CC3333' }}>*</span></label>
                            <select value={company.industry} onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))} style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', color: company.industry ? '#1D1D1F' : '#86868b' }}>
                                <option value="">Select industry</option>
                                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Company size <span style={{ color: '#CC3333' }}>*</span></label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {SIZES.map(s => (
                                    <button key={s} onClick={() => setCompany(c => ({ ...c, size: s }))} style={{ padding: '7px 16px', borderRadius: 100, border: `1.5px solid ${company.size === s ? '#1F6F8B' : '#E5E5E7'}`, background: company.size === s ? 'rgba(31,111,139,0.08)' : 'white', color: company.size === s ? '#1F6F8B' : '#6b6b70', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.18s' }}>
                                        {s} employees
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>City</label>
                                <input value={company.city} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} placeholder="New York" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>State</label>
                                <input value={company.state} onChange={e => setCompany(c => ({ ...c, state: e.target.value }))} placeholder="NY" maxLength={2} style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1 — EIN & Legal */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Employer Identification Number (EIN) <span style={{ color: '#CC3333' }}>*</span></label>
                            <input value={legal.ein} onChange={e => setLegal(l => ({ ...l, ein: e.target.value }))} placeholder="XX-XXXXXXX" maxLength={10} style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                            <p style={{ fontSize: '0.78rem', color: '#86868b', marginTop: 6 }}>Your EIN is used to verify your business identity. It is stored securely and never shared with candidates.</p>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', padding: '18px 20px', borderRadius: 14, border: `1.5px solid ${legal.agreed ? '#1F6F8B' : '#E5E5E7'}`, background: legal.agreed ? 'rgba(31,111,139,0.04)' : 'white', transition: 'all 0.2s' }}>
                            <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
                                <input type="checkbox" checked={legal.agreed} onChange={e => setLegal(l => ({ ...l, agreed: e.target.checked }))} style={{ opacity: 0, position: 'absolute', width: 20, height: 20, cursor: 'pointer' }} />
                                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${legal.agreed ? '#1F6F8B' : '#C5C5C7'}`, background: legal.agreed ? '#1F6F8B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
                                    {legal.agreed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1D1D1F' }}>I agree to the Employer Terms of Service</div>
                                <div style={{ fontSize: '0.8rem', color: '#86868b', marginTop: 4, lineHeight: 1.5 }}>
                                    I confirm this is a legitimate business, that I will treat all candidates fairly regardless of age, and that I agree to High Point Search's non-discrimination policy.
                                </div>
                            </div>
                        </label>
                    </div>
                )}

                {/* Step 2 — Review */}
                {step === 2 && (
                    <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b6b70', marginBottom: 20 }}>Please review your information before activating your account.</p>
                        {[
                            { section: 'Company', items: [
                                { label: 'Name', value: company.company_name },
                                { label: 'Industry', value: company.industry || '—' },
                                { label: 'Size', value: company.size ? `${company.size} employees` : '—' },
                                { label: 'Location', value: company.city && company.state ? `${company.city}, ${company.state}` : '—' },
                            ]},
                            { section: 'Legal', items: [
                                { label: 'EIN', value: legal.ein ? `••-•••${legal.ein.slice(-4)}` : '—' },
                                { label: 'Terms', value: legal.agreed ? '✓ Agreed' : 'Not agreed' },
                            ]},
                        ].map(({ section, items }) => (
                            <div key={section} style={{ marginBottom: 16, padding: '16px 20px', background: '#FAFAFA', borderRadius: 14, border: '1px solid #F0F0F2' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1F6F8B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{section}</div>
                                {items.map(({ label, value }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                                        <span style={{ color: '#86868b' }}>{label}</span>
                                        <span style={{ color: '#1D1D1F' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {error && <div style={{ padding: '12px 16px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, fontSize: '0.875rem', color: '#CC0000', marginTop: 16 }}>{error}</div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
                    {step > 0 ? (
                        <button onClick={back} style={{ padding: '12px 24px', borderRadius: 100, border: '1.5px solid #E5E5E7', background: 'white', color: '#6b6b70', fontSize: '0.9rem', cursor: 'pointer' }}>← Back</button>
                    ) : <div />}
                    {step < 2 ? (
                        <button onClick={handleNext} style={{ padding: '12px 28px', borderRadius: 100, border: 'none', background: '#1F6F8B', color: 'white', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.2)' }}>Continue →</button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px', borderRadius: 100, border: 'none', background: loading ? '#86868b' : '#1F6F8B', color: 'white', fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.2)' }}>
                            {loading ? 'Activating...' : 'Activate account ✓'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
