'use client'

import { useState, useEffect, useCallback } from 'react'

type Card = {
  id: string
  user_id: string
  email: string
  name: string | null
  stage: string
  daysInStage: number
  topScore: number | null
  veteran_status: boolean | null
  age_50_plus: boolean | null
  utm_source: string | null
  skills: string[] | null
  placement_status: string | null
}

type PipelineEvent = {
  id: string
  candidate_id: string
  stage: string
  notes: string | null
  created_at: string
}

type Note = {
  id: string
  content: string
  created_at: string
}

const STAGES = ['new', 'screening', 'matched', 'submitted', 'placed'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  screening: 'Screening',
  matched: 'Matched',
  submitted: 'Submitted',
  placed: 'Placed',
}

function daysBadgeColor(days: number) {
  if (days <= 2) return '#dcfce7'
  if (days <= 5) return '#fef9c3'
  return '#fee2e2'
}

function daysBadgeText(days: number) {
  if (days <= 2) return '#166534'
  if (days <= 5) return '#854d0e'
  return '#991b1b'
}

function scoreColor(score: number) {
  if (score >= 70) return '#166534'
  if (score >= 45) return '#854d0e'
  return '#6b7280'
}

export default function KanbanClient({
  cards,
  adminSecret,
}: {
  cards: Card[]
  adminSecret: string
}) {
  const [selected, setSelected] = useState<Card | null>(null)
  const [history, setHistory] = useState<PipelineEvent[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [stageUpdating, setStageUpdating] = useState(false)
  const [selectedStage, setSelectedStage] = useState<Stage>('new')
  const [localCards, setLocalCards] = useState(cards)
  const [topMatches, setTopMatches] = useState<{ job_id: string; score: number }[]>([])

  const openSlideOver = useCallback(async (card: Card) => {
    setSelected(card)
    setSelectedStage(card.stage as Stage)
    setNewNote('')

    const [eventsRes, notesRes, matchesRes] = await Promise.all([
      fetch(`/api/admin/pipeline-events?candidateId=${card.id}`),
      fetch(`/api/admin/notes?candidateId=${card.id}`),
      fetch(`/api/admin/pipeline-events?candidateId=${card.id}`),
    ])

    const [eventsData, notesData] = await Promise.all([
      eventsRes.json(),
      notesRes.json(),
    ])

    setHistory(Array.isArray(eventsData) ? eventsData : [])
    setNotes(Array.isArray(notesData) ? notesData : [])

    const matchesRes2 = await fetch(`/api/jobs?candidateId=${card.id}`)
    if (matchesRes2.ok) {
      const matchData = await matchesRes2.json()
      setTopMatches(Array.isArray(matchData) ? matchData.slice(0, 10) : [])
    } else {
      setTopMatches([])
    }
  }, [])

  const handleStageChange = async (newStage: Stage) => {
    if (!selected || stageUpdating) return
    setStageUpdating(true)

    const res = await fetch('/api/admin/pipeline-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: selected.id, stage: newStage }),
    })

    if (res.ok) {
      const event = await res.json()
      setSelectedStage(newStage)
      setHistory(prev => [event, ...prev])
      setLocalCards(prev =>
        prev.map(c => c.id === selected.id ? { ...c, stage: newStage, daysInStage: 0 } : c)
      )
      setSelected(prev => prev ? { ...prev, stage: newStage, daysInStage: 0 } : prev)
    }

    setStageUpdating(false)
  }

  const handleAddNote = async () => {
    if (!selected || !newNote.trim() || noteSubmitting) return
    setNoteSubmitting(true)

    const res = await fetch('/api/admin/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: selected.id, content: newNote.trim() }),
    })

    if (res.ok) {
      const note = await res.json()
      setNotes(prev => [note, ...prev])
      setNewNote('')
    }

    setNoteSubmitting(false)
  }

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = localCards.filter(c => c.stage === stage)
    return acc
  }, {} as Record<Stage, Card[]>)

  return (
    <div style={{ position: 'relative' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1.25rem', color: '#1D1D1F' }}>
        Pipeline
      </h1>

      {/* Kanban board */}
      <div style={{
        display: 'flex',
        gap: '0.875rem',
        overflowX: 'auto',
        paddingBottom: 8,
        alignItems: 'flex-start',
      }}>
        {STAGES.map(stage => (
          <div key={stage} style={{
            minWidth: 220,
            flex: '0 0 220px',
            background: '#f5f5f7',
            borderRadius: 10,
            padding: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {STAGE_LABELS[stage]}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#86868b', background: '#e5e5e7', borderRadius: 100, padding: '1px 7px' }}>
                {grouped[stage].length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grouped[stage].map(card => (
                <div
                  key={card.id}
                  onClick={() => openSlideOver(card)}
                  style={{
                    background: 'white',
                    borderRadius: 8,
                    padding: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e5e5e7',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 4, wordBreak: 'break-all' }}>
                    {card.name ?? card.email.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#86868b', marginBottom: 6 }}>
                    {card.email}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: 100,
                      background: daysBadgeColor(card.daysInStage),
                      color: daysBadgeText(card.daysInStage),
                      fontWeight: 500,
                    }}>
                      {card.daysInStage}d
                    </span>
                    {card.topScore !== null && (
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 100, background: '#f0f0f2', color: scoreColor(card.topScore), fontWeight: 500 }}>
                        {card.topScore}
                      </span>
                    )}
                    {card.veteran_status && (
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 100, background: '#dbeafe', color: '#1e40af' }}>
                        vet
                      </span>
                    )}
                    {card.age_50_plus && (
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 100, background: '#f3e8ff', color: '#7e22ce' }}>
                        50+
                      </span>
                    )}
                    {card.utm_source && (
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 100, background: '#fef3c7', color: '#92400e', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.utm_source}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40,
            }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
            background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
            zIndex: 50, overflowY: 'auto', padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '1rem', color: '#1D1D1F' }}>
                  {selected.name ?? selected.email.split('@')[0]}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#86868b' }}>{selected.email}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#86868b' }}>
                ×
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
              {selected.veteran_status && (
                <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 100, background: '#dbeafe', color: '#1e40af' }}>Veteran</span>
              )}
              {selected.age_50_plus && (
                <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 100, background: '#f3e8ff', color: '#7e22ce' }}>50+</span>
              )}
              {selected.utm_source && (
                <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 100, background: '#fef3c7', color: '#92400e' }}>
                  via {selected.utm_source}
                </span>
              )}
              {selected.topScore !== null && (
                <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 100, background: '#f0f0f2', color: scoreColor(selected.topScore) }}>
                  Top match: {selected.topScore}
                </span>
              )}
            </div>

            {/* Skills */}
            {selected.skills && selected.skills.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.skills.map(s => (
                    <span key={s} style={{ fontSize: '0.78rem', padding: '2px 10px', borderRadius: 100, background: '#f5f5f7', color: '#444' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Stage */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stage</div>
              <select
                value={selectedStage}
                onChange={e => handleStageChange(e.target.value as Stage)}
                disabled={stageUpdating}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #e5e5e7',
                  fontSize: '0.875rem',
                  background: 'white',
                  cursor: stageUpdating ? 'not-allowed' : 'pointer',
                  width: '100%',
                }}
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Add note */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Note</div>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={3}
                placeholder="Note…"
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8,
                  border: '1px solid #e5e5e7', fontSize: '0.875rem', resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={noteSubmitting || !newNote.trim()}
                style={{
                  marginTop: 6, padding: '0.45rem 1rem', background: '#0f0f1a', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: '0.825rem', cursor: noteSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {noteSubmitting ? 'Saving…' : 'Save note'}
              </button>
            </div>

            {/* Notes history */}
            {notes.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notes.map(n => (
                    <div key={n.id} style={{ background: '#fafafa', borderRadius: 8, padding: '0.625rem 0.75rem', border: '1px solid #e5e5e7' }}>
                      <div style={{ fontSize: '0.82rem', color: '#1D1D1F', marginBottom: 4 }}>{n.content}</div>
                      <div style={{ fontSize: '0.7rem', color: '#86868b' }}>
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline history */}
            {history.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pipeline History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.8rem', color: '#555' }}>
                      <span style={{
                        fontSize: '0.7rem', padding: '1px 8px', borderRadius: 100,
                        background: '#f0f0f2', color: '#444', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {STAGE_LABELS[ev.stage as Stage] ?? ev.stage}
                      </span>
                      <span style={{ color: '#86868b', flexShrink: 0 }}>
                        {new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {ev.notes && <span style={{ color: '#555', fontStyle: 'italic' }}>{ev.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top matches */}
            {topMatches.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Match Suggestions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topMatches.map((m, i) => (
                    <div key={m.job_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0.625rem', background: '#fafafa', borderRadius: 6, border: '1px solid #e5e5e7' }}>
                      <span style={{ color: '#555' }}>Job #{i + 1}</span>
                      <span style={{ fontWeight: 600, color: scoreColor(m.score) }}>{m.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
