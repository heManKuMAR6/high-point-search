import { supabaseAdmin } from './db'

// ─── Domain types ─────────────────────────────────────────────────────────────

export type Candidate = {
  id: string
  user_id: string
  skills: string[] | null
  veteran_status: boolean | null
  age_50_plus: boolean | null
  // These columns don't exist in the current schema but scoring degrades gracefully when null
  location: string | null
  city: string | null
  state: string | null
  needs_sponsorship: boolean | null
  desired_salary_min: number | null
  desired_salary_max: number | null
  placement_status: string | null
  onboarding_complete: boolean | null
}

export type Requisition = {
  id: string
  employer_id: string
  title: string
  description: string
  location: string | null
  status: string
  // These columns don't exist in the current schema but scoring degrades gracefully when null
  required_skills: string[] | null
  salary_min: number | null
  salary_max: number | null
  can_sponsor: boolean | null
}

export type ScoreBreakdown = {
  skills: number        // 0–40
  location: number      // 0–20
  work_auth: number     // 0–15
  salary: number        // 0–15
  priority_flags: number // 0–10
}

export type MatchResult = {
  score: number
  breakdown: ScoreBreakdown
  blocked: boolean
  block_reason: 'already_placed' | 'already_applied' | 'sponsorship_unavailable' | null
}

// ─── Skill keyword list — mirrors the onboarding chip options ─────────────────

const KNOWN_SKILLS = [
  'project management', 'leadership', 'sales', 'customer service',
  'operations', 'finance', 'accounting', 'hr', 'marketing',
  'it support', 'data analysis', 'healthcare', 'legal', 'teaching',
  'engineering', 'supply chain', 'real estate', 'insurance', 'banking',
]

// ─── Component scorers ────────────────────────────────────────────────────────

function scoreSkills(candidate: Candidate, req: Requisition): number {
  const candidateSkills = (candidate.skills ?? []).map(s => s.toLowerCase())
  if (candidateSkills.length === 0) return 0

  let jobSkills: string[]
  if (req.required_skills && req.required_skills.length > 0) {
    jobSkills = req.required_skills.map(s => s.toLowerCase())
  } else {
    // Fall back to keyword extraction from title + description
    const text = `${req.title} ${req.description}`.toLowerCase()
    jobSkills = KNOWN_SKILLS.filter(s => text.includes(s))
    // Can't evaluate: half credit so an unknown job doesn't unfairly penalise everyone
    if (jobSkills.length === 0) return 20
  }

  const matched = candidateSkills.filter(cs =>
    jobSkills.some(js => js.includes(cs) || cs.includes(js))
  ).length

  return Math.round((matched / jobSkills.length) * 40)
}

function scoreLocation(candidate: Candidate, req: Requisition): number {
  const jobLoc = (req.location ?? '').toLowerCase().trim()
  if (!jobLoc || jobLoc === 'remote') return 20

  const candidateLoc =
    [candidate.city, candidate.state].filter(Boolean).join(', ').toLowerCase() ||
    (candidate.location ?? '').toLowerCase()

  // No candidate location on file: partial credit rather than zero
  if (!candidateLoc) return 10

  const jobParts = jobLoc.split(',').map(p => p.trim())
  const candidateParts = candidateLoc.split(',').map(p => p.trim())
  const hasMatch = jobParts.some(jp => candidateParts.some(cp => cp === jp))
  return hasMatch ? 20 : 0
}

function scoreWorkAuth(candidate: Candidate, req: Requisition): number {
  // The sponsorship hard-block (needs_sponsorship && can_sponsor === false) is
  // checked before this function is called, so reaching here means either the
  // candidate doesn't need sponsorship, the employer can sponsor, or one side
  // is unknown.
  if (!candidate.needs_sponsorship) return 15
  if (req.can_sponsor === true) return 15
  return 8 // capability unknown on one side
}

function scoreSalary(candidate: Candidate, req: Requisition): number {
  const cMin = candidate.desired_salary_min
  const cMax = candidate.desired_salary_max
  const jMin = req.salary_min
  const jMax = req.salary_max

  // If neither side has salary data, give neutral partial credit
  if ((cMin == null && cMax == null) || (jMin == null && jMax == null)) return 8

  const cLow = cMin ?? 0
  const cHigh = cMax ?? Number.MAX_SAFE_INTEGER
  const jLow = jMin ?? 0
  const jHigh = jMax ?? Number.MAX_SAFE_INTEGER

  // No overlap at all
  if (cLow > jHigh || jLow > cHigh) return 0

  // One end is open — assume compatible
  if (cHigh === Number.MAX_SAFE_INTEGER || jHigh === Number.MAX_SAFE_INTEGER) return 15

  const overlapSize = Math.max(0, Math.min(cHigh, jHigh) - Math.max(cLow, jLow))
  const unionSize = Math.max(cHigh, jHigh) - Math.min(cLow, jLow)
  if (unionSize === 0) return 15

  return Math.round((overlapSize / unionSize) * 15)
}

