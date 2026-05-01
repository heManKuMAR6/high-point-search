import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
    const { pathname } = req.nextUrl
    const role = req.auth?.user?.role
    const adminSlug = process.env.ADMIN_ROUTE_SLUG

    if (
        pathname.startsWith('/apply/dashboard') ||
        pathname.startsWith('/apply/onboarding') ||
        pathname.startsWith('/apply/profile')
    ) {
        if (!role || role !== 'candidate') {
            return NextResponse.redirect(new URL('/apply', req.url))
        }
    }

    if (
        pathname.startsWith('/employers/dashboard') ||
        pathname.startsWith('/employers/onboarding') ||
        pathname.startsWith('/employers/post-job')
    ) {
        if (!role || role !== 'employer') {
            return NextResponse.redirect(new URL('/employers', req.url))
        }
    }

    if (adminSlug && pathname.startsWith(`/${adminSlug}/`)) {
        if (!role || role !== 'superadmin') {
            return NextResponse.redirect(new URL(`/${adminSlug}`, req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/apply/:path*',
        '/employers/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
