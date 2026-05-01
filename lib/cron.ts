import { Resend } from 'resend'
import { supabaseAdmin } from './db'
import { runMatchingForNewCandidates } from './matching'

// ─── Result types ─────────────────────────────────────────────────────────────

type StalePipelineResult = {
  count: number
  candidateIds: string[]
  error: string | null
}

type NewCandidatesResult = {
  count: number
  candidateIds: string[]
  error: string | null
}

type MatchingResult = {
  processed: number
  matches: number
  errors: string[]
}

type ExpiringGuaranteesResult = {
  count: number
  items: Array<{ id: string; guarantee_expires_at: string }>
  error: string | null
}

type OverdueInvoicesResult = {
  count: number
  items: Array<{ id: string; amount: number; invoiced_at: string }>
  error: string | null
}

export type DigestResult = {
  date: string
  stalePipeline: StalePipelineResult
  newCandidates: NewCandidatesResult
  matching: MatchingResult
  expiringGuarantees: ExpiringGuaranteesResult
  overdueInvoices: OverdueInvoicesResult
}

// ─── Task 1: Candidates whose pipeline stage hasn't moved in 5+ days ──────────

async function checkStalePipeline(): Promise<StalePipelineResult> {
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all events ordered newest-first; first occurrence per candidate_id is their latest event.
  const { data, error } = await supabaseAdmin
    .from('pipeline_events')
    .select('candidate_id, created_at')
    .order('created_at', { ascending: false })

  if (error) return { count: 0, candidateIds: [], error: error.message }
  if (!data || data.length === 0) return { count: 0, candidateIds: [], error: null }

  const latestByCandidate = new Map<string, string>()
  for (const row of data) {
    if (!latestByCandidate.has(row.candidate_id)) {
      latestByCandidate.set(row.candidate_id, row.created_at)
    }
  }

  const staleIds = [...latestByCandidate.entries()]
    .filter(([, latest]) => latest < cutoff)
    .map(([id]) => id)

  return { count: staleIds.length, candidateIds: staleIds, error: null }
}

// ─── Task 2: Candidates who completed onboarding in the last 24h ───────────────

async function checkNewCandidates(): Promise<NewCandidatesResult> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('candidates')
    .select('id')
    .eq('onboarding_complete', true)
    .gte('created_at', cutoff)

  if (error) return { count: 0, candidateIds: [], error: error.message }
  const ids = (data ?? []).map((c: { id: string }) => c.id)
  return { count: ids.length, candidateIds: ids, error: null }
}

// ─── Task 4: Placements whose guarantee expires within 7 days ─────────────────

async function checkExpiringGuarantees(): Promise<ExpiringGuaranteesResult> {
  const now = new Date().toISOString()
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('placements')
    .select('id, guarantee_expires_at')
    .gte('guarantee_expires_at', now)
    .lte('guarantee_expires_at', sevenDaysOut)

  if (error) return { count: 0, items: [], error: error.message }
  return { count: data?.length ?? 0, items: data ?? [], error: null }
}

// ─── Task 5: Invoices outstanding for 30+ days ────────────────────────────────

async function checkOverdueInvoices(): Promise<OverdueInvoicesResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('fee_ledger')
    .select('id, amount, invoiced_at')
    .eq('status', 'invoiced')
    .lt('invoiced_at', thirtyDaysAgo)

  if (error) return { count: 0, items: [], error: error.message }
  return { count: data?.length ?? 0, items: data ?? [], error: null }
}

// ─── Snapshot writer ──────────────────────────────────────────────────────────

async function writeSnapshot(result: DigestResult): Promise<void> {
  const { error } = await supabaseAdmin
    .from('daily_snapshot')
    .upsert(
      {
        snapshot_date: result.date,
        stale_pipeline_count: result.stalePipeline.count,
        stale_pipeline_candidate_ids: result.stalePipeline.candidateIds,
        new_candidates_count: result.newCandidates.count,
        new_candidate_ids: result.newCandidates.candidateIds,
        matching_processed: result.matching.processed,
        matching_matched: result.matching.matches,
        matching_errors: result.matching.errors,
        expiring_guarantees_count: result.expiringGuarantees.count,
        expiring_guarantee_ids: result.expiringGuarantees.items.map(i => i.id),
        overdue_invoices_count: result.overdueInvoices.count,
        overdue_invoice_ids: result.overdueInvoices.items.map(i => i.id),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'snapshot_date' }
    )

  if (error) console.error('[cron] snapshot write failed:', error.message)
}

