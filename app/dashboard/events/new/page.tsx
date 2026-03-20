'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'

export default function NewEventPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('exhibition')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [pricePounds, setPricePounds] = useState('')
  const [currency, setCurrency] = useState('gbp')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      setMuseum(result.museum)
      setIsOwner(result.isOwner)
      setStaffAccess(result.staffAccess)
      if (!getPlan(result.museum.plan).ticketing) { router.push('/dashboard/events'); return }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) return
    setSaving(true)

    const priceCents = Math.round((parseFloat(pricePounds) || 0) * 100)

    const { data, error } = await supabase
      .from('events')
      .insert({
        museum_id: museum.id,
        title: title.trim(),
        event_type: eventType,
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
        location: location.trim() || null,
        price_cents: priceCents,
        currency,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) {
      setSaving(false)
      return
    }

    // Log activity
    await supabase.from('activity_log').insert({
      museum_id: museum.id,
      action_type: 'event_created',
      description: `Created event "${title.trim()}"`,
    })

    router.push(`/dashboard/events/${data.id}`)
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/events" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
    </DashboardShell>
  )

  return (
    <DashboardShell museum={museum} activePath="/dashboard/events" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0 z-10">
        <button onClick={() => router.push('/dashboard/events')} className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-sm mr-3">←</button>
        <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Create Event</span>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Ancient Egypt: Rediscovered"
              required
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Event Type</label>
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
            >
              <option value="exhibition">Exhibition</option>
              <option value="workshop">Workshop</option>
              <option value="talk">Talk</option>
              <option value="tour">Tour</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe this event..."
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value) }}
                required
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                required
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Main Gallery, Ground Floor"
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Ticket Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">£</span>
                <input
                  type="number"
                  value={pricePounds}
                  onChange={e => setPricePounds(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00 (free)"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded pl-7 pr-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
                />
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">A Vitrine platform fee of 3.5% + £0.20 is added per transaction.</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
              >
                <option value="gbp">GBP (£)</option>
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/events')}
              className="text-xs font-mono px-5 py-2.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !startDate || !endDate}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}
