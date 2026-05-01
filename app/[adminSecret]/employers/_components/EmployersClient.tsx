'use client'

import { useState } from 'react'

type Employer = {
  id: string
  user_id: string
  company_name: string | null
  ein: string | null
  verified_status: string | null
  verified_at: string | null
  created_at: string
  users: { email: string } | null
}

type EmployerDetail = {
  employer: Employer & { users: { email: string; name?: string } | null }
  jobs: { id: string; title: string; status: string; created_at: string }[]
}

function VerificationBadge({ status }: { status: string | null }) {
  if (status === 'verified') return (
    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 100, background: '#dcfce7', color: '#166534', fontWeight: 500 }}>
      Verified
    </span>
  )
  if (status === 'rejected') return (
    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 100, background: '#fee2e2', color: '#991b1b', fontWeight: 500 }}>
      Rejected
    </span>
  )
  return (
    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 100, background: '#fef3c7', color: '#92400e', fontWeight: 500 }}>
      Pending
    </span>
  )
}

export default function EmployersClient({ employers: initial }: { employers: Employer[] }) {
  const [employers, setEmployers] = useState(initial)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<EmployerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const openDetail = async (id: string) => {
    if (selected === id) { setSelected(null); setDetail(null); return }
    setSelected(id)
    setDetailLoading(true)
    const res = await fetch(`/api/admin/employers/${id}`)
    if (res.ok) setDetail(await res.json())
    setDetailLoading(false)
  }

  const handleAction = async (id: string, action: 'verify' | 'reject') => {
    setActionLoading(`${id}-${action}`)
    const res = await fetch(`/api/admin/employers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      const updated = await res.json()
      setEmployers(prev => prev.map(e => e.id === id ? { ...e, verified_status: updated.verified_status, verified_at: updated.verified_at } : e))
      if (detail && detail.employer.id === id) {
        setDetail(prev => prev ? { ...prev, employer: { ...prev.employer, verified_status: updated.verified_status } } : prev)
      }
    }
    setActionLoading(null)
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1.25rem', color: '#1D1D1F' }}>
        Employers
      </h1>

      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e5e7', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f7', borderBottom: '1px solid #e5e5e7' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Company</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Email</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>EIN</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Status</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Joined</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#86868b', fontSize: '0.875rem' }}>
                  No employers yet.
                </td>
              </tr>
            )}
            {employers.map(emp => (
              <>
                <tr
                  key={emp.id}
                  onClick={() => openDetail(emp.id)}
                  style={{
                    borderBottom: '1px solid #f0f0f2',
                    cursor: 'pointer',
                    background: selected === emp.id ? '#fafafa' : 'white',
                  }}
                >
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1D1D1F' }}>
                    {emp.company_name ?? '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#555' }}>
                    {(emp.users as { email: string } | null)?.email ?? '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#86868b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {emp.ein ?? '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <VerificationBadge status={emp.verified_status} />
                  </td>
                  <td style={{ padding: '10px 16px', color: '#86868b', fontSize: '0.8rem' }}>
                    {new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {emp.verified_status !== 'verified' && (
                        <button
                          onClick={() => handleAction(emp.id, 'verify')}
                          disabled={actionLoading === `${emp.id}-verify`}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #bbf7d0',
                            background: '#dcfce7', color: '#166534', fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          {actionLoading === `${emp.id}-verify` ? '…' : 'Verify'}
                        </button>
                      )}
                      {emp.verified_status !== 'rejected' && (
                        <button
                          onClick={() => handleAction(emp.id, 'reject')}
                          disabled={actionLoading === `${emp.id}-reject`}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          {actionLoading === `${emp.id}-reject` ? '…' : 'Reject'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {selected === emp.id && (
                  <tr key={`${emp.id}-detail`}>
                    <td colSpan={6} style={{ padding: '1rem 1.5rem', background: '#fafafa', borderBottom: '1px solid #e5e5e7' }}>
                      {detailLoading ? (
                        <span style={{ fontSize: '0.875rem', color: '#86868b' }}>Loading…</span>
                      ) : detail ? (
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                              Open Jobs ({detail.jobs.filter(j => j.status === 'active').length})
                            </div>
                            {detail.jobs.length === 0 ? (
                              <span style={{ fontSize: '0.8rem', color: '#86868b' }}>None</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {detail.jobs.map(j => (
                                  <div key={j.id} style={{ fontSize: '0.82rem', color: '#444', display: 'flex', gap: 10 }}>
                                    <span>{j.title}</span>
                                    <span style={{ fontSize: '0.72rem', padding: '1px 7px', borderRadius: 100, background: j.status === 'active' ? '#dcfce7' : '#f0f0f2', color: j.status === 'active' ? '#166534' : '#86868b' }}>
                                      {j.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: '#86868b' }}>Failed to load details.</span>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
