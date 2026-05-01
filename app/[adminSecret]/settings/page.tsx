import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function SettingsPage({
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

  const resendConfigured = !!(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_API_KEY !== 'will_add_later'
  )
  const adminEmailConfigured = !!(
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_EMAIL !== 'your_email_here'
  )
  const cronSecretConfigured = !!process.env.CRON_SECRET

  const checks = [
    { label: 'Resend API key', ok: resendConfigured, fix: 'Set RESEND_API_KEY in .env.local' },
    { label: 'Admin email', ok: adminEmailConfigured, fix: 'Set ADMIN_EMAIL in .env.local' },
    { label: 'Cron secret', ok: cronSecretConfigured, fix: 'Set CRON_SECRET in .env.local — must match x-cron-secret header in Vercel Cron' },
    { label: 'Admin route slug', ok: process.env.ADMIN_ROUTE_SLUG !== 'pick_a_random_string_like_xr7k2m9p', fix: 'Change ADMIN_ROUTE_SLUG to a real random string' },
  ]

  return (
    <div style={{ maxWidth: 540 }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.25rem', color: '#1D1D1F' }}>
        Settings
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#86868b', marginBottom: '1.5rem' }}>
        Configuration lives in environment variables. No UI edits needed.
      </p>

      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e5e7', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '12px 16px', background: '#f5f5f7', borderBottom: '1px solid #e5e5e7', fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Environment check
        </div>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f0f0f2' }}>
            <span style={{ fontSize: '1rem', lineHeight: 1.2 }}>{c.ok ? '✓' : '✗'}</span>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#1D1D1F', fontWeight: 500 }}>{c.label}</div>
              {!c.ok && (
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: 2 }}>{c.fix}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e5e7', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#f5f5f7', borderBottom: '1px solid #e5e5e7', fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Digest cron
        </div>
        <div style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            Trigger manually via:
          </p>
          <code style={{ display: 'block', background: '#f5f5f7', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#1D1D1F', fontFamily: 'monospace', overflowX: 'auto' }}>
            curl -H &quot;x-cron-secret: $CRON_SECRET&quot; {process.env.NEXTAUTH_URL}/api/cron/digest
          </code>
          <p style={{ margin: '0.75rem 0 0', color: '#86868b', fontSize: '0.78rem' }}>
            Vercel Cron runs this at 11:00 UTC (6 AM ET) daily via vercel.json.
          </p>
        </div>
      </div>
    </div>
  )
}
