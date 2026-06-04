'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    submitted: { label: 'Submitted', color: '#1F6F8B', bg: 'rgba(31,111,139,0.08)' },
    reviewed: { label: 'Reviewed', color: '#8B6200', bg: 'rgba(139,98,0,0.08)' },
    interview: { label: 'Interview', color: '#1F8B50', bg: 'rgba(31,139,80,0.08)' },
    offer: { label: 'Offer 🎉', color: '#2D7A3A', bg: 'rgba(45,122,58,0.1)' },
    rejected: { label: 'Not selected', color: '#cc4444', bg: 'rgba(204,68,68,0.08)' },
}

type Application = {
    id: string
    job_id: string
    status: string
    created_at: string
    jobs: { title: string; location: string; job_type: string }
    employer_feedback?: string
}

type Candidate = {
    id: string
    first_name: string
    last_name: string
    skills: string[]
    onboarding_complete: boolean
}

type Job = {
    id: string
    title: string
    location: string | null
    job_type: string | null
    employment_type: string | null
    experience_level: string | null
    salary_min: number | null
    salary_max: number | null
    veteran_friendly: boolean | null
    required_skills: string[] | null
    is_remote: boolean | null
    created_at: string
}

function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null
    const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `${fmt(min)}+`
    return `Up to ${fmt(max!)}`
}

