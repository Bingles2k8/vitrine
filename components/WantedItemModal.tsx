'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { inputCls, labelCls } from '@/components/tabs/shared'

interface WantedItemModalProps {
  museumId: string
  item?: any  // null = new, object = edit
  onClose: () => void
  onSaved: () => void
}

const PRIORITIES = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

export default function WantedItemModal({ museumId, item, onClose, onSaved }: WantedItemModalProps) {
  const [form, setForm] = useState({
    title: '',
    year: '',
    medium: '',
    notes: '',
    priority: 'medium',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        year: item.year || '',
        medium: item.medium || '',
        notes: item.notes || '',
        priority: item.priority || 'medium',
      })
    }
    titleRef.current?.focus()
  }, [item])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast('Title is required', 'error'); return }
    setSaving(true)

    const url = item ? `/api/wanted/${item.id}` : '/api/wanted'
    const method = item ? 'PATCH' : 'POST'
    const body = item
      ? { ...form }
      : { ...form, museum_id: museumId }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      toast('Failed to save', 'error')
      setSaving(false)
      return
    }
    toast(item ? 'Item updated' : 'Item added')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {item ? 'Edit wishlist item' : 'Add to wishlist'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Title <span className="text-red-400">*</span></label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Wedgwood jasperware vase, first edition Penguin…"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Year / date</label>
            <input
              type="text"
              value={form.year}
              onChange={e => set('year', e.target.value)}
              placeholder="e.g. 1920s, c.1850"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('priority', p.value)}
                  className={`flex-1 py-2 rounded text-xs font-mono border transition-colors ${
                    form.priority === p.value
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white'
                      : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Looking for first edition only, max budget £40, mint condition preferred…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono py-2.5 rounded disabled:opacity-50 hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors"
            >
              {saving ? 'Saving…' : item ? 'Save changes' : 'Add to list'}
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
