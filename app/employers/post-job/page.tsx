'use client'

import { useState, KeyboardEvent } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STEPS = ['Basic Info', 'Role Details', 'Skills & Benefits', 'Review']

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temp-to-hire', label: 'Temp-to-hire' },
]

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry-level' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'executive', label: 'Executive' },
]

const BENEFIT_OPTIONS = [
  'Health insurance', '401k', 'Remote work', 'Flexible hours', 'PTO', 'Paid training',
]

type FormState = {
  title: string
  location: string
  employment_type: string
  is_remote: boolean
  number_of_openings: number
  application_deadline: string
  experience_level: string
  salary_min: string
  salary_max: string
  description: string
  preferred_qualifications: string
  required_skills: string[]
  benefits: string[]
  veteran_friendly: boolean
  hiring_manager_name: string
  hiring_manager_email: string
}

const initial: FormState = {
  title: '', location: '', employment_type: 'full-time', is_remote: false,
  number_of_openings: 1, application_deadline: '',
  experience_level: 'mid', salary_min: '', salary_max: '',
  description: '', preferred_qualifications: '',
  required_skills: [], benefits: [], veteran_friendly: false,
  hiring_manager_name: '', hiring_manager_email: '',
}

const input: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.9rem', borderRadius: 9,
  border: '1.5px solid #e5e5e7', fontSize: '0.9rem', outline: 'none',
  background: '#fafafa', boxSizing: 'border-box',
}
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#444', marginBottom: 5,
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i < current ? '#1F6F8B' : i === current ? '#1F6F8B' : '#E5E5E7',
              color: i <= current ? 'white' : '#86868b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 500,
              boxShadow: i === current ? '0 0 0 4px rgba(31,111,139,0.15)' : 'none',
            }}>
              {i < current
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                : i + 1}
            </div>
            <div style={{ fontSize: '0.7rem', color: i <= current ? '#1F6F8B' : '#86868b', whiteSpace: 'nowrap', fontWeight: i === current ? 600 : 400 }}>
              {step}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#1F6F8B' : '#E5E5E7', margin: '0 8px', marginBottom: 16 }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PostJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initial)
  const [skillInput, setSkillInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') return null
  if (!session || session.user.role !== 'employer') {
    router.replace('/employers')
    return null
  }

  const set = (field: keyof FormState, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.required_skills.includes(s)) {
      set('required_skills', [...form.required_skills, s])
    }
    setSkillInput('')
  }

  const removeSkill = (s: string) =>
    set('required_skills', form.required_skills.filter(x => x !== s))

  const toggleBenefit = (b: string) =>
    set('benefits', form.benefits.includes(b)
      ? form.benefits.filter(x => x !== b)
      : [...form.benefits, b])

  const validateStep = (): string => {
    if (step === 0 && !form.title.trim()) return 'Job title is required.'
    if (step === 1 && !form.description.trim()) return 'Description is required.'
    return ''
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const back = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        application_deadline: form.application_deadline || null,
      }),
    })
    if (res.ok) {
      router.push('/employers/dashboard')
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to post job')
      setSubmitting(false)
    }
  }

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 16, padding: '28px 32px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex',
    flexDirection: 'column', gap: '1.2rem',
  }

  const formatLabel = (v: string) =>
    v.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-')

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F7', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/employers/dashboard" style={{ fontSize: '0.85rem', color: '#1F6F8B', textDecoration: 'none' }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 400, color: '#1D1D1F', margin: '0.75rem 0 0.25rem' }}>
            Post a job
          </h1>
        </div>

        <StepIndicator current={step} />

        {/* ── Step 1: Basic Info ── */}
        {step === 0 && (
          <div style={card}>
            <div>
              <label style={label}>Job title <span style={{ color: '#cc3333' }}>*</span></label>
              <input style={input} value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Senior Accountant" />
            </div>

            <div>
              <label style={label}>Location</label>
              <input style={input} value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="City, State or leave blank for remote" />
            </div>

            <div>
              <label style={label}>Employment type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {EMPLOYMENT_TYPES.map(t => (
                  <label key={t.value} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderRadius: 9, border: `1.5px solid ${form.employment_type === t.value ? '#1F6F8B' : '#e5e5e7'}`,
                    background: form.employment_type === t.value ? 'rgba(31,111,139,0.05)' : 'white',
                    cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="employment_type" value={t.value}
                      checked={form.employment_type === t.value}
                      onChange={() => set('employment_type', t.value)}
                      style={{ accentColor: '#1F6F8B' }} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.875rem', color: '#333' }}>Remote position</span>
              <div onClick={() => set('is_remote', !form.is_remote)} style={{
                width: 44, height: 24, borderRadius: 12,
                background: form.is_remote ? '#1F6F8B' : '#C7C7CC',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: form.is_remote ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                }} />
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Number of openings</label>
                <input style={input} type="number" min={1} value={form.number_of_openings}
                  onChange={e => set('number_of_openings', Math.max(1, Number(e.target.value)))} />
              </div>
              <div>
                <label style={label}>Application deadline</label>
                <input style={input} type="date" value={form.application_deadline}
                  onChange={e => set('application_deadline', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Role Details ── */}
        {step === 1 && (
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Experience level</label>
                <select style={{ ...input, cursor: 'pointer' }} value={form.experience_level}
                  onChange={e => set('experience_level', e.target.value)}>
                  {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={label}>Salary min</label>
                  <input style={input} type="number" placeholder="60000" value={form.salary_min}
                    onChange={e => set('salary_min', e.target.value)} min={0} />
                </div>
                <div>
                  <label style={label}>Salary max</label>
                  <input style={input} type="number" placeholder="90000" value={form.salary_max}
                    onChange={e => set('salary_max', e.target.value)} min={0} />
                </div>
              </div>
            </div>

            <div>
              <label style={label}>Job description <span style={{ color: '#cc3333' }}>*</span></label>
              <textarea style={{ ...input, resize: 'vertical', lineHeight: 1.6, minHeight: 160 }}
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the role, day-to-day responsibilities, team, and any must-have requirements…" rows={7} />
            </div>

            <div>
              <label style={label}>Preferred qualifications</label>
              <textarea style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
                value={form.preferred_qualifications}
                onChange={e => set('preferred_qualifications', e.target.value)}
                placeholder="Nice-to-have skills, certifications, or experience…" rows={4} />
            </div>
          </div>
        )}

        {/* ── Step 3: Skills & Benefits ── */}
        {step === 2 && (
          <div style={card}>
            <div>
              <label style={label}>Required skills</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  style={{ ...input, flex: 1 }}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Type a skill and press Enter"
                />
                <button onClick={addSkill} style={{
                  padding: '0 16px', borderRadius: 9, border: 'none',
                  background: '#1F6F8B', color: 'white', fontSize: '0.875rem', cursor: 'pointer',
                }}>
                  Add
                </button>
              </div>
              {form.required_skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.required_skills.map(s => (
                    <span key={s} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 100, background: 'rgba(31,111,139,0.08)',
                      color: '#1F6F8B', fontSize: '0.8rem', fontWeight: 500,
                    }}>
                      {s}
                      <button onClick={() => removeSkill(s)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#1F6F8B',
                        padding: 0, lineHeight: 1, fontSize: '0.9rem',
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={label}>Benefits offered</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {BENEFIT_OPTIONS.map(b => (
                  <label key={b} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                    borderRadius: 9, border: `1.5px solid ${form.benefits.includes(b) ? '#1F6F8B' : '#e5e5e7'}`,
                    background: form.benefits.includes(b) ? 'rgba(31,111,139,0.05)' : 'white',
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    <input type="checkbox" checked={form.benefits.includes(b)}
                      onChange={() => toggleBenefit(b)} style={{ accentColor: '#1F6F8B' }} />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#333', fontWeight: 500 }}>Veteran-friendly</div>
                <div style={{ fontSize: '0.78rem', color: '#86868b' }}>Mark this role as welcoming to veterans</div>
              </div>
              <div onClick={() => set('veteran_friendly', !form.veteran_friendly)} style={{
                width: 44, height: 24, borderRadius: 12,
                background: form.veteran_friendly ? '#1F6F8B' : '#C7C7CC',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: form.veteran_friendly ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                }} />
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Hiring manager name</label>
                <input style={input} value={form.hiring_manager_name}
                  onChange={e => set('hiring_manager_name', e.target.value)}
                  placeholder="Jane Smith" />
              </div>
              <div>
                <label style={label}>Hiring manager email</label>
                <input style={input} type="email" value={form.hiring_manager_email}
                  onChange={e => set('hiring_manager_email', e.target.value)}
                  placeholder="jane@company.com" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...card, gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>Review your listing</h2>

              <ReviewRow label="Title" value={form.title} />
              <ReviewRow label="Location" value={`${form.location || 'Not specified'}${form.is_remote ? ' · Remote' : ''}`} />
              <ReviewRow label="Employment type" value={formatLabel(form.employment_type)} />
              <ReviewRow label="Experience level" value={formatLabel(form.experience_level)} />
              <ReviewRow label="Openings" value={String(form.number_of_openings)} />
              {(form.salary_min || form.salary_max) && (
                <ReviewRow label="Salary"
                  value={`${form.salary_min ? '$' + Number(form.salary_min).toLocaleString() : '—'} – ${form.salary_max ? '$' + Number(form.salary_max).toLocaleString() : '—'}`} />
              )}
              {form.application_deadline && <ReviewRow label="Deadline" value={new Date(form.application_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />}
            </div>

            <div style={{ ...card, gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</div>
              <p style={{ fontSize: '0.875rem', color: '#333', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{form.description}</p>
            </div>

            {form.required_skills.length > 0 && (
              <div style={{ ...card, gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.required_skills.map(s => (
                    <span key={s} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(31,111,139,0.08)', color: '#1F6F8B', fontSize: '0.8rem', fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {form.benefits.length > 0 && (
              <div style={{ ...card, gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Benefits</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.benefits.map(b => (
                    <span key={b} style={{ padding: '4px 12px', borderRadius: 100, background: '#F5F5F7', color: '#333', fontSize: '0.8rem' }}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {(form.veteran_friendly || form.hiring_manager_name) && (
              <div style={{ ...card, gap: '0.75rem' }}>
                {form.veteran_friendly && <ReviewRow label="Veteran-friendly" value="Yes" />}
                {form.hiring_manager_name && <ReviewRow label="Hiring manager" value={form.hiring_manager_name} />}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 9, fontSize: '0.85rem', color: '#cc0000' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'space-between' }}>
          <div>
            {step > 0 && (
              <button onClick={back} style={{
                padding: '0.7rem 1.5rem', borderRadius: 9, border: '1.5px solid #e5e5e7',
                background: 'white', fontSize: '0.875rem', color: '#555', cursor: 'pointer',
              }}>
                ← Back
              </button>
            )}
          </div>
          <div>
            {step < STEPS.length - 1 ? (
              <button onClick={next} style={{
                padding: '0.7rem 1.75rem', borderRadius: 9, border: 'none',
                background: '#1F6F8B', color: 'white', fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(31,111,139,0.2)',
              }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={{
                padding: '0.7rem 2rem', borderRadius: 9, border: 'none',
                background: submitting ? '#86868b' : '#1F6F8B', color: 'white',
                fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(31,111,139,0.2)',
              }}>
                {submitting ? 'Publishing…' : 'Publish job listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function ReviewRow({ label: l, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: '0.875rem' }}>
      <div style={{ width: 130, flexShrink: 0, color: '#86868b' }}>{l}</div>
      <div style={{ color: '#1D1D1F', fontWeight: 400 }}>{value}</div>
    </div>
  )
}
