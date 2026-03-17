'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/set-password`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/set-password')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-4xl italic text-stone-900 dark:text-stone-100 mb-2 inline-block hover:opacity-70 transition-opacity">Vitrine.</Link>
          <p className="text-stone-400 dark:text-stone-500 text-sm">Create your museum in minutes</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@museum.org"
                  required
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded py-2 text-sm font-mono disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Get started'}
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
                We sent a 6-digit code to <span className="font-mono text-stone-900 dark:text-stone-100">{email}</span>. Enter it below to continue.
              </p>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 tracking-widest text-center"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 font-mono">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded py-2 text-sm font-mono disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </button>
              </form>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-4">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setOtp(''); setError('') }}
                  className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  try again
                </button>.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-mono">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
