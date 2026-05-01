'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SKILL_OPTIONS = [
    'Project Management', 'Leadership', 'Sales', 'Customer Service',
    'Operations', 'Finance', 'Accounting', 'HR', 'Marketing',
    'IT Support', 'Data Analysis', 'Healthcare', 'Legal', 'Teaching',
    'Engineering', 'Supply Chain', 'Real Estate', 'Insurance', 'Banking',
]

type Candidate = {
    first_name: string; last_name: string; phone: string
    linkedin_url: string; resume_url: string; skills: string[]
    veteran_status: boolean; age_50_plus: boolean
}

function InputField({ label, name, value, onChange, type = 'text', placeholder = '' }: {
    label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string; placeholder?: string
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>{label}</label>
            <input type={type} name={name} value={value ?? ''} onChange={onChange} placeholder={placeholder}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: `1.5px solid ${focused ? '#1F6F8B' : '#E5E5E7'}`, fontSize: '0.9rem', outline: 'none', background: '#FAFAFA', transition: 'border 0.2s', boxSizing: 'border-box' }}
            />
        </div>
    )
}

export default function CandidateProfile() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [form, setForm] = useState<Candidate>({ first_name: '', last_name: '', phone: '', linkedin_url: '', resume_url: '', skills: [], veteran_status: false, age_50_plus: false })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/apply')
    }, [status, router])

    useEffect(() => {
        if (!session?.user?.id) return
        fetch(`/api/candidates/${session.user.id}`)
            .then(r => r.json())
            .then(data => { setForm(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [session?.user?.id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    }

    const uploadResume = async (file: File) => {
        setUploading(true)
        setError('')
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/resume-upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok) {
            setForm(f => ({ ...f, resume_url: data.url }))
        } else {
            setError(data.error || 'Upload failed')
        }
        setUploading(false)
    }

    const isStoredFile = (url: string) =>
        url && url.includes('.supabase.co/storage/')

    const toggleSkill = (skill: string) => {
        setForm(f => ({
            ...f,
            skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
        }))
    }

    const handleSave = async () => {
        if (!session?.user?.id) return
        setSaving(true); setError(''); setSuccess(false)
        const res = await fetch(`/api/candidates/${session.user.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
        else { const d = await res.json(); setError(d.error || 'Failed to save') }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!session?.user?.id) return
        setDeleting(true)
        const res = await fetch(`/api/candidates/${session.user.id}`, { method: 'DELETE' })
        if (res.ok) await signOut({ callbackUrl: '/' })
        else { setError('Failed to delete account'); setDeleting(false) }
    }

    if (loading) return <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#86868b' }}>Loading...</div></div>

    return (
        <div style={{ minHeight: '100vh', background: '#FBFBFD', fontFamily: 'var(--font-body-var)' }}>
            {/* Nav */}
            <nav style={{ background: 'white', borderBottom: '1px solid #F0F0F2', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1F6F8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>High Point Search</span>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <Link href="/apply/dashboard" style={{ fontSize: '0.875rem', color: '#6b6b70', textDecoration: 'none' }}>← Dashboard</Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })} style={{ fontSize: '0.875rem', color: '#cc4444', border: 'none', background: 'none', cursor: 'pointer' }}>Sign out</button>
                </div>
            </nav>

            <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: '#1D1D1F', marginBottom: 4, letterSpacing: '-0.02em' }}>Your Profile</h1>
                <p style={{ fontSize: '0.875rem', color: '#86868b', marginBottom: 32 }}>{session?.user?.email}</p>

                {/* Profile Form */}
                <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid #F0F0F2', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 24 }}>Personal Information</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <InputField label="First name" name="first_name" value={form.first_name} onChange={handleChange} />
                        <InputField label="Last name" name="last_name" value={form.last_name} onChange={handleChange} />
                    </div>
                    <InputField label="Phone" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="+1 (555) 000-0000" />
                    <InputField label="LinkedIn URL" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                    {/* Resume — show friendly UI for stored files, URL input for external links */}
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>Resume</label>

                        {isStoredFile(form.resume_url) ? (
                            // Stored file — show pill + replace option
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 11, border: '1.5px solid #BBF7D0', background: '#F0FFF4' }}>
                                <span style={{ fontSize: '1rem' }}>📄</span>
                                <span style={{ fontSize: '0.875rem', color: '#166534', flex: 1 }}>Resume on file</span>
                                <a href={form.resume_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#1F6F8B', textDecoration: 'none' }}>View</a>
                                <span style={{ color: '#C5C5C7', fontSize: '0.75rem' }}>·</span>
                                <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.78rem', color: '#6b6b70', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    Replace
                                </button>
                                <button onClick={() => setForm(f => ({ ...f, resume_url: '' }))} style={{ fontSize: '0.78rem', color: '#cc4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    Remove
                                </button>
                                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadResume(f) }} />
                            </div>
                        ) : (
                            // No stored file — show drop zone + URL input
                            <>
                                <div
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadResume(f) }}
                                    style={{
                                        border: `2px dashed ${dragOver ? '#1F6F8B' : '#C5C5C7'}`,
                                        borderRadius: 11, padding: '20px', textAlign: 'center',
                                        cursor: uploading ? 'default' : 'pointer',
                                        background: dragOver ? 'rgba(31,111,139,0.04)' : '#FAFAFA',
                                        marginBottom: 10, transition: 'all 0.2s',
                                    }}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadResume(f) }} />
                                    {uploading ? (
                                        <span style={{ fontSize: '0.85rem', color: '#86868b' }}>Uploading…</span>
                                    ) : (
                                        <span style={{ fontSize: '0.85rem', color: '#86868b' }}>
                                            Drag a PDF/Word file here or{' '}
                                            <span style={{ color: '#1F6F8B', textDecoration: 'underline' }}>click to browse</span>
                                        </span>
                                    )}
                                </div>
                                <InputField label="Or paste a link" name="resume_url" value={form.resume_url ?? ''} onChange={handleChange} placeholder="https://drive.google.com/..." />
                            </>
                        )}
                    </div>
                </div>

                {/* Skills */}
                <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid #F0F0F2', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 16 }}>Skills</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {SKILL_OPTIONS.map(skill => {
                            const selected = form.skills?.includes(skill)
                            return (
                                <button key={skill} onClick={() => toggleSkill(skill)} style={{ padding: '7px 16px', borderRadius: 100, border: `1.5px solid ${selected ? '#1F6F8B' : '#E5E5E7'}`, background: selected ? 'rgba(31,111,139,0.08)' : 'white', color: selected ? '#1F6F8B' : '#6b6b70', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.18s' }}>
                                    {selected && '✓ '}{skill}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Save button */}
                {error && <div style={{ padding: '12px 16px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, fontSize: '0.875rem', color: '#CC0000', marginBottom: 16 }}>{error}</div>}
                {success && <div style={{ padding: '12px 16px', background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: '0.875rem', color: '#166534', marginBottom: 16 }}>✓ Profile saved successfully</div>}

                <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: saving ? '#86868b' : '#1F6F8B', color: 'white', fontSize: '0.95rem', fontWeight: 400, cursor: saving ? 'not-allowed' : 'pointer', marginBottom: 40, boxShadow: '0 4px 16px rgba(31,111,139,0.2)', transition: 'all 0.2s' }}>
                    {saving ? 'Saving...' : 'Save changes'}
                </button>

                {/* Danger Zone */}
                <div style={{ borderRadius: 20, border: '1.5px solid #FFD0D0', padding: '28px 32px', background: '#FFFAFA' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#CC0000', marginBottom: 6 }}>Danger Zone</h3>
                    <p style={{ fontSize: '0.85rem', color: '#86868b', marginBottom: 20, lineHeight: 1.6 }}>
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '10px 20px', border: '1.5px solid #CC0000', background: 'white', color: '#CC0000', borderRadius: 10, fontSize: '0.875rem', cursor: 'pointer' }}>
                            Delete my account
                        </button>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#CC0000', marginBottom: 12 }}>Are you absolutely sure? This cannot be undone.</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={handleDelete} disabled={deleting} style={{ padding: '10px 20px', border: 'none', background: '#CC0000', color: 'white', borderRadius: 10, fontSize: '0.875rem', cursor: deleting ? 'not-allowed' : 'pointer' }}>
                                    {deleting ? 'Deleting...' : 'Yes, delete account'}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '10px 20px', border: '1.5px solid #E5E5E7', background: 'white', borderRadius: 10, fontSize: '0.875rem', color: '#6b6b70', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
