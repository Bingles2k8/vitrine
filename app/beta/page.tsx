import Link from 'next/link'
import { submitBetaPassword } from './actions'

export default async function BetaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next = '/', error } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-4xl italic text-stone-900 dark:text-stone-100 mb-2 inline-block hover:opacity-70 transition-opacity">Vitrine.</Link>
          <p className="text-stone-400 dark:text-stone-500 text-sm">Private Beta</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
            Vitrine is currently in private beta. Enter the access password to continue.
          </p>

          <form action={submitBetaPassword} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                Access Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                autoFocus
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-mono">Incorrect password. Try again.</p>
            )}

            <button
              type="submit"
              className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded py-2 text-sm font-mono mt-2"
            >
              Enter
            </button>
          </form>
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
