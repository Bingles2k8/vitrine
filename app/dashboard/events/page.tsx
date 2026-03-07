'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { TableSkeleton } from '@/components/Skeleton'

interface Event {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  price_cents: number
  currency: string
  status: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  past:      'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500',
}

const TYPE_LABELS: Record<string, string> = {
  exhibition: 'Exhibition',
  workshop: 'Workshop',
  talk: 'Talk',
  tour: 'Tour',
}

export default function EventsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [connectLoading, setConnectLoading] = useState(false)
  const [stripeConnectPending, setStripeConnectPending] = useState(false)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum: loadedMuseum, isOwner, staffAccess } = result
      let museum = loadedMuseum

      // Proactively check Stripe Connect status if connect_id exists but not yet onboarded
      if (museum.stripe_connect_id && !museum.stripe_connect_onboarded) {
        try {
          const res = await fetch('/api/stripe/connect/callback', { method: 'POST' })
          const cbData = await res.json()
          if (cbData.onboarded) {
            museum = { ...museum, stripe_connect_onboarded: true }
          } else if (cbData.details_submitted) {
            setStripeConnectPending(true)
          }
        } catch {}
      }

      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)

      // Auto-expire past events
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('events')
        .update({ status: 'past', updated_at: new Date().toISOString() })
        .eq('museum_id', museum.id)
        .eq('status', 'published')
        .lt('end_date', today)

      const { data: evts } = await supabase
        .from('events')
        .select('*')
        .eq('museum_id', museum.id)
        .order('start_date', { ascending: false })
      setEvents(evts || [])

      // Fetch ticket counts per event
      if (evts && evts.length > 0) {
        const { data: orders } = await supabase
          .from('ticket_orders')
          .select('event_id, quantity')
          .eq('museum_id', museum.id)
          .eq('status', 'completed')
        if (orders) {
          const counts: Record<string, number> = {}
          orders.forEach(o => { counts[o.event_id] = (counts[o.event_id] || 0) + o.quantity })
          setTicketCounts(counts)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function startConnectOnboarding() {
    setConnectLoading(true)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setConnectLoading(false)
    } catch {
      setConnectLoading(false)
    }
  }

  async function disconnectStripe() {
    setDisconnectLoading(true)
    try {
      await fetch('/api/stripe/connect/disconnect', { method: 'POST' })
      setMuseum((m: any) => ({ ...m, stripe_connect_id: null, stripe_connect_onboarded: false }))
      setStripeConnectPending(false)
      setShowDisconnectConfirm(false)
    } finally {
      setDisconnectLoading(false)
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formatPrice(cents: number, currency: string) {
    if (cents === 0) return 'Free'
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/events" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8"><TableSkeleton rows={5} cols={5} /></div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).ticketing) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/events" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Events</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-5">◎</div>
            <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Event ticketing is a Professional feature</h2>
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Create events, manage time slots, and sell tickets directly through your museum website. Available on Professional, Institution, and Enterprise plans.</p>
            <button
              onClick={() => router.push('/dashboard/plan')}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
            >
              View plans →
            </button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter)
  const filters = ['all', 'draft', 'published', 'cancelled', 'past']

  return (
    <DashboardShell museum={museum} activePath="/dashboard/events" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Events</span>
        <button
          onClick={() => router.push('/dashboard/events/new')}
          className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
        >
          Create Event
        </button>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Stripe Connect — admin controls */}
        {(isOwner || staffAccess === 'Admin') ? (
          <>
            {!museum.stripe_connect_onboarded && !stripeConnectPending && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">💳</div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg italic text-stone-900 dark:text-stone-100 mb-1">Set up payments to sell tickets</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Connect your Stripe account to receive ticket revenue. Free events work without this. A 2% platform fee applies to paid tickets.</p>
                    <button
                      onClick={startConnectOnboarding}
                      disabled={connectLoading}
                      className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                    >
                      {connectLoading ? 'Redirecting...' : 'Connect Stripe account →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!museum.stripe_connect_onboarded && stripeConnectPending && (
              <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">⏳</div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg italic text-stone-900 dark:text-stone-100 mb-1">Stripe account verification in progress</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Your Stripe account details have been submitted. If verification is taking a while, Stripe may need additional information from you.</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={startConnectOnboarding}
                        disabled={connectLoading}
                        className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                      >
                        {connectLoading ? 'Redirecting...' : 'Complete verification in Stripe →'}
                      </button>
                      <button
                        onClick={disconnectStripe}
                        disabled={disconnectLoading}
                        className="text-xs font-mono text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors disabled:opacity-50"
                      >
                        {disconnectLoading ? 'Clearing…' : 'Start over'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {museum.stripe_connect_onboarded && (
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">✓</div>
                    <div>
                      <span className="text-sm font-mono text-emerald-700 dark:text-emerald-400">Stripe account connected</span>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Paid ticket revenue will be transferred to your Stripe account.</p>
                    </div>
                  </div>
                  {!showDisconnectConfirm ? (
                    <button
                      onClick={() => setShowDisconnectConfirm(true)}
                      className="text-xs font-mono text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-stone-500 dark:text-stone-400">Are you sure?</span>
                      <button
                        onClick={disconnectStripe}
                        disabled={disconnectLoading}
                        className="text-xs font-mono text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {disconnectLoading ? 'Disconnecting…' : 'Yes, disconnect'}
                      </button>
                      <button
                        onClick={() => setShowDisconnectConfirm(false)}
                        className="text-xs font-mono text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4 flex items-center gap-3">
            <div className="text-lg">💳</div>
            <div>
              <span className="text-sm font-mono text-stone-600 dark:text-stone-400">
                {museum.stripe_connect_onboarded ? 'Stripe account connected' : 'Stripe account not connected'}
              </span>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Only admins can connect or manage the Stripe account.</p>
            </div>
          </div>
        )}

        {/* Status filters */}
        <div className="flex gap-1 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-mono px-3 py-1.5 rounded transition-colors capitalize ${
                filter === f
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Events table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">◎</div>
            <p className="text-sm text-stone-400 dark:text-stone-500 font-mono">
              {events.length === 0 ? 'No events yet. Create your first event to get started.' : 'No events match this filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700 text-left">
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Title</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Type</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Date</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Price</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Status</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal text-right">Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(event => (
                    <tr
                      key={event.id}
                      onClick={() => router.push(`/dashboard/events/${event.id}`)}
                      className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-stone-900 dark:text-stone-100 font-medium">{event.title}</td>
                      <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{TYPE_LABELS[event.event_type] || event.event_type}</td>
                      <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono text-xs">{formatDate(event.start_date)}</td>
                      <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono text-xs">{formatPrice(event.price_cents, event.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded capitalize ${STATUS_STYLES[event.status] || ''}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono text-xs text-right">
                        {ticketCounts[event.id] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
