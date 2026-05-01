'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const JOB_TYPES = ['full-time', 'part-time', 'contract']

export default function PostJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full-time',
    salary_min: '',
    salary_max: '',
    veteran_friendly: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') return null
  if (!session || session.user.role !== 'employer') {
    router.replace('/employers')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        location: form.location || 'Remote',
        job_type: form.job_type,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        veteran_friendly: form.veteran_friendly,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to post job')
      setSubmitting(false)
      return
    }

    router.push('/employers/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.875rem',
    borderRadius: 8,
    border: '1px solid #e5e5e7',
    fontSize: '0.9rem',
    outline: 'none',
    background: '#fafafa',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    color: '#555',
    marginBottom: 4,
    fontWeight: 500,
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#FBFBFD',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <Link href="/employers/dashboard" style={{ fontSize: '0.85rem', color: '#1F6F8B', textDecoration: 'none' }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 400, color: '#1D1D1F', margin: '0.75rem 0 0.25rem' }}>
            Post a job
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#86868b', margin: 0 }}>
            Jobs are reviewed and go live immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: 12,
          padding: '1.75rem',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem',
        }}>
          <div>
            <label style={labelStyle}>Job title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Senior Accountant"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Role responsibilities, requirements, and any additional context…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Remote, New York NY, etc."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Employment type</label>
              <select
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {JOB_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Salary min (optional)</label>
              <input
                type="number"
                name="salary_min"
                value={form.salary_min}
                onChange={handleChange}
                placeholder="60000"
                min={0}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Salary max (optional)</label>
              <input
                type="number"
                name="salary_max"
                value={form.salary_max}
                onChange={handleChange}
                placeholder="90000"
                min={0}
                style={inputStyle}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: '#444' }}>
            <input
              type="checkbox"
              name="veteran_friendly"
              checked={form.veteran_friendly}
              onChange={handleChange}
            />
            Mark as veteran-friendly
          </label>

          {error && (
            <div style={{
              background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 8,
              padding: '0.65rem 0.875rem', fontSize: '0.85rem', color: '#cc0000',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Link
              href="/employers/dashboard"
              style={{
                padding: '0.65rem 1.25rem', borderRadius: 8, border: '1px solid #e5e5e7',
                background: 'white', fontSize: '0.875rem', color: '#555', textDecoration: 'none',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.65rem 1.5rem', borderRadius: 8, border: 'none',
                background: submitting ? '#86868b' : '#1F6F8B', color: 'white',
                fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Posting…' : 'Post job'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