// ─── Email digest ─────────────────────────────────────────────────────────────

function buildDigestHtml(r: DigestResult): string {
  const row = (
    title: string,
    count: number,
    detail: string,
    alert = false
  ) => `
    <tr>
      <td style="padding:18px 28px;border-bottom:1px solid #f0f0f2;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size:13px;font-weight:600;color:#1d1d1f;margin-bottom:3px;">${title}</div>
              <div style="font-size:12px;color:#86868b;">${detail}</div>
            </td>
            <td align="right" style="vertical-align:middle;padding-left:16px;">
              <span style="font-size:28px;font-weight:300;color:${alert && count > 0 ? '#cc4444' : '#1f6f8b'};">${count}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  const errorBlock = r.matching.errors.length > 0
    ? `<tr><td style="padding:16px 28px 0;">
        <div style="background:#fff0f0;border:1px solid #ffd0d0;border-radius:10px;padding:14px 18px;">
          <div style="font-size:11px;font-weight:600;color:#cc4444;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">
            Matching errors (${r.matching.errors.length})
          </div>
          ${r.matching.errors.map(e =>
            `<div style="font-size:11px;color:#cc4444;font-family:monospace;margin-bottom:3px;">${e.replace(/</g, '&lt;')}</div>`
          ).join('')}
        </div>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>High Point Search — Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr>
          <td style="background:#1f6f8b;padding:28px 32px;border-radius:16px 16px 0 0;">
            <div style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">
              High Point Search
            </div>
            <div style="font-size:22px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">
              Daily Operations Digest
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:8px;">${r.date}</div>
          </td>
        </tr>

        <!-- Checks -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${row('Stale Pipeline', r.stalePipeline.count,
                'Candidates with no stage change in 5+ days', true)}
              ${row('New Candidates (24h)', r.newCandidates.count,
                'Completed onboarding since yesterday\'s digest')}
              ${row('Matches Written', r.matching.matches,
                `${r.matching.processed} candidate${r.matching.processed !== 1 ? 's' : ''} scored against active jobs`)}
              ${row('Guarantees Expiring', r.expiringGuarantees.count,
                'Placement guarantees expiring within 7 days', true)}
              ${row('Overdue Invoices', r.overdueInvoices.count,
                'Invoiced more than 30 days ago, status still "invoiced"', true)}
              ${errorBlock}
              <tr>
                <td style="padding:16px 28px;">
                  <div style="font-size:11px;color:#c0c0c5;text-align:center;">
                    Generated ${new Date().toUTCString()} · High Point Search automated digest
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendDigestEmail(result: DigestResult): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (!apiKey || apiKey === 'will_add_later' || !adminEmail || adminEmail === 'your_email_here') {
    console.warn('[cron] email skipped: RESEND_API_KEY or ADMIN_EMAIL not configured')
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'digest@highpointsearch.com',
    to: adminEmail,
    subject: `High Point Search — Daily Digest ${result.date}`,
    html: buildDigestHtml(result),
  })

  if (error) console.error('[cron] email send failed:', error)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run all five daily checks in parallel, write one row to daily_snapshot,
 * and send the digest email. Safe to call multiple times — snapshot upserts
 * on (snapshot_date).
 */
export async function runDailyDigest(): Promise<DigestResult> {
  const date = new Date().toISOString().split('T')[0]

  const [stalePipeline, newCandidates, matching, expiringGuarantees, overdueInvoices] =
    await Promise.all([
      checkStalePipeline(),
      checkNewCandidates(),
      runMatchingForNewCandidates(),
      checkExpiringGuarantees(),
      checkOverdueInvoices(),
    ])

  const result: DigestResult = {
    date,
    stalePipeline,
    newCandidates,
    matching,
    expiringGuarantees,
    overdueInvoices,
  }

  // Snapshot write and email are independent; don't let one failure suppress the other.
  await Promise.allSettled([
    writeSnapshot(result),
    sendDigestEmail(result),
  ])

  return result
}

