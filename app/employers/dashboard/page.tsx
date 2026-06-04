'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Job = {
    id: string; title: string; location: string; job_type: string; status: string
    created_at: string; applications: { count: number }[]
}

type Application = {
    id: string; job_id: string; status: string; created_at: string; employer_feedback: string
    candidates: { id: string; first_name: string; last_name: string; resume_url: string; skills: string[] }
    jobs: { title: string }
}

const STATUS_OPTIONS = ['submitted', 'reviewed', 'interview', 'offer', 'rejected']
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    submitted: { label: 'Submitted', color: '#1F6F8B', bg: 'rgba(31,111,139,0.08)' },
    reviewed: { label: 'Reviewed', color: '#8B6200', bg: 'rgba(139,98,0,0.08)' },
    interview: { label: 'Interview', color: '#1F8B50', bg: 'rgba(31,139,80,0.08)' },
    offer: { label: 'Offer', color: '#2D7A3A', bg: 'rgba(45,122,58,0.1)' },
    rejected: { label: 'Not selected', color: '#cc4444', bg: 'rgba(204,68,68,0.08)' },
}

export default function EmployerDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [employer, setEmployer] = useState<{ company_name: string; id: string } | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'jobs' | 'submissions'>('jobs')
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [showPostJob, setShowPostJob] = useState(false)
    const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', job_type: 'full-time' })
    const [posting, setPosting] = useState(false)
    const [postError, setPostError] = useState('')
    const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({})
    const [savingFeedback, setSavingFeedback] = useState<string | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/employers')
        if (status === 'authenticated' && session?.user?.role !== 'employer') router.push('/employers')
    }, [status, session, router])

    useEffect(() => {
        if (!session?.user?.id) return
        const load = async () => {
            const eRes = await fetch(`/api/employers/${session.user.id}`)
            if (eRes.ok) {
                const emp = await eRes.json()
                setEmployer(emp)
                const [jRes, aRes] = await Promise.all([
                    fetch(`/api/jobs?employer_id=${emp.id}`),
                    fetch(`/api/applications?employer_id=${emp.id}`),
                ])
                if (jRes.ok) setJobs(await jRes.json())
                if (aRes.ok) setApplications(await aRes.json())
            }
            setLoading(false)
        }
        load()
    }, [session?.user?.id])

    const handlePostJob = async () => {
        if (!jobForm.title || !jobForm.description) { setPostError('Title and description are required'); return }
        setPosting(true); setPostError('')
        const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jobForm) })
        if (res.ok) {
            const newJob = await res.json()
            setJobs(j => [newJob, ...j])
            setJobForm({ title: '', description: '', location: '', job_type: 'full-time' })
            setShowPostJob(false)
        } else { const d = await res.json(); setPostError(d.error || 'Failed to post job') }
        setPosting(false)
    }

    const handleFeedbackSave = async (appId: string, status: string) => {
        setSavingFeedback(appId)
        const feedback = feedbackMap[appId] ?? ''
        await fetch(`/api/applications/${appId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, employer_feedback: feedback }) })
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status, employer_feedback: feedback } : a))
        setSavingFeedback(null)
    }

    const filteredApps = selectedJobId ? applications.filter(a => a.job_id === selectedJobId) : applications

    if (loading) return <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#86868b' }}>Loading...</div></div>

    const totalApplicants = applications.length
    const activeJobs = jobs.filter(j => j.status === 'active').length

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F7', fontFamily: 'var(--font-body-var)' }}>
            {/* Nav */}
            <nav style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1F6F8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1D1D1F' }}>High Point Search</div>
                        {employer && <div style={{ fontSize: '0.72rem', color: '#86868b' }}>{employer.company_name}</div>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => signOut({ callbackUrl: '/employers' })} style={{ fontSize: '0.875rem', color: '#cc4444', border: 'none', background: 'none', cursor: 'pointer' }}>Sign out</button>
                </div>
            </nav>

            <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: 4 }}>
                            {employer?.company_name || 'Employer Dashboard'}
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: '#86868b' }}>{session?.user?.email}</p>
                    </div>
                    <button onClick={() => setShowPostJob(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: '#1F6F8B', color: 'white', border: 'none', borderRadius: 12, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.2)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                        Post a job
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Active Listings', value: activeJobs, color: '#1F6F8B' },
                        { label: 'Total Applicants', value: totalApplicants, color: '#1F8B50' },
                        { label: 'Interviews Scheduled', value: applications.filter(a => a.status === 'interview').length, color: '#8B6200' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'white', borderRadius: 16, padding: '22px 26px', border: '1px solid #EBEBEB' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 300, color, marginBottom: 4 }}>{value}</div>
                            <div style={{ fontSize: '0.82rem', color: '#86868b' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 12, padding: 4, border: '1px solid #EBEBEB', marginBottom: 24, width: 'fit-content' }}>
                    {(['jobs', 'submissions'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === tab ? 500 : 400, background: activeTab === tab ? '#1F6F8B' : 'transparent', color: activeTab === tab ? 'white' : '#6b6b70', transition: 'all 0.18s' }}>
                            {tab === 'jobs' ? `Job Listings (${jobs.length})` : `Submissions (${applications.length})`}
                        </button>
                    ))}
                </div>

                {/* Job Listings Tab */}
                {activeTab === 'jobs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {jobs.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: 18, padding: '60px', textAlign: 'center', border: '1px solid #EBEBEB' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                                <p style={{ fontSize: '1rem', color: '#1D1D1F', fontWeight: 400, marginBottom: 6 }}>No job listings yet</p>
                                <p style={{ fontSize: '0.875rem', color: '#86868b', marginBottom: 24 }}>Post your first job to start receiving candidates from High Point Search.</p>
                                <button onClick={() => setShowPostJob(true)} style={{ padding: '11px 24px', background: '#1F6F8B', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.9rem', cursor: 'pointer' }}>Post a job</button>
                            </div>
                        ) : jobs.map(job => (
                            <div key={job.id} style={{ background: 'white', borderRadius: 18, padding: '22px 28px', border: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F' }}>{job.title}</div>
                                        <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 500, background: job.status === 'active' ? 'rgba(31,139,80,0.1)' : 'rgba(134,134,139,0.1)', color: job.status === 'active' ? '#1F8B50' : '#86868b' }}>
                                            {job.status === 'active' ? 'Active' : job.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#86868b' }}>
                                        {job.location || 'Remote'} · {job.job_type?.replace('-', ' ')} · Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ padding: '5px 14px', borderRadius: 100, background: 'rgba(31,111,139,0.08)', color: '#1F6F8B', fontSize: '0.78rem', fontWeight: 500 }}>
                                        {job.applications?.[0]?.count ?? 0} applicant{job.applications?.[0]?.count !== 1 ? 's' : ''}
                                    </div>
                                    <button onClick={() => { setSelectedJobId(job.id); setActiveTab('submissions') }} style={{ fontSize: '0.82rem', color: '#1F6F8B', border: '1px solid rgba(31,111,139,0.25)', borderRadius: 8, padding: '6px 14px', background: 'rgba(31,111,139,0.04)', cursor: 'pointer' }}>
                                        View applicants →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                    <div>
                        {selectedJobId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <span style={{ fontSize: '0.875rem', color: '#86868b' }}>Filtered by job:</span>
                                <span style={{ fontSize: '0.875rem', color: '#1F6F8B', fontWeight: 500 }}>{jobs.find(j => j.id === selectedJobId)?.title}</span>
                                <button onClick={() => setSelectedJobId(null)} style={{ fontSize: '0.78rem', color: '#86868b', border: '1px solid #E5E5E7', borderRadius: 6, padding: '3px 8px', background: 'white', cursor: 'pointer' }}>Clear</button>
                            </div>
                        )}
                        {filteredApps.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: 18, padding: '60px', textAlign: 'center', border: '1px solid #EBEBEB' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
                                <p style={{ fontSize: '1rem', color: '#1D1D1F', marginBottom: 6 }}>No submissions yet</p>
                                <p style={{ fontSize: '0.875rem', color: '#86868b' }}>Candidates will appear here after High Point Search matches them with your open positions.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {filteredApps.map(app => {
                                    const conf = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted
                                    return (
                                        <div key={app.id} style={{ background: 'white', borderRadius: 18, padding: '24px 28px', border: '1px solid #EBEBEB' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 3 }}>
                                                        {app.candidates?.first_name} {app.candidates?.last_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#86868b', marginBottom: 6 }}>
                                                        For: {app.jobs?.title} · Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    {app.candidates?.skills?.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {app.candidates.skills.slice(0, 5).map(s => (
                                                                <span key={s} style={{ padding: '3px 10px', background: '#F5F5F7', borderRadius: 100, fontSize: '0.75rem', color: '#555' }}>{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                    <div style={{ padding: '5px 14px', borderRadius: 100, background: conf.bg, color: conf.color, fontSize: '0.78rem', fontWeight: 500 }}>{conf.label}</div>
                                                    {app.candidates?.resume_url && (
                                                        <a href={app.candidates.resume_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#1F6F8B', textDecoration: 'none', border: '1px solid rgba(31,111,139,0.25)', borderRadius: 8, padding: '5px 12px', background: 'rgba(31,111,139,0.04)' }}>
                                                            View Resume ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status & Feedback Controls */}
                                            <div style={{ borderTop: '1px solid #F5F5F7', paddingTop: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#86868b', marginBottom: 5 }}>Feedback for candidate</label>
                                                    <input
                                                        value={feedbackMap[app.id] ?? app.employer_feedback ?? ''}
                                                        onChange={e => setFeedbackMap(m => ({ ...m, [app.id]: e.target.value }))}
                                                        placeholder="Optional note visible to the candidate..."
                                                        style={{ width: '100%', padding: '9px 13px', borderRadius: 9, border: '1.5px solid #E5E5E7', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#86868b', marginBottom: 5 }}>Update status</label>
                                                    <select
                                                        defaultValue={app.status}
                                                        onChange={e => handleFeedbackSave(app.id, e.target.value)}
                                                        style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E5E7', fontSize: '0.85rem', outline: 'none', background: 'white', cursor: 'pointer' }}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => handleFeedbackSave(app.id, app.status)}
                                                    disabled={savingFeedback === app.id}
                                                    style={{ padding: '9px 18px', borderRadius: 9, background: '#1F6F8B', color: 'white', border: 'none', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', opacity: savingFeedback === app.id ? 0.6 : 1 }}
                                                >
                                                    {savingFeedback === app.id ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Post Job Modal */}
            {showPostJob && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setShowPostJob(false) }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: '36px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 4 }}>Post a new job</h2>
                        <p style={{ fontSize: '0.875rem', color: '#86868b', marginBottom: 24 }}>High Point Search will match qualified candidates to this position.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Job title <span style={{ color: '#CC3333' }}>*</span></label>
                                <input value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Operations Manager" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Description <span style={{ color: '#CC3333' }}>*</span></label>
                                <textarea value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role, responsibilities, and what you're looking for..." rows={5} style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Location</label>
                                    <input value={jobForm.location} onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} placeholder="Remote / New York, NY" style={{ width: '100%', padding: '11px 15px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Type</label>
                                    <select value={jobForm.job_type} onChange={e => setJobForm(f => ({ ...f, job_type: e.target.value }))} style={{ width: '100%', padding: '11px 12px', borderRadius: 11, border: '1.5px solid #E5E5E7', fontSize: '0.875rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {postError && <div style={{ padding: '11px 14px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, fontSize: '0.875rem', color: '#CC0000', marginTop: 16 }}>{postError}</div>}

                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setShowPostJob(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E5E5E7', background: 'white', color: '#6b6b70', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handlePostJob} disabled={posting} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: posting ? '#86868b' : '#1F6F8B', color: 'white', fontSize: '0.9rem', cursor: posting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(31,111,139,0.2)' }}>
                                {posting ? 'Posting...' : 'Post job listing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
