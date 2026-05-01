'use client'

import { useState } from 'react'

type LedgerRow = {
  id: string
  status: string | null
  amount: number | null
  invoice_ref: string | null
  notes: string | null
  invoiced_at: string | null
  created_at: string
  placement_id: string | null
  placements: {
    candidate_id: string | null
    employer_id: string | null
    employers: { company_name: string | null } | null
  } | null
}

type Stats = {
  totalCollected: number
  totalInvoiced: number
  totalPending: number
  placementCount: number
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function statusColor(status: string | null) {
  if (status === 'paid') return { bg: '#dcfce7', color: '#166534' }
  if (status === 'invoiced') return { bg: '#dbeafe', color: '#1e40af' }
  return { bg: '#fef3c7', color: '#92400e' }
}

const ALLOWED_STATUSES = ['pending', 'invoiced', 'paid']

export default function RevenueClient({ rows: initial, stats }: { rows: LedgerRow[]; stats: Stats }) {
  const [rows, setRows] = useState(initial)
  const [editing, setEditing] = useState<LedgerRow | null>(null)
  const [editForm, setEditForm] = useState({ status: '', invoice_ref: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const openEdit = (row: LedgerRow) => {
    setEditing(row)
    setEditForm({
      status: row.status ?? 'pending',
      invoice_ref: row.invoice_ref ?? '',
      notes: row.notes ?? '',
    })
  }

  const handleSave = async () => {
    if (!editing || saving) return
    setSaving(true)

    const res = await fetch(`/api/admin/fee-ledger/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editForm.status,
        invoice_ref: editForm.invoice_ref || null,
        notes: editForm.notes || null,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setRows(prev => prev.map(r => r.id === editing.id ? { ...r, ...updated } : r))
      setEditing(null)
    }

    setSaving(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1.25rem', color: '#1D1D1F' }}>
        Revenue
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Collected', value: fmt(stats.totalCollected), color: '#166534', bg: '#dcfce7' },
          { label: 'Invoiced', value: fmt(stats.totalInvoiced), color: '#1e40af', bg: '#dbeafe' },
          { label: 'Pending', value: fmt(stats.totalPending), color: '#92400e', bg: '#fef3c7' },
          { label: 'Placements', value: String(stats.placementCount), color: '#555', bg: '#f5f5f7' },
        ].map(card => (
          <div key={card.label} style={{
            background: card.bg,
            borderRadius: 10,
            padding: '1rem 1.25rem',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 500, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Fee ledger table */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e5e7', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f7', borderBottom: '1px solid #e5e5e7' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Employer</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Amount</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Status</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Invoice Ref</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}>Invoiced</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '0.78rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#86868b', fontSize: '0.875rem' }}>
                  No fee entries yet.
                </td>
              </tr>
            )}
            {rows.map(row => {
              const sc = statusColor(row.status)
              const companyName = row.placements?.employers?.company_name ?? '—'
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                  <td style={{ padding: '10px 16px', color: '#1D1D1F', fontWeight: 500 }}>{companyName}</td>
                  <td style={{ padding: '10px 16px', color: row.amount ? '#1D1D1F' : '#86868b' }}>
                    {row.amount != null ? fmt(row.amount) : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 100, background: sc.bg, color: sc.color, fontWeight: 500 }}>
                      {row.status ?? 'pending'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#86868b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {row.invoice_ref ?? '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#86868b', fontSize: '0.8rem' }}>
                    {row.invoiced_at
                      ? new Date(row.invoiced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      onClick={() => openEdit(row)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e5e7', background: 'white', fontSize: '0.75rem', cursor: 'pointer', color: '#555' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <>
          <div
            onClick={() => setEditing(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 12, padding: '1.5rem', width: 380, zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: '1.25rem', color: '#1D1D1F' }}>
              Edit Fee Entry
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: 4 }}>Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e5e5e7', fontSize: '0.875rem', background: 'white' }}
              >
                {ALLOWED_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: 4 }}>Invoice Ref</label>
              <input
                type="text"
                value={editForm.invoice_ref}
                onChange={e => setEditForm(f => ({ ...f, invoice_ref: e.target.value }))}
                placeholder="INV-XXXXX"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e5e5e7', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: 4 }}>Notes</label>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e5e5e7', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e5e5e7', background: 'white', fontSize: '0.875rem', cursor: 'pointer', color: '#555' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#0f0f1a', color: 'white', fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
