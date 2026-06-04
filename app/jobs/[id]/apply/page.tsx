'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Job = {
  id: string
  title: string
  location: string | null
  employment_type: string | null
  job_type: string | null
  veteran_friendly: boolean | null
  status: string
}

type Candidate = {
  id: string
  first_name: string
  last_name: string
  resume_url: string | null
  skills: string[] | null
}

export default function ApplyPage() {
  const { id } = useParams() as { id: string }
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [coverNote, setCoverNote] = useState('')
  const [useExistingResume, setUseExistingResume] = useState(true)
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null)
  const [veteranConfirmed, setVeteranConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!session) {
      router.replace(`/apply?utm_job=${id}`)
      return
    }
    if (session.user.role !== 'candidate') {
      router.replace('/')
      return
    }
    const load = async () => {
      const [jobRes, candRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch(`/api/candidates/${session.user.id}`),
      ])
      if (!jobRes.ok) { router.replace('/jobs'); return }
      const jobData = await jobRes.json()
      setJob(jobData)

      if (!candRes.ok) { router.replace('/apply/onboarding'); return }
      const candData = await candRes.json()
      if (!candData.onboarding_complete) { router.replace('/apply/onboarding'); return }
      setCandidate(candData)
      setLoading(false)
    }
    load()
  }, [authStatus, session, id, router])

  const handleSubmit = async () => {
    if (!job || !candidate) return
    if (job.veteran_friendly && !veteranConfirmed) {
      setError('Please confirm your veteran status to apply.')
      return
    }
    setSubmitting(true)
    setError('')

    let resumeUrl = candidate.resume_url ?? null
    if (!useExistingResume && newResumeFile) {
      const fd = new FormData()
      fd.append('file', newResumeFile)
      const upRes = await fetch('/api/resume-upload', { method: 'POST', body: fd })
      if (!upRes.ok) {
        const d = await upRes.json()
        setError(d.error || 'Resume upload failed')
        setSubmitting(false)
        return
      }
      const { url } = await upRes.json()
      resumeUrl = url
    }

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: id,
        cover_note: coverNote.trim() || null,
        resume_url: resumeUrl,
      }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const d = await res.json()
      if (d.error?.toLowerCase().includes('already applied')) {
        setAlreadyApplied(true)
      } else {
        setError(d.error || 'Something went wrong')
      }
    }
    setSubmitting(false)
  }

  if (loading || authStatus === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: '#86868b' }}>Loading…</div>
    </div>
  )

  // ── Success screen ──
  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(31,139,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F8B50" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 400, color: '#1D1D1F', marginBottom: 10 }}>Application submitted</h2>
        <p style={{ fontSize: '0.9rem', color: '#86868b', lineHeight: 1.6, marginBottom: 28 }}>
          Your application for <strong>{job?.title}</strong> has been received. We'll be in touch.
        </p>
        <Link href="/apply/dashboard" style={{
          display: 'block', padding: '12px', background: '#1F6F8B', color: 'white',
          borderRadius: 10, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
          marginBottom: 12,
        }}>
          View my applications
        </Link>
        <Link href="/jobs" style={{ fontSize: '0.85rem', color: '#86868b', textDecoration: 'none' }}>
          Browse more jobs
        </Link>
      </div>
    </div>
  )

  // ── Already applied screen ──
  if (alreadyApplied) return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>✓</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 400, color: '#1D1D1F', marginBottom: 10 }}>Already applied</h2>
        <p style={{ fontSize: '0.9rem', color: '#86868b', marginBottom: 24 }}>You've already applied to this position.</p>
        <Link href="/apply/dashboard" style={{ color: '#1F6F8B', textDecoration: 'none', fontSize: '0.9rem' }}>
          View your applications →
        </Link>
      </div>
    </div>
  )

  if (!job || !candidate) return null

  const jobType = job.employment_type || job.job_type
  const input: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.95rem', borderRadius: 10,
    border: '1.5px solid #e5e5e7', fontSize: '0.9rem', outline: 'none',
    background: 'white', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center' }}>
        <Link href={`/jobs/${id}`} style={{ fontSize: '0.85rem', color: '#1F6F8B', textDecoration: 'none' }}>
          ← Back to job
        </Link>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
        {/* Job context */}
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #EBEBEB', marginBottom: 16 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>{job.title}</div>
          <div style={{ fontSize: '0.8rem', color: '#1F8B50', fontWeight: 500, marginBottom: 6 }}>Verified Employer</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {job.location && <span style={{ fontSize: '0.8rem', color: '#86868b' }}>{job.location}</span>}
            {jobType && (
              <span style={{ padding: '2px 9px', borderRadius: 100, background: '#F0F0F2', color: '#555', fontSize: '0.75rem' }}>
                {jobType.replace('-', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Profile summary */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #EBEBEB', marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Applying with your profile
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1F6F8B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, flexShrink: 0 }}>
              {candidate.first_name?.[0]}{candidate.last_name?.[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1D1D1F' }}>
                {candidate.first_name} {candidate.last_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#86868b' }}>{session?.user?.email}</div>
            </div>
          </div>
          {(candidate.skills ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(candidate.skills ?? []).slice(0, 6).map(s => (
                <span key={s} style={{ padding: '3px 10px', borderRadius: 100, background: '#F5F5F7', color: '#555', fontSize: '0.75rem' }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Resume */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #EBEBEB', marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Resume
          </div>

          {candidate.resume_url ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${useExistingResume ? '#1F6F8B' : '#e5e5e7'}`, cursor: 'pointer', background: useExistingResume ? 'rgba(31,111,139,0.04)' : 'white' }}>
                <input type="radio" checked={useExistingResume} onChange={() => setUseExistingResume(true)} style={{ accentColor: '#1F6F8B' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#1D1D1F', fontWeight: 500 }}>Use saved resume</div>
                  <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.78rem', color: '#1F6F8B', textDecoration: 'none' }}>
                    View file ↗
                  </a>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${!useExistingResume ? '#1F6F8B' : '#e5e5e7'}`, cursor: 'pointer', background: !useExistingResume ? 'rgba(31,111,139,0.04)' : 'white' }}>
                <input type="radio" checked={!useExistingResume} onChange={() => setUseExistingResume(false)} style={{ accentColor: '#1F6F8B' }} />
                <span style={{ fontSize: '0.875rem', color: '#1D1D1F' }}>Upload a different resume</span>
              </label>
              {!useExistingResume && (
                <div style={{ paddingLeft: 4 }}>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ fontSize: '0.85rem', color: '#333' }}
                    onChange={e => setNewResumeFile(e.target.files?.[0] ?? null)} />
                  <div style={{ fontSize: '0.75rem', color: '#86868b', marginTop: 4 }}>PDF, DOC, or DOCX · Max 5 MB</div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={input}
                onChange={e => setNewResumeFile(e.target.files?.[0] ?? null)} />
              <div style={{ fontSize: '0.75rem', color: '#86868b', marginTop: 6 }}>PDF, DOC, or DOCX · Max 5 MB</div>
            </div>
          )}
        </div>

        {/* Cover note */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #EBEBEB', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Cover note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: coverNote.length > 450 ? '#cc4444' : '#86868b' }}>
              {coverNote.length}/500
            </span>
          </div>
          <textarea
            value={coverNote}
            onChange={e => setCoverNote(e.target.value.slice(0, 500))}
            placeholder="Why are you a good fit for this role?"
            rows={5}
            style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Veteran confirmation */}
        {job.veteran_friendly && (
          <div style={{ background: 'rgba(45,122,58,0.05)', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(45,122,58,0.15)', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: '#333', lineHeight: 1.5 }}>
              <input type="checkbox" checked={veteranConfirmed} onChange={e => setVeteranConfirmed(e.target.checked)}
                style={{ accentColor: '#2D7A3A', marginTop: 2, flexShrink: 0 }} />
              I am a veteran or service member, as indicated in my profile, and I'm interested in this veteran-friendly role.
            </label>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 10, fontSize: '0.875rem', color: '#cc0000', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px', background: submitting ? '#86868b' : '#1F6F8B',
            color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 500,
            cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(31,111,139,0.2)',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#86868b', marginTop: 14 }}>
          Your profile and resume will be shared with this employer.
        </p>
      </div>
    </div>
  )
}
