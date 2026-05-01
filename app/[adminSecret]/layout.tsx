import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ adminSecret: string }>
}) {
  const { adminSecret } = await params

  if (adminSecret !== process.env.ADMIN_ROUTE_SLUG) {
    notFound()
  }

  const session = await auth()

  // Login page needs to render bare — layout passes through for unauthenticated visitors
  if (!session || session.user.role !== 'superadmin') {
    return <>{children}</>
  }

  const { data: snapshot } = await supabaseAdmin
    .from('daily_snapshot')
    .select('snapshot_date, stale_pipeline_count, new_candidates_count, matching_matched, expiring_guarantees_count, overdue_invoices_count')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const base = `/${adminSecret}`

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', background: '#f0f0f2' }}>
      {/* Sidebar */}
      <nav style={{
        width: 180,
        background: '#0f0f1a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 24,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 16px 24px', fontSize: '0.68rem', fontWeight: 700, color: '#4040a0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          High Point Admin
        </div>
        {[
          ['Pipeline', `${base}/pipeline`],
          ['Employers', `${base}/employers`],
          ['Revenue', `${base}/revenue`],
          ['Settings', `${base}/settings`],
        ].map(([label, href]) => (
          <a key={href} href={href} style={{
            display: 'block',
            padding: '10px 16px',
            color: '#9090bb',
            textDecoration: 'none',
            fontSize: '0.875rem',
            borderLeft: '3px solid transparent',
          }}>
            {label}
          </a>
        ))}
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #1e1e30' }}>
          <div style={{ fontSize: '0.72rem', color: '#4040a0' }}>{session.user.email}</div>
        </div>
      </nav>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Morning digest bar */}
        {snapshot ? (
          <div style={{
            background: '#fffbeb',
            borderBottom: '1px solid #f59e0b',
            padding: '6px 20px',
            fontSize: '0.78rem',
            color: '#78350f',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <strong style={{ fontSize: '0.72rem' }}>DIGEST {snapshot.snapshot_date}</strong>
            <span>{snapshot.new_candidates_count ?? 0} new candidates</span>
            <span>{snapshot.matching_matched ?? 0} matches written</span>
            {(snapshot.stale_pipeline_count ?? 0) > 0 && (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>⚠ {snapshot.stale_pipeline_count} stale pipeline</span>
            )}
            {(snapshot.expiring_guarantees_count ?? 0) > 0 && (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>⚠ {snapshot.expiring_guarantees_count} guarantees expiring</span>
            )}
            {(snapshot.overdue_invoices_count ?? 0) > 0 && (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>⚠ {snapshot.overdue_invoices_count} overdue invoices</span>
            )}
          </div>
        ) : (
          <div style={{ background: '#f5f5f7', borderBottom: '1px solid #e5e5e7', padding: '6px 20px', fontSize: '0.75rem', color: '#86868b' }}>
            No digest available — run the cron job to populate
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
