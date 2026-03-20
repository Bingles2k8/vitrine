'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { TableSkeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

interface Event {
  id: string
  museum_id: string
  title: string
  event_type: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  image_url: string | null
  price_cents: number
  currency: string
  status: string
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  open_entry: boolean
}

interface Order {
  id: string
  buyer_name: string
  buyer_email: string
  quantity: number
  amount_cents: number
  currency: string
  status: string
  created_at: string
  tickets?: { id: string; ticket_code: string; status: string }[]
}

const TYPE_LABELS: Record<string, string> = {
  exhibition: 'Exhibition', workshop: 'Workshop', talk: 'Talk', tour: 'Tour',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'slots' | 'orders'>('overview')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Slot form state
  const [slotDate, setSlotDate] = useState('')
  const [slotStart, setSlotStart] = useState('10:00')
  const [slotEnd, setSlotEnd] = useState('11:00')
  const [slotCapacity, setSlotCapacity] = useState('50')
  const [slotOpenEntry, setSlotOpenEntry] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editPricePounds, setEditPricePounds] = useState('')
  const [editCurrency, setEditCurrency] = useState('gbp')

  // Expanded order for viewing tickets
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      if (!getPlan(result.museum.plan).ticketing) { router.push('/dashboard/events'); return }
      setMuseum(result.museum)
      setIsOwner(result.isOwner)
      setStaffAccess(result.staffAccess)

      const { data: evt } = await supabase.from('events').select('*').eq('id', id).single()
      if (!evt) { router.push('/dashboard/events'); return }
      setEvent(evt)
      setEditTitle(evt.title)
      setEditType(evt.event_type)
      setEditDescription(evt.description || '')
      setEditStartDate(evt.start_date)
      setEditEndDate(evt.end_date)
      setEditLocation(evt.location || '')
      setEditPricePounds((evt.price_cents / 100).toString())
      setEditCurrency(evt.currency)

      const { data: s } = await supabase
        .from('event_time_slots')
        .select('*')
        .eq('event_id', id)
        .order('start_time', { ascending: true })
      setSlots(s || [])

      const { data: o } = await supabase
        .from('ticket_orders')
        .select('*, tickets(*)')
        .eq('event_id', id)
        .order('created_at', { ascending: false })
      setOrders(o || [])

      setLoading(false)
    }
    load()
  }, [id])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSaveOverview() {
    if (!event) return
    if (editEndDate && editStartDate && editEndDate < editStartDate) {
      toast('End date must be on or after start date', 'error')
      return
    }
    setSaving(true)
    const priceCents = Math.round((parseFloat(editPricePounds) || 0) * 100)
    await supabase.from('events').update({
      title: editTitle.trim(),
      event_type: editType,
      description: editDescription.trim() || null,
      start_date: editStartDate,
      end_date: editEndDate,
      location: editLocation.trim() || null,
      price_cents: priceCents,
      currency: editCurrency,
      updated_at: new Date().toISOString(),
    }).eq('id', event.id)
    setEvent(e => e ? { ...e, title: editTitle.trim(), event_type: editType, description: editDescription.trim() || null, start_date: editStartDate, end_date: editEndDate, location: editLocation.trim() || null, price_cents: priceCents, currency: editCurrency } : e)
    setSaving(false)
  }

  async function handleStatusChange(newStatus: string) {
    if (!event) return
    await supabase.from('events').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', event.id)
    setEvent(e => e ? { ...e, status: newStatus } : e)
    await supabase.from('activity_log').insert({
      museum_id: museum.id,
      action_type: `event_${newStatus}`,
      description: `Event "${event.title}" ${newStatus}`,
    })
  }

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault()
    if (!event || !slotDate) return
    const startTime = `${slotDate}T${slotStart}:00`
    const endTime = `${slotDate}T${slotEnd}:00`
    const { data } = await supabase
      .from('event_time_slots')
      .insert({ event_id: event.id, start_time: startTime, end_time: endTime, capacity: parseInt(slotCapacity) || 50, open_entry: slotOpenEntry })
      .select('*')
      .single()
    if (data) {
      setSlots(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)))
      setSlotOpenEntry(false)
    }
  }

  async function handleDeleteSlot(slotId: string) {
    const slot = slots.find(s => s.id === slotId)
    if (slot && slot.booked_count > 0) return // Don't delete slots with bookings
    await supabase.from('event_time_slots').delete().eq('id', slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  async function handleMarkTicketUsed(ticketId: string) {
    await supabase.from('tickets').update({ status: 'used' }).eq('id', ticketId)
    setOrders(prev => prev.map(o => ({
      ...o,
      tickets: o.tickets?.map(t => t.id === ticketId ? { ...t, status: 'used' } : t),
    })))
  }

  function formatDateTime(dt: string) {
    return new Date(dt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  function formatTime(dt: string) {
    return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  function formatPrice(cents: number, currency: string) {
    if (cents === 0) return 'Free'
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/events" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8"><TableSkeleton rows={5} cols={4} /></div>
    </DashboardShell>
  )

  if (!event) return null

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'slots' as const, label: `Time Slots (${slots.length})` },
    { key: 'orders' as const, label: `Orders (${orders.filter(o => o.status === 'completed').length})` },
  ]

  const totalTickets = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.quantity, 0)
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount_cents, 0)

  return (
    <DashboardShell museum={museum} activePath="/dashboard/events" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/dashboard/events')} className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-sm shrink-0">←</button>
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100 truncate max-w-[130px] sm:max-w-none">{event.title}</span>
          <span className={`hidden sm:inline text-xs font-mono px-2 py-0.5 rounded capitalize ${
            event.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
            : event.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
          }`}>
            {event.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/dashboard/events/${event.id}/scan`)} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">
            Scan tickets →
          </button>
          {event.status === 'draft' && (
            <button onClick={() => handleStatusChange('published')} className="bg-emerald-600 text-white text-xs font-mono px-4 py-2 rounded hover:bg-emerald-700 transition-colors">
              Publish
            </button>
          )}
          {event.status === 'published' && (
            <button onClick={() => handleStatusChange('cancelled')} className="bg-red-600 text-white text-xs font-mono px-4 py-2 rounded hover:bg-red-700 transition-colors">
              Cancel Event
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="px-4 md:px-8 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Tickets Sold</div>
          <div className="text-2xl font-mono text-stone-900 dark:text-stone-100">{totalTickets}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Revenue</div>
          <div className="text-2xl font-mono text-stone-900 dark:text-stone-100">{formatPrice(totalRevenue, event.currency)}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Time Slots</div>
          <div className="text-2xl font-mono text-stone-900 dark:text-stone-100">{slots.length}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Total Capacity</div>
          <div className="text-2xl font-mono text-stone-900 dark:text-stone-100">{slots.reduce((s, sl) => s + sl.capacity, 0)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-6">
        <div className="flex gap-1 border-b border-stone-200 dark:border-stone-700">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs font-mono px-4 py-2.5 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-stone-900 dark:border-white text-stone-900 dark:text-stone-100'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Title</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Event Type</label>
              <select value={editType} onChange={e => setEditType(e.target.value)}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400">
                <option value="exhibition">Exhibition</option>
                <option value="workshop">Workshop</option>
                <option value="talk">Talk</option>
                <option value="tour">Tour</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Start Date</label>
                <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">End Date</label>
                <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} min={editStartDate}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Location</label>
              <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Ticket Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">£</span>
                  <input type="number" value={editPricePounds} onChange={e => setEditPricePounds(e.target.value)} min="0" step="0.01"
                    className="w-full border border-stone-200 dark:border-stone-700 rounded pl-7 pr-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Currency</label>
                <select value={editCurrency} onChange={e => setEditCurrency(e.target.value)}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400">
                  <option value="gbp">GBP (£)</option>
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveOverview} disabled={saving}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => router.push(`/dashboard/events/${event.id}/scan`)}
                className="border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                Scan tickets →
              </button>
            </div>
          </div>
        )}

        {/* Time Slots Tab */}
        {tab === 'slots' && (
          <div className="space-y-6">
            {/* Add slot form */}
            <form onSubmit={handleAddSlot} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">Add Time Slot</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Date</label>
                  <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} required
                    min={event.start_date} max={event.end_date}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Start Time</label>
                  <input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} required
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">End Time</label>
                  <input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} required
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Capacity</label>
                  <div className="flex gap-2">
                    <input type="number" value={slotCapacity} onChange={e => setSlotCapacity(e.target.value)} min="1" required
                      className="flex-1 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400" />
                    <button type="submit"
                      className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-4 cursor-pointer w-fit">
                <input type="checkbox" checked={slotOpenEntry} onChange={e => setSlotOpenEntry(e.target.checked)}
                  className="rounded border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white" />
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">Open entry — visitors can buy tickets after the start time (e.g. exhibitions)</span>
              </label>
            </form>

            {/* Slots list */}
            {slots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-stone-400 dark:text-stone-500 font-mono">No time slots yet. Add your first slot above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => {
                  const pct = slot.capacity > 0 ? Math.round((slot.booked_count / slot.capacity) * 100) : 0
                  return (
                    <div key={slot.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-stone-900 dark:text-stone-100 font-mono">
                            {formatDateTime(slot.start_time)} — {formatTime(slot.end_time)}
                          </span>
                          {slot.open_entry && (
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">open entry</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden max-w-xs">
                            <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                            {slot.booked_count}/{slot.capacity} booked
                          </span>
                        </div>
                      </div>
                      {slot.booked_count === 0 && (
                        <button onClick={() => handleDeleteSlot(slot.id)}
                          className="text-xs font-mono text-stone-400 hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-stone-400 dark:text-stone-500 font-mono">No orders yet.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-700 text-left">
                        <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Buyer</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Email</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Qty</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Amount</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Status</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <>
                          <tr
                            key={order.id}
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-stone-900 dark:text-stone-100">{order.buyer_name}</td>
                            <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono text-xs">{order.buyer_email}</td>
                            <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono">{order.quantity}</td>
                            <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono text-xs">{formatPrice(order.amount_cents, order.currency)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-mono px-2 py-0.5 rounded capitalize ${
                                order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : order.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-400 dark:text-stone-500 font-mono text-xs">
                              {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </td>
                          </tr>
                          {expandedOrder === order.id && order.tickets && (
                            <tr key={`${order.id}-tickets`}>
                              <td colSpan={6} className="px-4 py-3 bg-stone-50 dark:bg-stone-800">
                                <div className="space-y-2">
                                  {order.tickets.map(ticket => (
                                    <div key={ticket.id} className="flex items-center gap-3">
                                      <span className="font-mono text-xs text-stone-900 dark:text-stone-100">{ticket.ticket_code}</span>
                                      <span className={`text-xs font-mono px-2 py-0.5 rounded capitalize ${
                                        ticket.status === 'valid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                        : ticket.status === 'used' ? 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
                                        : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                                      }`}>
                                        {ticket.status}
                                      </span>
                                      {ticket.status === 'valid' && (
                                        <button onClick={() => handleMarkTicketUsed(ticket.id)}
                                          className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                          Mark used
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
