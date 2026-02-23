'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setError('Check your email to confirm your account.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl italic text-stone-900 dark:text-stone-100 mb-2">Vitrine.</h1>
          <p className="text-stone-400 dark:text-stone-500 text-sm">Museum CMS</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8">
          <form className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@museum.org"
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="text-right -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-mono"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-mono">{error}</p>
            )}

            <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Privacy Policy</Link>.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded py-2 text-sm font-mono disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Sign in'}
              </button>
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded py-2 text-sm font-mono disabled:opacity-50 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Sign up
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-stone-300 dark:text-stone-600 mt-6">
          © 2026 Vitrine Ltd.
        </p>
      </div>
    </main>
  )
}