function scorePriorityFlags(candidate: Candidate): number {
  // Platform is purpose-built for veterans and 50+; all employers opted in.
  return candidate.veteran_status || candidate.age_50_plus ? 10 : 0
}

function zeroBreakdown(): ScoreBreakdown {
  return { skills: 0, location: 0, work_auth: 0, salary: 0, priority_flags: 0 }
}

// ─── Public scoring API ───────────────────────────────────────────────────────

/**
 * Score a candidate against a single requisition.
 *
 * @param appliedJobIds - Set of job IDs the candidate has already applied to.
 *   Fetched by the caller so this function stays synchronous.
 */
export function scoreCandidate(
  candidate: Candidate,
  requisition: Requisition,
  appliedJobIds: Set<string> = new Set()
): MatchResult {
  if (candidate.placement_status === 'placed') {
    return { score: 0, breakdown: zeroBreakdown(), blocked: true, block_reason: 'already_placed' }
  }
  if (appliedJobIds.has(requisition.id)) {
    return { score: 0, breakdown: zeroBreakdown(), blocked: true, block_reason: 'already_applied' }
  }
  if (candidate.needs_sponsorship && requisition.can_sponsor === false) {
    return { score: 0, breakdown: zeroBreakdown(), blocked: true, block_reason: 'sponsorship_unavailable' }
  }

  const breakdown: ScoreBreakdown = {
    skills: scoreSkills(candidate, requisition),
    location: scoreLocation(candidate, requisition),
    work_auth: scoreWorkAuth(candidate, requisition),
    salary: scoreSalary(candidate, requisition),
    priority_flags: scorePriorityFlags(candidate),
  }

  const score = Math.min(
    100,
    Math.round(
      breakdown.skills + breakdown.location + breakdown.work_auth +
      breakdown.salary + breakdown.priority_flags
    )
  )

  return { score, breakdown, blocked: false, block_reason: null }
}

// ─── Batch runner ─────────────────────────────────────────────────────────────

type RunResult = { processed: number; matches: number; errors: string[] }

/**
 * Reads candidates who completed onboarding in the last 24 hours, scores them
 * against all active requisitions, and upserts results into candidate_matches.
 *
 * Designed to be called from a cron route or a one-off API handler.
 */
export async function runMatchingForNewCandidates(): Promise<RunResult> {
  const errors: string[] = []

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: candidates, error: cErr } = await supabaseAdmin
    .from('candidates')
    .select('*')
    .eq('onboarding_complete', true)
    .gte('created_at', cutoff)

  if (cErr) return { processed: 0, matches: 0, errors: [cErr.message] }
  if (!candidates || candidates.length === 0) return { processed: 0, matches: 0, errors: [] }

  const { data: jobs, error: jErr } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('status', 'active')

  if (jErr) return { processed: 0, matches: 0, errors: [jErr.message] }
  if (!jobs || jobs.length === 0) return { processed: candidates.length, matches: 0, errors: [] }

  let matchCount = 0

  for (const candidate of candidates) {
    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select('job_id')
      .eq('candidate_id', candidate.id)

    const appliedJobIds = new Set<string>((apps ?? []).map((a: { job_id: string }) => a.job_id))

    const rows = jobs
      .map(job => {
        const result = scoreCandidate(
          candidate as unknown as Candidate,
          job as unknown as Requisition,
          appliedJobIds
        )
        return {
          candidate_id: candidate.id,
          job_id: job.id,
          score: result.score,
          breakdown: result.breakdown,
          blocked: result.blocked,
          block_reason: result.block_reason,
          updated_at: new Date().toISOString(),
        }
      })
      .filter(row => !row.blocked)

    if (rows.length === 0) continue

    const { error: upsertErr } = await supabaseAdmin
      .from('candidate_matches')
      .upsert(rows, { onConflict: 'candidate_id,job_id' })

    if (upsertErr) {
      errors.push(`candidate ${candidate.id}: ${upsertErr.message}`)
    } else {
      matchCount += rows.length
    }
  }

  return { processed: candidates.length, matches: matchCount, errors }
}
