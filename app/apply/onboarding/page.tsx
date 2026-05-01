'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const STEPS = ['Profile', 'Resume', 'Skills', 'Disclosures', 'Review']

const SKILL_OPTIONS = [
    'Project Management', 'Leadership', 'Sales', 'Customer Service',
    'Operations', 'Finance', 'Accounting', 'HR', 'Marketing',
    'IT Support', 'Data Analysis', 'Healthcare', 'Legal', 'Teaching',
    'Engineering', 'Supply Chain', 'Real Estate', 'Insurance', 'Banking',
]

const STATUS_COLORS: Record<string, string> = {
    submitted: '#1F6F8B',
    reviewed: '#8B6F1F',
    interview: '#1F8B6F',
    offer: '#2D7A3A',
    rejected: '#CC3333',
}

function StepIndicator({ current }: { current: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
            {STEPS.map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: i < current ? '#1F6F8B' : i === current ? '#1F6F8B' : '#E5E5E7',
                            color: i <= current ? 'white' : '#86868b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.85rem', fontWeight: 500,
                            border: i === current ? '3px solid rgba(31,111,139,0.25)' : '3px solid transparent',
                            transition: 'all 0.3s ease',
                        }}>
                            {i < current ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            ) : i + 1}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: i <= current ? '#1F6F8B' : '#86868b', fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>
                            {step}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div style={{
                            flex: 1, height: 2, margin: '0 8px', marginBottom: 22,
                            background: i < current ? '#1F6F8B' : '#E5E5E7',
                            transition: 'background 0.3s ease',
                        }} />
                    )}
                </div>
            ))}
        </div>
    )
}

function InputField({ label, name, value, onChange, type = 'text', placeholder = '', required = false }: {
    label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string; placeholder?: string; required?: boolean
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                {label}{required && <span style={{ color: '#CC3333', marginLeft: 3 }}>*</span>}
            </label>
            <input
                type={type} name={name} value={value} onChange={onChange}
                placeholder={placeholder} required={required}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: `1.5px solid ${focused ? '#1F6F8B' : '#E5E5E7'}`,
                    fontSize: '0.95rem', outline: 'none', background: focused ? '#FAFFF' : '#FAFAFA',
                    transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                }}
            />
        </div>
    )
}

