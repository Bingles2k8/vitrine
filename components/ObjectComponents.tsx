'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'

interface Component {
  id: string
  component_number: number
  part_number_label: string | null
  component_accession_no: string | null
  title: string | null
  notes: string | null
}

interface Props {
  objectId: string
  accessionNo: string
  canEdit: boolean
}

export default function ObjectComponents({ objectId, accessionNo, canEdit }: Props) {
  const { toast } = useToast()
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ part_number_label: string; title: string; notes: string }>({ part_number_label: '', title: '', notes: '' })
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ part_number_label: '', title: '', notes: '' })

  useEffect(() => {
    fetch(`/api/objects/${objectId}/components`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setComponents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [objectId])

  async function addComponent() {
    const res = await fetch(`/api/objects/${objectId}/components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    if (!res.ok) { toast('Failed to add part', 'error'); return }
    const created: Component = await res.json()
    setComponents(prev => [...prev, created])
    setNewForm({ part_number_label: '', title: '', notes: '' })
    setAdding(false)
    toast('Part added')
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/objects/${objectId}/components/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (!res.ok) { toast('Failed to save', 'error'); return }
    const updated: Component = await res.json()
    setComponents(prev => prev.map(c => c.id === id ? updated : c))
    setEditingId(null)
    toast('Part saved')
  }

  async function deleteComponent(id: string) {
    const res = await fetch(`/api/objects/${objectId}/components/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Failed to remove', 'error'); return }
    setComponents(prev => prev.filter(c => c.id !== id))
    toast('Part removed')
  }

  if (loading) return <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">Loading parts…</p>

  return (
    <div className="mt-3 space-y-2">
      {components.length === 0 && !adding && (
        <p className="text-xs text-stone-400 dark:text-stone-500">No parts recorded yet.</p>
      )}

      {components.map(c => (
        <div key={c.id} className="border border-stone-100 dark:border-stone-800 rounded-lg p-3 space-y-2">
          {editingId === c.id ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>Part Number</label>
                  <input value={editForm.part_number_label} onChange={e => setEditForm(f => ({ ...f, part_number_label: e.target.value }))} placeholder="e.g. 1, 1a, B" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Title</label>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(c.id)} className="text-xs font-mono text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1 hover:bg-stone-50 dark:hover:bg-stone-800">Save</button>
                <button onClick={() => setEditingId(null)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700">Cancel</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                    Part {c.part_number_label || c.component_number}
                  </span>
                  {c.component_accession_no && (
                    <span className="text-xs font-mono text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5">{c.component_accession_no}</span>
                  )}
                  {c.title && <span className="text-sm text-stone-900 dark:text-stone-100 truncate">{c.title}</span>}
                </div>
                {c.notes && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{c.notes}</p>}
              </div>
              {canEdit && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setEditingId(c.id); setEditForm({ part_number_label: c.part_number_label || '', title: c.title || '', notes: c.notes || '' }) }}
                    className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                  >Edit</button>
                  <button
                    onClick={() => deleteComponent(c.id)}
                    className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                  >Remove</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {adding && (
        <div className="border border-stone-100 dark:border-stone-800 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Part Number</label>
              <input value={newForm.part_number_label} onChange={e => setNewForm(f => ({ ...f, part_number_label: e.target.value }))} placeholder="e.g. 1, 1a, B" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} placeholder={`e.g. Left shoe`} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addComponent} className="text-xs font-mono text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1 hover:bg-stone-50 dark:hover:bg-stone-800">Add Part</button>
            <button onClick={() => { setAdding(false); setNewForm({ part_number_label: '', title: '', notes: '' }) }} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700">Cancel</button>
          </div>
        </div>
      )}

      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          + Add part
        </button>
      )}
    </div>
  )
}
