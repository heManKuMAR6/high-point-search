'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Job = {
  id: string
  title: string
  location: string | null
  job_type: string | null
  employment_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  required_skills: string[] | null
  veteran_friendly: boolean | null
  is_remote: boolean | null
  created_at: string
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'temp-to-hire']
const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry-level' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'executive', label: 'Executive' },
]

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null
  const f = (n: number) => n >= 1000 ? '$' + Math.round(n / 1000) + 'k' : '$' + n
  if (min && max) return `${f(min)} – ${f(max)}`
  if (min) return `${f(min)}+`
  return `Up to ${f(max!)}`
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function TypeBadge({ value }: { value: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100, background: '#F0F0F2',
      color: '#555', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {value.replace('-', ' ')}
    </span>
  )
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState('')
  const [veteranFriendly, setVeteranFriendly] = useState(false)

  useEffect(() => {
    fetch('/api/jobs/public')
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setError('Failed to load jobs.'); setLoading(false) })
  }, [])

  const toggleType = (t: string) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const filtered = jobs.filter(job => {
    const type = job.employment_type || job.job_type || ''
    if (remoteOnly && !job.is_remote && !(job.location ?? '').toLowerCase().includes('remote')) return false
    if (selectedTypes.length > 0 && !selectedTypes.includes(type)) return false
    if (selectedLevel && job.experience_level !== selectedLevel) return false
    if (veteranFriendly && !job.veteran_friendly) return false
    return true
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FBFBFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: '#86868b' }}>Loading positions…</div>
    </div>
  )

  if (error) return (
    <div style={{ padding: '3rem', color: '#cc0000', fontFamily: 'system-ui, sans-serif' }}>{error}</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FBFBFD', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '32px 40px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: '#1D1D1F', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Open Positions
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#86868b', margin: 0 }}>
            {filtered.length} of {jobs.length} active positions
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 40px' }}>
        {/* Filters */}
        <div style={{
          background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #EBEBEB',
          marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', fontSize: '0.85rem',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#333' }}>
            <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} style={{ accentColor: '#1F6F8B' }} />
            Remote only
          </label>
          <span style={{ color: '#ddd' }}>|</span>
          <span style={{ color: '#86868b', fontSize: '0.8rem' }}>Type:</span>
          {EMPLOYMENT_TYPES.map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
              <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} style={{ accentColor: '#1F6F8B' }} />
              {t.replace('-', ' ')}
            </label>
          ))}
          <span style={{ color: '#ddd' }}>|</span>
          <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}
            style={{ border: '1px solid #e5e5e7', borderRadius: 7, padding: '4px 8px', fontSize: '0.82rem', outline: 'none', background: 'white', color: '#333', cursor: 'pointer' }}>
            <option value="">All levels</option>
            {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#333' }}>
            <input type="checkbox" checked={veteranFriendly} onChange={e => setVeteranFriendly(e.target.checked)} style={{ accentColor: '#1F6F8B' }} />
            Veteran-friendly
          </label>
        </div>

        {/* Job cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#86868b' }}>
            No positions match the current filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(job => {
              const salary = formatSalary(job.salary_min, job.salary_max)
              const skills = (job.required_skills ?? []).slice(0, 3)
              const type = job.employment_type || job.job_type

              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  style={{
                    background: 'white', border: '1px solid #EBEBEB', borderRadius: 16,
                    padding: '20px 24px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#d0d0d0' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#EBEBEB' }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 3 }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#1F8B50', fontWeight: 500, marginBottom: 8 }}>
                      Verified Employer
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: skills.length > 0 ? 8 : 0 }}>
                      {job.location && <span style={{ fontSize: '0.82rem', color: '#555' }}>{job.location}</span>}
                      {job.is_remote && <TypeBadge value="Remote" />}
                      {type && <TypeBadge value={type} />}
                      {job.experience_level && (
                        <span style={{ fontSize: '0.78rem', color: '#86868b' }}>
                          {EXPERIENCE_LEVELS.find(l => l.value === job.experience_level)?.label || job.experience_level}
                        </span>
                      )}
                      {salary && <span style={{ fontSize: '0.82rem', color: '#1F6F8B', fontWeight: 500 }}>{salary}</span>}
                      {job.veteran_friendly && (
                        <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(45,122,58,0.08)', color: '#2D7A3A', fontSize: '0.72rem', fontWeight: 500 }}>
                          Veteran-friendly
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#C0C0C5' }}>{timeAgo(job.created_at)}</span>
                    </div>
                    {skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {skills.map(s => (
                          <span key={s} style={{ padding: '2px 9px', borderRadius: 100, background: 'rgba(31,111,139,0.07)', color: '#1F6F8B', fontSize: '0.73rem', fontWeight: 500 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <a
                    href={`/jobs/${job.id}/apply`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flexShrink: 0, padding: '8px 20px', background: '#1F6F8B', color: 'white',
                      borderRadius: 9, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                      whiteSpace: 'nowrap', alignSelf: 'center',
                    }}
                  >
                    Apply
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
