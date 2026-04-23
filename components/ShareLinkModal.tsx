'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/Toast'
import { inputCls, labelCls } from '@/components/tabs/shared'
import { OBJECT_STATUSES } from '@/lib/validations'

interface ShareLinkModalProps {
  onClose: () => void
  onCreated: (link: { id: string; label: string | null }) => void
}

export default function ShareLinkModal({ onClose, onCreated }: ShareLinkModalProps) {
  const [label, setLabel] = useState('')
  const [passcode, setPasscode] = useState('')
  const [expiresIn, setExpiresIn] = useState<'never' | '1d' | '7d' | '30d' | '90d'>('30d')
  const [maxViews, setMaxViews] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => { labelRef.current?.focus() }, [])

  function toggleStatus(s: string) {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function computeExpiresAt(): string | null {
    if (expiresIn === 'never') return null
    const days = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }[expiresIn]
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (passcode.length < 4) { toast('Passcode must be at least 4 characters', 'error'); return }
    setSaving(true)

    const body: any = {
      label: label.trim() || undefined,
      passcode,
      expires_at: computeExpiresAt(),
      max_views: maxViews ? Number(maxViews) : null,
      scope_filter: statusFilter.length > 0 ? { status: statusFilter } : {},
    }

    const res = await fetch('/api/share-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast(payload.error || 'Failed to create share link', 'error')
      setSaving(false)
      return
    }

    toast('Share link created')
    onCreated(payload.link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">New share link</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Label</label>
            <input
              ref={labelRef}
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. For insurance broker"
              className={inputCls}
            />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Internal name to remember who you shared with.</p>
          </div>

          <div>
            <label className={labelCls}>Passcode <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="At least 4 characters"
              className={inputCls}
              minLength={4}
              maxLength={64}
              required
            />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Share this separately from the link itself.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Expires</label>
              <select
                value={expiresIn}
                onChange={e => setExpiresIn(e.target.value as typeof expiresIn)}
                className={inputCls}
              >
                <option value="1d">After 1 day</option>
                <option value="7d">After 7 days</option>
                <option value="30d">After 30 days</option>
                <option value="90d">After 90 days</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>View limit</label>
              <input
                type="number"
                min={1}
                max={100000}
                value={maxViews}
                onChange={e => setMaxViews(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Which objects?</label>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
              {statusFilter.length === 0
                ? 'All objects in your collection'
                : `Only objects with status: ${statusFilter.join(', ')}`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OBJECT_STATUSES.map(s => {
                const active = statusFilter.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStatus(s)}
                    className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                      active
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white'
                        : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || passcode.length < 4}
              className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono py-2.5 rounded disabled:opacity-50 hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors"
            >
              {saving ? 'Creating…' : 'Create link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
