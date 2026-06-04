'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Job = {
  id: string
  title: string
  description: string | null
  location: string | null
  job_type: string | null
  employment_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  required_skills: string[] | null
  preferred_qualifications: string | null
  benefits: string[] | null
  is_remote: boolean | null
  veteran_friendly: boolean | null
  application_deadline: string | null
  hiring_manager_name: string | null
  number_of_openings: number | null
  created_at: string
  status: string
}

const EXP_LABELS: Record<string, string> = {
  entry: 'Entry-level', mid: 'Mid-level', senior: 'Senior', executive: 'Executive',
}

const BENEFIT_ICONS: Record<string, string> = {
  'Health insurance': '🏥', '401k': '💰', 'Remote work': '🏠',
  'Flexible hours': '⏰', 'PTO': '🌴', 'Paid training': '📚',
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null
  const f = (n: number) => '$' + n.toLocaleString()
  if (min && max) return `${f(min)} – ${f(max)} / yr`
  if (min) return `${f(min)}+ / yr`
  return `Up to ${f(max!)} / yr`
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'Posted today'
  if (days === 1) return 'Posted 1 day ago'
  return `Posted ${days} days ago`
}

function Badge({ text, color = '#555', bg = '#F0F0F2' }: { text: string; color?: string; bg?: string }) {
  return (
    <span style={{ padding: '4px 12px', borderRadius: 100, background: bg, color, fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}

export default function JobDetailPage() {
  const { id } = useParams() as { id: string }
  const { data: session } = useSession()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return }
        setJob(await r.json())
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: '#86868b' }}>Loading…</div>
    </div>
  )

  if (notFound || !job) return (
    <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>404</div>
      <p style={{ color: '#86868b', marginBottom: 20 }}>This position was not found.</p>
      <Link href="/jobs" style={{ color: '#1F6F8B', textDecoration: 'none' }}>← Browse all jobs</Link>
    </div>
  )

  const isCandidate = session?.user?.role === 'candidate'
  const applyUrl = isCandidate ? `/jobs/${id}/apply` : `/apply?utm_job=${id}`
  const salary = formatSalary(job.salary_min, job.salary_max)
  const type = job.employment_type || job.job_type
  const skills = job.required_skills ?? []
  const benefits = job.benefits ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/jobs" style={{ fontSize: '0.85rem', color: '#1F6F8B', textDecoration: 'none' }}>
          ← All positions
        </Link>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header card */}
        <div style={{ background: 'white', borderRadius: 18, padding: '32px 36px', border: '1px solid #EBEBEB', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: '#1D1D1F', marginBottom: 6, letterSpacing: '-0.02em' }}>
                {job.title}
              </h1>
              <div style={{ fontSize: '0.85rem', color: '#1F8B50', fontWeight: 500, marginBottom: 14 }}>
                Verified Employer
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {job.location && <Badge text={job.location} />}
                {job.is_remote && <Badge text="Remote" color="#1F6F8B" bg="rgba(31,111,139,0.08)" />}
                {type && <Badge text={type.replace('-', ' ')} />}
                {job.experience_level && <Badge text={EXP_LABELS[job.experience_level] || job.experience_level} />}
                {job.veteran_friendly && <Badge text="Veteran-friendly" color="#2D7A3A" bg="rgba(45,122,58,0.08)" />}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: '0.82rem', color: '#86868b' }}>
                {salary && (
                  <span style={{ color: '#1F6F8B', fontWeight: 600, fontSize: '0.9rem' }}>{salary}</span>
                )}
                {job.number_of_openings && job.number_of_openings > 1 && (
                  <span>{job.number_of_openings} openings</span>
                )}
                {job.application_deadline && (
                  <span>Apply by {new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
                <span>{timeAgo(job.created_at)}</span>
              </div>
            </div>

            <a
              href={applyUrl}
              style={{
                flexShrink: 0, padding: '12px 28px', background: '#1F6F8B', color: 'white',
                borderRadius: 12, textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500,
                boxShadow: '0 4px 16px rgba(31,111,139,0.25)', whiteSpace: 'nowrap',
              }}
            >
              Apply now
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Description */}
            <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', border: '1px solid #EBEBEB' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                About this role
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {job.description}
              </div>
            </div>

            {/* Required skills */}
            {skills.length > 0 && (
              <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', border: '1px solid #EBEBEB' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  Required skills
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skills.map(s => (
                    <span key={s} style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(31,111,139,0.07)', color: '#1F6F8B', fontSize: '0.82rem', fontWeight: 500 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred qualifications */}
            {job.preferred_qualifications && (
              <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', border: '1px solid #EBEBEB' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  Preferred qualifications
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {job.preferred_qualifications}
                </div>
              </div>
            )}

            {/* Benefits */}
            {benefits.length > 0 && (
              <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', border: '1px solid #EBEBEB' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  Benefits
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {benefits.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, background: '#F5F5F7', fontSize: '0.85rem', color: '#333' }}>
                      <span>{BENEFIT_ICONS[b] || '✓'}</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #EBEBEB' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Job details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {type && <DetailRow icon="💼" label={type.replace('-', ' ')} />}
                {job.experience_level && <DetailRow icon="📊" label={EXP_LABELS[job.experience_level] || job.experience_level} />}
                {job.number_of_openings && <DetailRow icon="👥" label={`${job.number_of_openings} opening${job.number_of_openings > 1 ? 's' : ''}`} />}
                {job.is_remote && <DetailRow icon="🏠" label="Remote" />}
                {job.application_deadline && (
                  <DetailRow icon="📅" label={`Deadline: ${new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} />
                )}
                {job.veteran_friendly && <DetailRow icon="🎖️" label="Veteran-friendly" />}
                {job.hiring_manager_name && <DetailRow icon="👤" label={job.hiring_manager_name} />}
              </div>
            </div>

            <a
              href={applyUrl}
              style={{
                display: 'block', textAlign: 'center', padding: '14px', background: '#1F6F8B', color: 'white',
                borderRadius: 12, textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500,
                boxShadow: '0 4px 16px rgba(31,111,139,0.2)',
              }}
            >
              Apply to this position
            </a>

            <Link href="/jobs" style={{ display: 'block', textAlign: 'center', fontSize: '0.82rem', color: '#86868b', textDecoration: 'none' }}>
              Browse all positions
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#333' }}>
      <span style={{ fontSize: '0.95rem' }}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}
