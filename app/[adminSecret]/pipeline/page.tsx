import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'
import KanbanClient from './_components/KanbanClient'

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ adminSecret: string }>
}) {
  const { adminSecret } = await params

  if (adminSecret !== process.env.ADMIN_ROUTE_SLUG) notFound()

  const session = await auth()
  if (!session || session.user.role !== 'superadmin') {
    redirect(`/${adminSecret}`)
  }

  const [candidatesRes, eventsRes, matchesRes, usersRes] = await Promise.all([
    supabaseAdmin
      .from('candidates')
      .select('id, user_id, skills, veteran_status, age_50_plus, utm_source, utm_job, placement_status, onboarding_complete')
      .eq('onboarding_complete', true),
    supabaseAdmin
      .from('pipeline_events')
      .select('id, candidate_id, stage, notes, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('candidate_matches')
      .select('candidate_id, job_id, score')
      .order('score', { ascending: false }),
    supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('role', 'candidate'),
  ])

  const candidates = candidatesRes.data ?? []
  const events = eventsRes.data ?? []
  const matches = matchesRes.data ?? []
  const users = usersRes.data ?? []

  // Build latest stage per candidate
  const latestStage = new Map<string, { stage: string; created_at: string }>()
  for (const ev of events) {
    if (!latestStage.has(ev.candidate_id)) {
      latestStage.set(ev.candidate_id, { stage: ev.stage, created_at: ev.created_at })
    }
  }

  // Build user lookup
  const userMap = new Map(users.map(u => [u.id, u]))

  // Build top match scores per candidate (top job score)
  const topScoreMap = new Map<string, number>()
  for (const m of matches) {
    const prev = topScoreMap.get(m.candidate_id) ?? 0
    if (m.score > prev) topScoreMap.set(m.candidate_id, m.score)
  }

  const pipelineCards = candidates.map(c => {
    const stageInfo = latestStage.get(c.id)
    const user = userMap.get(c.user_id)
    const daysInStage = stageInfo
      ? Math.floor((Date.now() - new Date(stageInfo.created_at).getTime()) / 86_400_000)
      : 0
    return {
      ...c,
      email: user?.email ?? '',
      name: user?.name ?? null,
      stage: stageInfo?.stage ?? 'new',
      daysInStage,
      topScore: topScoreMap.get(c.id) ?? null,
    }
  })

  return <KanbanClient cards={pipelineCards} adminSecret={adminSecret} />
}