export default function CandidateOnboarding() {
    const router = useRouter()
    const { data: session } = useSession()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [profile, setProfile] = useState({ first_name: '', last_name: '', phone: '', linkedin_url: '' })
    const [resumeUrl, setResumeUrl] = useState('')
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [skills, setSkills] = useState<string[]>([])
    const [customSkill, setCustomSkill] = useState('')
    const [disclosures, setDisclosures] = useState({ veteran_status: false, age_50_plus: false, terms: false })

    const uploadFile = async (file: File) => {
        setUploading(true)
        setError('')
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/resume-upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok) {
            setResumeUrl(data.url)
            setUploadedFileName(file.name)
        } else {
            setError(data.error || 'Upload failed')
        }
        setUploading(false)
    }

    const next = () => { setError(''); setStep(s => Math.min(s + 1, 4)) }
    const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

    const toggleSkill = (skill: string) => {
        setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
    }

    const validateStep = () => {
        if (step === 0) {
            if (!profile.first_name || !profile.last_name) { setError('First and last name are required'); return false }
        }
        if (step === 2) {
            if (skills.length === 0) { setError('Please select at least one skill'); return false }
        }
        if (step === 3) {
            if (!disclosures.terms) { setError('Please agree to the terms to continue'); return false }
        }
        return true
    }

    const handleNext = () => {
        if (validateStep()) next()
    }

    const handleSubmit = async () => {
        if (!session?.user?.id) return
        setLoading(true)
        setError('')

        const allSkills = customSkill ? [...skills, ...customSkill.split(',').map(s => s.trim()).filter(Boolean)] : skills

        try {
            const res = await fetch(`/api/candidates/${session.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...profile,
                    resume_url: resumeUrl,
                    skills: allSkills,
                    veteran_status: disclosures.veteran_status,
                    age_50_plus: disclosures.age_50_plus,
                    onboarding_complete: true,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Failed to save profile')
                setLoading(false)
                return
            }

            router.push('/apply/dashboard')
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    const cardStyle: React.CSSProperties = {
        background: 'white',
        borderRadius: 24,
        padding: '40px 44px',
        boxShadow: '0 4px 40px rgba(0,0,0,0.07)',
        width: '100%',
        maxWidth: 580,
    }

    return (
        <>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-body-var)' }}>
            {/* Top logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#1F6F8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 500, color: '#1D1D1F' }}>High Point Search</span>
            </div>

            <div style={cardStyle}>
                <div style={{ marginBottom: 8 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1D1D1F', marginBottom: 4, letterSpacing: '-0.02em' }}>
                        Let's set up your profile
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#86868b' }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
                </div>

                <div style={{ height: 1, background: '#F0F0F2', margin: '20px 0 32px' }} />

                <StepIndicator current={step} />

                {/* Step 0 — Profile */}
                {step === 0 && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <InputField label="First name" name="first_name" value={profile.first_name} required
                                onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} />
                            <InputField label="Last name" name="last_name" value={profile.last_name} required
                                onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} />
                        </div>
                        <InputField label="Phone number" name="phone" value={profile.phone} type="tel"
                            placeholder="+1 (555) 000-0000"
                            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                        <InputField label="LinkedIn URL" name="linkedin_url" value={profile.linkedin_url}
                            placeholder="https://linkedin.com/in/yourname"
                            onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))} />
                    </div>
                )}

                {/* Step 1 — Resume */}
                {step === 1 && (
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#6b6b70', marginBottom: 20, lineHeight: 1.6 }}>
                            Upload your resume or paste a link to it. PDF and Word documents accepted (max 5 MB).
                        </p>

                        {/* Drop zone */}
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => {
                                e.preventDefault()
                                setDragOver(false)
                                const f = e.dataTransfer.files[0]
                                if (f) uploadFile(f)
                            }}
                            style={{
                                border: `2px dashed ${dragOver ? '#1F6F8B' : uploadedFileName ? '#22c55e' : '#C5C5C7'}`,
                                borderRadius: 16,
                                padding: '36px 24px',
                                textAlign: 'center',
                                cursor: uploading ? 'default' : 'pointer',
                                background: dragOver ? 'rgba(31,111,139,0.04)' : uploadedFileName ? 'rgba(34,197,94,0.04)' : '#FAFAFA',
                                transition: 'all 0.2s',
                                marginBottom: 20,
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
                            />

                            {uploading ? (
                                <div>
                                    <div style={{ width: 32, height: 32, border: '3px solid #E5E5E7', borderTopColor: '#1F6F8B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                                    <p style={{ fontSize: '0.875rem', color: '#86868b', margin: 0 }}>Uploading…</p>
                                </div>
                            ) : uploadedFileName ? (
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: 6 }}>✅</div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#166534', margin: '0 0 4px' }}>{uploadedFileName}</p>
                                    <p style={{ fontSize: '0.78rem', color: '#86868b', margin: 0 }}>Click to replace</p>
                                </div>
                            ) : (
                                <div>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}>
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <p style={{ fontSize: '0.9rem', color: '#1D1D1F', margin: '0 0 4px' }}>
                                        Drag your resume here
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: '#86868b', margin: 0 }}>
                                        or <span style={{ color: '#1F6F8B', textDecoration: 'underline' }}>click to browse</span> · PDF or Word, max 5 MB
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ flex: 1, height: 1, background: '#E5E5E7' }} />
                            <span style={{ fontSize: '0.78rem', color: '#86868b' }}>or paste a link</span>
                            <div style={{ flex: 1, height: 1, background: '#E5E5E7' }} />
                        </div>

                        <InputField label="Resume URL" name="resume_url" value={resumeUrl}
                            placeholder="https://drive.google.com/file/your-resume"
                            onChange={e => { setResumeUrl(e.target.value); setUploadedFileName(null) }} />
                    </div>
                )}

                {/* Step 2 — Skills */}
                {step === 2 && (
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#6b6b70', marginBottom: 20 }}>Select all that apply. You can also add custom skills below.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                            {SKILL_OPTIONS.map(skill => {
                                const selected = skills.includes(skill)
                                return (
                                    <button key={skill} onClick={() => toggleSkill(skill)} style={{
                                        padding: '7px 16px', borderRadius: 100, border: `1.5px solid ${selected ? '#1F6F8B' : '#E5E5E7'}`,
                                        background: selected ? 'rgba(31,111,139,0.08)' : 'white',
                                        color: selected ? '#1F6F8B' : '#6b6b70',
                                        fontSize: '0.85rem', fontWeight: selected ? 500 : 400,
                                        cursor: 'pointer', transition: 'all 0.18s ease',
                                    }}>
                                        {selected && '✓ '}{skill}
                                    </button>
                                )
                            })}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>Other skills (comma-separated)</label>
                            <input value={customSkill} onChange={e => setCustomSkill(e.target.value)}
                                placeholder="e.g. Six Sigma, Salesforce, Bilingual Spanish"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                )}

                {/* Step 3 — Disclosures */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <p style={{ fontSize: '0.9rem', color: '#6b6b70', lineHeight: 1.6, marginBottom: 4 }}>
                            High Point Search specializes in placing individuals 50+ and veterans. Please answer these voluntary questions so we can best match you with the right employers.
                        </p>
                        {[
                            { key: 'veteran_status', label: 'I am a U.S. military veteran', sub: 'This helps us surface veteran-friendly employers.' },
                            { key: 'age_50_plus', label: 'I am 50 years of age or older', sub: 'Employers on our platform are committed to age-inclusive hiring.' },
                            { key: 'terms', label: 'I agree to the Terms of Service and Privacy Policy', sub: 'Required to create an account.' },
                        ].map(({ key, label, sub }) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', padding: '16px 20px', borderRadius: 14, border: `1.5px solid ${disclosures[key as keyof typeof disclosures] ? '#1F6F8B' : '#E5E5E7'}`, background: disclosures[key as keyof typeof disclosures] ? 'rgba(31,111,139,0.04)' : 'white', transition: 'all 0.2s ease' }}>
                                <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
                                    <input type="checkbox" checked={disclosures[key as keyof typeof disclosures]}
                                        onChange={e => setDisclosures(d => ({ ...d, [key]: e.target.checked }))}
                                        style={{ opacity: 0, position: 'absolute', width: 20, height: 20, cursor: 'pointer' }} />
                                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${disclosures[key as keyof typeof disclosures] ? '#1F6F8B' : '#C5C5C7'}`, background: disclosures[key as keyof typeof disclosures] ? '#1F6F8B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease' }}>
                                        {disclosures[key as keyof typeof disclosures] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1D1D1F' }}>{label}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#86868b', marginTop: 2 }}>{sub}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                {/* Step 4 — Review */}
                {step === 4 && (
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#6b6b70', marginBottom: 24 }}>Please review your information before submitting.</p>
                        {[
                            { section: 'Profile', items: [
                                { label: 'Name', value: `${profile.first_name} ${profile.last_name}` },
                                { label: 'Phone', value: profile.phone || '—' },
                                { label: 'LinkedIn', value: profile.linkedin_url || '—' },
                            ]},
                            { section: 'Resume', items: [{ label: 'File', value: uploadedFileName || resumeUrl || '—' }] },
                            { section: 'Skills', items: [{ label: 'Selected', value: skills.join(', ') || '—' }] },
                            { section: 'Disclosures', items: [
                                { label: 'Veteran', value: disclosures.veteran_status ? 'Yes' : 'No' },
                                { label: '50+', value: disclosures.age_50_plus ? 'Yes' : 'No' },
                            ]},
                        ].map(({ section, items }) => (
                            <div key={section} style={{ marginBottom: 20, padding: '16px 20px', background: '#FAFAFA', borderRadius: 14, border: '1px solid #F0F0F2' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1F6F8B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{section}</div>
                                {items.map(({ label, value }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                                        <span style={{ color: '#86868b' }}>{label}</span>
                                        <span style={{ color: '#1D1D1F', fontWeight: 400, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: '0.875rem', color: '#CC0000' }}>
                        {error}
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
                    {step > 0 ? (
                        <button onClick={back} style={{ padding: '12px 24px', borderRadius: 100, border: '1.5px solid #E5E5E7', background: 'white', color: '#6b6b70', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            ← Back
                        </button>
                    ) : <div />}

                    {step < 4 ? (
                        <button onClick={handleNext} style={{ padding: '12px 28px', borderRadius: 100, border: 'none', background: '#1F6F8B', color: 'white', fontSize: '0.9rem', fontWeight: 400, cursor: 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.2)', transition: 'all 0.2s' }}>
                            Continue →
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px', borderRadius: 100, border: 'none', background: loading ? '#86868b' : '#1F6F8B', color: 'white', fontSize: '0.9rem', fontWeight: 400, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.2)', transition: 'all 0.2s' }}>
                            {loading ? 'Submitting...' : 'Complete setup ✓'}
                        </button>
                    )}
                </div>
            </div>
        </div>
        </>
    )
}
