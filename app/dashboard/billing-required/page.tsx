import { createServerSideClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMuseumForUser } from '@/lib/get-museum'
import DeleteAccountButton from './DeleteAccountButton'

export const dynamic = 'force-dynamic'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function BillingRequiredPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getMuseumForUser(supabase)
  if (!result) redirect('/onboarding')
  const { museum, isOwner } = result

  // Not locked? Shouldn't be here — send them back to the dashboard.
  if (!museum.locked_at) redirect('/dashboard')

  const reason = museum.lock_reason as 'trial_expired' | 'subscription_ended' | null
  const deleteAt = museum.scheduled_deletion_at as string | null
  const deleteAtFmt = formatDate(deleteAt)
  const daysRemaining = deleteAt
    ? Math.max(0, Math.ceil((new Date(deleteAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const headline = reason === 'trial_expired'
    ? 'Your trial has ended'
    : 'Your subscription has ended'

  const body = reason === 'trial_expired'
    ? 'Your 30-day trial is over. Subscribe now to restore access to your dashboard and put your public site back online.'
    : 'Your subscription has been cancelled. Resubscribe to restore access to your dashboard and put your public site back online.'

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-8 md:p-10">
          <div className="inline-block px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded mb-6">
            Account locked
          </div>

          <h1 className="text-3xl font-serif italic mb-3 text-stone-900 dark:text-stone-100">
            {headline}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
            {body}
          </p>

          {daysRemaining !== null && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-8">
              <p className="text-sm text-red-900 dark:text-red-300">
                <strong>{daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining.</strong>{' '}
                Your collection will be <strong>permanently deleted</strong> on{' '}
                <strong>{deleteAtFmt}</strong> unless you subscribe before then.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {isOwner ? (
              <>
                <Link
                  href="/dashboard/plan"
                  className="block w-full text-center bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-3 px-6 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                >
                  {reason === 'trial_expired' ? 'Subscribe now' : 'Resubscribe'}
                </Link>
                <a
                  href="/api/account/export"
                  className="block w-full text-center bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 py-3 px-6 rounded-lg font-medium border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Download all my data (.zip)
                </a>
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <DeleteAccountButton />
                </div>
              </>
            ) : (
              <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg p-4 text-sm text-stone-600 dark:text-stone-400">
                Only the museum owner can restore access or export data. Please contact{' '}
                <strong>{museum.name}</strong>&apos;s owner.
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300">
            ← Back to vitrinecms.com
          </Link>
        </div>
      </div>
    </div>
  )
}
