'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { submitEnterpriseEnquiry, EnterpriseContactState } from './actions'

const initialState: EnterpriseContactState = { status: 'idle' }

export default function EnterpriseContactPage() {
  const [state, action, pending] = useActionState(submitEnterpriseEnquiry, initialState)

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">Vitrine<span className="text-amber-500">.</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-stone-400 hover:text-white transition-colors font-mono">Sign in</Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">

          <Link href="/plans/enterprise" className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors mb-8">
            ← Enterprise plan
          </Link>

          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">Enterprise</p>
          <h1 className="font-serif text-5xl italic font-normal mb-4 leading-none">Get in touch.</h1>
          <p className="text-stone-400 font-light leading-relaxed mb-10">
            Tell us about your institution and what you need. We'll be in touch soon to talk through a plan that fits.
          </p>

          {state.status === 'success' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
              <p className="text-emerald-400 font-mono text-sm mb-1">Message sent.</p>
              <p className="text-stone-400 text-sm font-light">We'll be in touch soon.</p>
            </div>
          ) : (
            <form action={action} className="space-y-5">

              {/* Name + Institution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                    Your name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Sarah Mitchell"
                    className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                    Institution <span className="text-amber-500">*</span>
                  </label>
                  <input
                    name="institution"
                    type="text"
                    required
                    placeholder="National History Museum"
                    className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Work email <span className="text-amber-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="sarah@museum.org"
                  className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>

              {/* Collection size */}
              <div>
                <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Approximate collection size
                </label>
                <select
                  name="collectionSize"
                  className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-amber-500/50 transition-colors appearance-none"
                >
                  <option value="">Select a range</option>
                  <option value="Up to 10,000 objects">Up to 10,000 objects</option>
                  <option value="10,000 – 50,000 objects">10,000 – 50,000 objects</option>
                  <option value="50,000 – 250,000 objects">50,000 – 250,000 objects</option>
                  <option value="250,000 – 1 million objects">250,000 – 1 million objects</option>
                  <option value="Over 1 million objects">Over 1 million objects</option>
                  <option value="Not sure yet">Not sure yet</option>
                </select>
              </div>

              {/* Storage needs */}
              <div>
                <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Estimated document / image storage
                </label>
                <select
                  name="storageNeeds"
                  className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-amber-500/50 transition-colors appearance-none"
                >
                  <option value="">Select a range</option>
                  <option value="Under 50 GB">Under 50 GB</option>
                  <option value="50 – 250 GB">50 – 250 GB</option>
                  <option value="250 GB – 1 TB">250 GB – 1 TB</option>
                  <option value="1 – 5 TB">1 – 5 TB</option>
                  <option value="Over 5 TB">Over 5 TB</option>
                  <option value="Not sure yet">Not sure yet</option>
                </select>
              </div>

              {/* Staff count */}
              <div>
                <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Number of staff / users
                </label>
                <select
                  name="staffCount"
                  className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-amber-500/50 transition-colors appearance-none"
                >
                  <option value="">Select a range</option>
                  <option value="1 – 5">1 – 5</option>
                  <option value="6 – 20">6 – 20</option>
                  <option value="21 – 50">21 – 50</option>
                  <option value="51 – 200">51 – 200</option>
                  <option value="Over 200">Over 200</option>
                </select>
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Special requests or requirements
                </label>
                <textarea
                  name="specialRequests"
                  rows={4}
                  placeholder="Custom integrations, data migration support, API access, SSO, on-premise options, accessibility requirements…"
                  className="w-full bg-stone-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                />
              </div>

              {state.status === 'error' && (
                <p className="text-sm text-red-400 font-mono">{state.message}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-stone-950 font-mono text-sm px-8 py-3.5 rounded transition-colors"
              >
                {pending ? 'Sending…' : 'Send enquiry →'}
              </button>

              <p className="text-xs text-stone-600 font-mono text-center">
                Or email us directly at{' '}
                <a href="mailto:hello@composition.agency" className="text-stone-400 hover:text-stone-200 transition-colors">
                  hello@composition.agency
                </a>
              </p>

            </form>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-serif italic text-stone-600">Vitrine<span className="text-amber-500">.</span></span>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-stone-600 hover:text-stone-400 font-mono transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-stone-600 hover:text-stone-400 font-mono transition-colors">Terms</Link>
          </div>
          <span className="text-xs text-stone-700 font-mono">© 2026 Composition Limited.</span>
        </div>
      </footer>

    </div>
  )
}
