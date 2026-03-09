'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

export default function TicketScannerPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [resultState, setResultState] = useState<'idle' | 'valid' | 'used' | 'invalid' | 'loading'>('idle')
  const [marking, setMarking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)

      if (!getPlan(museum.plan).ticketing) { router.push('/dashboard/events'); return }

      const { data: ev } = await supabase.from('events').select('id, title, start_date, end_date').eq('id', params.id).eq('museum_id', museum.id).single()
      if (!ev) { router.push('/dashboard/events'); return }
      setEvent(ev)
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    load()
  }, [])

  async function handleLookup() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setResultState('loading')
    setResult(null)
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(trimmed)}`)
      if (!res.ok) { setResultState('invalid'); return }
      const { ticket } = await res.json()
      setResult(ticket)
      if (ticket.status === 'valid') setResultState('valid')
      else if (ticket.status === 'used') setResultState('used')
      else setResultState('invalid')
    } catch {
      setResultState('invalid')
    }
  }

  async function handleMarkUsed() {
    if (!result) return
    setMarking(true)
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(result.ticket_code)}?mark_used=true`)
      if (res.ok) {
        setResult((r: any) => ({ ...r, status: 'used' }))
        setResultState('used')
      }
    } catch {
      // ignore
    }
    setMarking(false)
  }

  function reset() {
    setCode('')
    setResult(null)
    setResultState('idle')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-500 font-mono text-sm">Loading scanner…</div>
      </div>
    )
  }

  const order = result?.ticket_orders as any
  const ev = order?.events as any
  const slot = order?.event_time_slots as any

  const statusColors = {
    idle: 'bg-stone-900',
    loading: 'bg-stone-800',
    valid: 'bg-emerald-900',
    used: 'bg-amber-900',
    invalid: 'bg-red-900',
  }

  const statusIcons = { idle: '◎', loading: '…', valid: '✓', used: '◎', invalid: '✗' }
  const statusLabels = { idle: 'Ready to scan', loading: 'Looking up…', valid: 'Valid ticket', used: 'Already used', invalid: 'Invalid ticket' }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
        <button onClick={() => router.push(`/dashboard/events/${params.id}`)} className="text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors">
          ← Back to event
        </button>
        <div className="text-xs font-mono text-stone-400 truncate max-w-[200px]">{event?.title}</div>
        <button onClick={reset} className="text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors">Reset</button>
      </div>

      {/* Status area */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-8 transition-colors ${statusColors[resultState]}`}>
        <div className="text-6xl mb-4 font-mono">{statusIcons[resultState]}</div>
        <div className="text-2xl font-mono font-bold mb-2">{statusLabels[resultState]}</div>

        {result && (
          <div className="mt-4 bg-black/30 rounded-xl px-6 py-4 w-full max-w-sm text-sm">
            <div className="font-mono text-stone-300 mb-3 text-xs">{result.ticket_code}</div>
            {ev && <div className="font-medium text-white mb-1">{ev.title}</div>}
            {slot && (
              <div className="text-stone-400 text-xs font-mono">
                {new Date(slot.start_time).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {order?.buyer_name && <div className="text-stone-300 mt-2">{order.buyer_name}</div>}
          </div>
        )}

        {resultState === 'valid' && (isOwner || staffAccess === 'Admin' || staffAccess === 'Editor') && (
          <button
            onClick={handleMarkUsed}
            disabled={marking}
            className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm px-8 py-3 rounded-xl disabled:opacity-50 transition-colors"
          >
            {marking ? 'Marking…' : 'Mark as used →'}
          </button>
        )}

        {(resultState === 'used' || resultState === 'invalid') && (
          <button onClick={reset} className="mt-6 bg-stone-700 hover:bg-stone-600 text-white font-mono text-sm px-8 py-3 rounded-xl transition-colors">
            Scan another →
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-stone-800 p-4 bg-stone-950">
        <div className="text-xs font-mono text-stone-500 mb-2 text-center">
          Enter ticket code manually, or use a USB barcode scanner
        </div>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input
            ref={inputRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
            placeholder="VIT-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 font-mono text-sm text-white placeholder-stone-600 outline-none focus:border-stone-500"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={handleLookup}
            disabled={resultState === 'loading' || !code.trim()}
            className="bg-white text-stone-900 font-mono text-sm px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors hover:bg-stone-100"
          >
            Look up
          </button>
        </div>
      </div>
    </div>
  )
}
