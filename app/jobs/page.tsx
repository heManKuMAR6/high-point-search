'use client'

import { useState, useEffect } from 'react'

type Job = {
  id: string
  employer_id: string
  title: string
  location: string | null
  job_type: string | null
  created_at: string
  salary_min?: number | null
  salary_max?: number | null
  veteran_friendly?: boolean | null
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract']

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null
  const f = (n: number) => '$' + n.toLocaleString()
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [veteranFriendly, setVeteranFriendly] = useState(false)

  useEffect(() => {
    fetch('/api/jobs/public')
      .then(r => r.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load jobs. Please try again.')
        setLoading(false)
      })
  }, [])

  const toggleType = (type: string) =>
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )

  const filtered = jobs.filter(job => {
    if (remoteOnly && !(job.location ?? '').toLowerCase().includes('remote')) return false
    if (selectedTypes.length > 0 && !selectedTypes.includes(job.job_type ?? '')) return false
    if (veteranFriendly && !job.veteran_friendly) return false
    return true
  })

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        Loading positions...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#cc0000', fontFamily: 'system-ui, sans-serif' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.25rem' }}>Open Positions</h1>
      <p style={{ color: '#86868b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        {filtered.length} of {jobs.length} active positions
      </p>

      {/* ── Filters ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        marginBottom: '1.75rem',
        padding: '0.875rem 1rem',
        background: '#f5f5f7',
        borderRadius: '10px',
        fontSize: '0.875rem',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={e => setRemoteOnly(e.target.checked)}
          />
          Remote only
        </label>

        <span style={{ color: '#c0c0c5' }}>|</span>

        <span style={{ color: '#555' }}>Type:</span>
        {EMPLOYMENT_TYPES.map(type => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
            />
            {type}
          </label>
        ))}

        <span style={{ color: '#c0c0c5' }}>|</span>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={veteranFriendly}
            onChange={e => setVeteranFriendly(e.target.checked)}
          />
          Veteran-friendly
        </label>
      </div>

      {/* ── Job cards ── */}
      {filtered.length === 0 ? (
        <p style={{ color: '#86868b' }}>No positions match the current filters.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(job => {
            const salary = formatSalary(job.salary_min, job.salary_max)
            const applyUrl =
              `/apply?utm_source=highpointsearch` +
              `&utm_job=${job.id}` +
              `&utm_employer=${job.employer_id}`

            return (
              <div
                key={job.id}
                style={{
                  border: '1px solid #e5e5e7',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: '0.2rem' }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#86868b', marginBottom: '0.6rem' }}>
                    Verified Employer
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                    {job.location && (
                      <span style={{ color: '#444' }}>{job.location}</span>
                    )}
                    {job.job_type && (
                      <span style={{
                        padding: '2px 9px',
                        background: '#f0f0f2',
                        borderRadius: '100px',
                        fontSize: '0.78rem',
                        color: '#555',
                      }}>
                        {job.job_type}
                      </span>
                    )}
                    {salary && (
                      <span style={{ color: '#1f6f8b', fontWeight: 500 }}>{salary}</span>
                    )}
                    <span style={{ color: '#c0c0c5', fontSize: '0.78rem' }}>
                      {timeAgo(job.created_at)}
                    </span>
                  </div>
                </div>

                <a
                  href={applyUrl}
                  style={{
                    flexShrink: 0,
                    padding: '0.55rem 1.2rem',
                    background: '#1f6f8b',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
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
  )
}
