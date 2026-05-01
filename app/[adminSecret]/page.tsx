'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useParams()
  const adminSecret = params.adminSecret as string

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push(`/${adminSecret}/pipeline`)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f0f2',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'white',
        borderRadius: 12,
        padding: '2rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4040a0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            High Point Admin
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 400, color: '#1D1D1F', margin: 0 }}>
            Sign in
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: 8,
                border: '1px solid #e5e5e7',
                fontSize: '0.9rem',
                outline: 'none',
                background: '#fafafa',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: 8,
                border: '1px solid #e5e5e7',
                fontSize: '0.9rem',
                outline: 'none',
                background: '#fafafa',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff0f0',
              border: '1px solid #ffd0d0',
              borderRadius: 6,
              padding: '0.6rem 0.875rem',
              marginBottom: '1rem',
              fontSize: '0.825rem',
              color: '#cc0000',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: loading ? '#86868b' : '#0f0f1a',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
