import { auth } from './auth'
import { redirect } from 'next/navigation'

export async function requireCandidate() {
    const session = await auth()
    if (!session?.user) redirect('/apply')
    if (session.user.role !== 'candidate') redirect('/apply')
    return session
}

export async function requireEmployer() {
    const session = await auth()
    if (!session?.user) redirect('/employers')
    if (session.user.role !== 'employer') redirect('/employers')
    return session
}

export async function getSession() {
    return auth()
}
