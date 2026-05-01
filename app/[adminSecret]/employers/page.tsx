import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'
import EmployersClient from './_components/EmployersClient'

export default async function EmployersPage({
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

  const { data: rawEmployers } = await supabaseAdmin
    .from('employers')
    .select('id, user_id, company_name, ein, verified_status, verified_at, created_at, users(email)')
    .order('created_at', { ascending: false })

  // Supabase returns joined relations as arrays; normalize to single object
  const employers = (rawEmployers ?? []).map(e => ({
    ...e,
    users: Array.isArray(e.users) ? (e.users[0] ?? null) : e.users,
  }))

  return <EmployersClient employers={employers} />
}
