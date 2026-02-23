'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    // Always show success — never reveal whether the email exists
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl italic text-stone-900 dark:text-stone-100 mb-2">Vitrine.</h1>
          <p className="text-stone-400 dark:text-stone-500 text-sm">Museum CMS</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="text-2xl">✉</div>
              <p className="text-sm text-stone-700 dark:text-stone-300 font-medium">Check your email</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                If an account exists for <span className="font-mono">{email}</span>, you'll receive a password reset link shortly.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">
                Enter your email address and we'll send you a link to reset your password.
              </p>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded py-2 text-sm font-mono disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6">
          <Link
            href="/login"
            className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-mono"
          >
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