export default function CandidateDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [candidate, setCandidate] = useState<Candidate | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [jobs, setJobs] = useState<Job[]>([])
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/apply')
        if (status === 'authenticated' && session?.user?.role !== 'candidate') router.push('/apply')
    }, [status, session, router])

    useEffect(() => {
        if (!session?.user?.id) return
        const load = async () => {
            const cRes = await fetch(`/api/candidates/${session.user.id}`)

            if (!cRes.ok) {
                router.replace('/apply/onboarding')
                return
            }

            const candidateData = await cRes.json()
            if (!candidateData.onboarding_complete) {
                router.replace('/apply/onboarding')
                return
            }

            setCandidate(candidateData)

            const [aRes, jRes] = await Promise.all([
                fetch(`/api/applications?candidate_id=${session.user.id}`),
                fetch('/api/jobs/public'),
            ])
            if (aRes.ok) {
                const apps: Application[] = await aRes.json()
                setApplications(apps)
                setAppliedJobIds(new Set(apps.map(a => a.job_id)))
            }
            if (jRes.ok) setJobs(await jRes.json())
            setLoading(false)
        }
        load()
    }, [session?.user?.id])

    if (loading || !session) {
        return (
            <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#86868b' }}>Loading...</div>
            </div>
        )
    }

    const name = candidate ? `${candidate.first_name} ${candidate.last_name}` : session.user.email || ''
    const initials = candidate?.first_name && candidate?.last_name ? `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase() : '?'
    const stats = {
        submitted: applications.length,
        interview: applications.filter(a => a.status === 'interview').length,
        offer: applications.filter(a => a.status === 'offer').length,
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FBFBFD', fontFamily: 'var(--font-body-var)' }}>
            {/* Top Nav */}
            <nav style={{ background: 'white', borderBottom: '1px solid #F0F0F2', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1F6F8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F' }}>High Point Search</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Link href="/apply/profile" style={{ fontSize: '0.875rem', color: '#6b6b70', textDecoration: 'none' }}>My Profile</Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })} style={{ fontSize: '0.875rem', color: '#cc4444', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Sign out</button>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1F6F8B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                        {initials}
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 40px' }}>
                {/* Welcome Header */}
                <div style={{ marginBottom: 36 }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 300, color: '#1D1D1F', marginBottom: 4, letterSpacing: '-0.02em' }}>
                        Welcome back, {candidate?.first_name || 'there'} 👋
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#86868b' }}>{session.user.email}</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
                    {[
                        { label: 'Applications', value: stats.submitted, color: '#1F6F8B' },
                        { label: 'Interviews', value: stats.interview, color: '#1F8B50' },
                        { label: 'Offers', value: stats.offer, color: '#2D7A3A' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'white', borderRadius: 18, padding: '24px 28px', border: '1px solid #F0F0F2', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 300, color, marginBottom: 4 }}>{value}</div>
                            <div style={{ fontSize: '0.85rem', color: '#86868b' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Applications */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F0F0F2', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px 28px', borderBottom: '1px solid #F0F0F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F' }}>Your Applications</h2>
                        <span style={{ fontSize: '0.8rem', color: '#86868b' }}>{applications.length} total</span>
                    </div>

                    {applications.length === 0 ? (
                        <div style={{ padding: '60px 28px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                            <p style={{ fontSize: '1rem', color: '#1D1D1F', fontWeight: 400, marginBottom: 6 }}>No applications yet</p>
                            <p style={{ fontSize: '0.875rem', color: '#86868b' }}>Our team will reach out as we match you with opportunities.</p>
                        </div>
                    ) : (
                        <div>
                            {applications.map((app, i) => {
                                const conf = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted
                                return (
                                    <div key={app.id} style={{ padding: '20px 28px', borderBottom: i < applications.length - 1 ? '1px solid #F8F8FA' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                                                {app.jobs?.title || 'Position'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#86868b' }}>
                                                {app.jobs?.location} · {app.jobs?.job_type?.replace('-', ' ')} · Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            {app.employer_feedback && (
                                                <div style={{ marginTop: 8, padding: '8px 12px', background: '#F5F5F7', borderRadius: 8, fontSize: '0.8rem', color: '#444', fontStyle: 'italic' }}>
                                                    "{app.employer_feedback}"
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '5px 14px', borderRadius: 100, background: conf.bg, color: conf.color, fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                            {conf.label}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Browse Jobs */}
                <div style={{ marginTop: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F' }}>Browse Open Positions</h2>
                        <span style={{ fontSize: '0.8rem', color: '#86868b' }}>{jobs.length} available</span>
                    </div>

                    {jobs.length === 0 ? (
                        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F0F0F2', padding: '48px 28px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.9rem', color: '#86868b' }}>No open positions right now — check back soon.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {jobs.map(job => {
                                const applied = appliedJobIds.has(job.id)
                                const salary = formatSalary(job.salary_min, job.salary_max)
                                const type = job.employment_type || job.job_type
                                const skills = (job.required_skills ?? []).slice(0, 3)
                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => router.push(`/jobs/${job.id}`)}
                                        style={{ background: 'white', borderRadius: 18, border: '1px solid #F0F0F2', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 3 }}>{job.title}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#1F8B50', fontWeight: 500, marginBottom: 8 }}>Verified Employer</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: skills.length > 0 ? 6 : 0 }}>
                                                {job.location && <span style={{ fontSize: '0.75rem', color: '#86868b' }}>{job.location}</span>}
                                                {type && <span style={{ padding: '2px 8px', borderRadius: 100, background: '#F0F0F2', color: '#555', fontSize: '0.72rem', fontWeight: 500 }}>{type.replace('-', ' ')}</span>}
                                                {job.experience_level && <span style={{ fontSize: '0.72rem', color: '#86868b' }}>{job.experience_level}</span>}
                                                {salary && <span style={{ fontSize: '0.75rem', color: '#1F6F8B', fontWeight: 500 }}>{salary}</span>}
                                                {job.veteran_friendly && <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(45,122,58,0.08)', color: '#2D7A3A', fontSize: '0.7rem', fontWeight: 500 }}>Veteran-friendly</span>}
                                            </div>
                                            {skills.length > 0 && (
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    {skills.map(s => <span key={s} style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(31,111,139,0.07)', color: '#1F6F8B', fontSize: '0.7rem', fontWeight: 500 }}>{s}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        {applied ? (
                                            <span style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 9, background: 'rgba(31,139,80,0.06)', color: '#1F8B50', fontSize: '0.82rem', fontWeight: 500, border: '1.5px solid rgba(31,139,80,0.2)', whiteSpace: 'nowrap' }}>
                                                Applied ✓
                                            </span>
                                        ) : (
                                            <a
                                                href={`/jobs/${job.id}/apply`}
                                                onClick={e => e.stopPropagation()}
                                                style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 9, background: '#1F6F8B', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}
                                            >
                                                Apply
                                            </a>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
