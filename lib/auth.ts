import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { supabaseAdmin } from './db'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: { strategy: 'jwt' },
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const { data: user, error } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single()

                if (error || !user) return null

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.hashed_password
                )

                if (!passwordMatch) return null
                if (!user.is_active) return null

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                }
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
            }
            return token
        },
        session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
    pages: {
        signIn: '/apply',
    },
})