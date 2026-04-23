'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { inputCls, labelCls } from '@/components/tabs/shared'

interface ObjectOption {
  id: string
  title: string
  emoji?: string | null
  accession_no?: string | null
}

interface PersonalLoanModalProps {
  museumId: string
  loan?: any
  objects?: ObjectOption[]
  presetObjectId?: string
  onClose: () => void
  onSaved: () => void
}

export default function PersonalLoanModal({ museumId, loan, objects, presetObjectId, onClose, onSaved }: PersonalLoanModalProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    object_id: presetObjectId || loan?.object_id || '',
    borrower_name: loan?.borrower_name || '',
    borrower_contact: loan?.borrower_contact || '',
    lent_on: loan?.lent_on || today,
    due_back: loan?.due_back || '',
    returned_on: loan?.returned_on || '',
    note: loan?.note || '',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.object_id) { toast('Pick an object', 'error'); return }
    if (!form.borrower_name.trim()) { toast('Borrower name is required', 'error'); return }
    if (!form.lent_on) { toast('Lent-on date is required', 'error'); return }
    setSaving(true)

    const url = loan ? `/api/personal-loans/${loan.id}` : '/api/personal-loans'
    const method = loan ? 'PATCH' : 'POST'
    const body: any = {
      borrower_name: form.borrower_name.trim(),
      borrower_contact: form.borrower_contact.trim() || null,
      lent_on: form.lent_on,
      due_back: form.due_back || null,
      note: form.note.trim() || null,
    }
    if (!loan) body.object_id = form.object_id
    if (loan) body.returned_on = form.returned_on || null

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
    toast(loan ? 'Loan updated' : 'Loan recorded')
    onSaved()
  }

  const showObjectPicker = !loan && !presetObjectId
  const selectedObject = objects?.find(o => o.id === form.object_id)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {loan ? 'Edit loan' : 'Lend an object'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {showObjectPicker && (
            <div>
              <label className={labelCls}>Object <span className="text-red-400">*</span></label>
              <select
                value={form.object_id}
                onChange={e => set('object_id', e.target.value)}
                className={inputCls}
                required
              >
                <option value="">Pick an object…</option>
                {objects?.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.emoji ? `${o.emoji} ` : ''}{o.title}{o.accession_no ? ` (${o.accession_no})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!showObjectPicker && selectedObject && (
            <div className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-3 py-2">
              {selectedObject.emoji ? `${selectedObject.emoji} ` : ''}{selectedObject.title}
            </div>
          )}

          <div>
            <label className={labelCls}>Borrower name <span className="text-red-400">*</span></label>
            <input
              ref={nameRef}
              type="text"
              value={form.borrower_name}
              onChange={e => set('borrower_name', e.target.value)}
              placeholder="e.g. Jane Smith"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Contact (optional)</label>
            <input
              type="text"
              value={form.borrower_contact}
              onChange={e => set('borrower_contact', e.target.value)}
              placeholder="Phone / email / address"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Lent on <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={form.lent_on}
                onChange={e => set('lent_on', e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Due back</label>
              <input
                type="date"
                value={form.due_back}
                onChange={e => set('due_back', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {loan && (
            <div>
              <label className={labelCls}>Returned on</label>
              <input
                type="date"
                value={form.returned_on}
                onChange={e => set('returned_on', e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Fill this in to close the loan.</p>
            </div>
          )}

          <div>
            <label className={labelCls}>Note</label>
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="e.g. Hand-delivered, collect by end of June"
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
              {saving ? 'Saving…' : loan ? 'Save changes' : 'Record loan'}
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
