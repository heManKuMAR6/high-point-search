import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'
import RevenueClient from './_components/RevenueClient'

export default async function RevenuePage({
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

  const { data: rawLedger } = await supabaseAdmin
    .from('fee_ledger')
    .select('id, status, amount, invoice_ref, notes, invoiced_at, created_at, placement_id, placements(candidate_id, employer_id, employers(company_name))')
    .order('created_at', { ascending: false })

  // Normalize Supabase array-shaped joins to single objects
  const rows = (rawLedger ?? []).map(r => ({
    ...r,
    placements: Array.isArray(r.placements)
      ? (r.placements[0] ? { ...r.placements[0], employers: Array.isArray(r.placements[0].employers) ? (r.placements[0].employers[0] ?? null) : r.placements[0].employers } : null)
      : r.placements,
  }))

  const totalCollected = rows.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalInvoiced = rows.filter(r => r.status === 'invoiced').reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalPending = rows.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount ?? 0), 0)
  const placementCount = new Set(rows.map(r => r.placement_id)).size

  return (
    <RevenueClient
      rows={rows}
      stats={{ totalCollected, totalInvoiced, totalPending, placementCount }}
    />
  )
}
