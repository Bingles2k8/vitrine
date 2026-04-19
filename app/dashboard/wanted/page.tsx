'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import { TableSkeleton } from '@/components/Skeleton'
import WantedItemModal from '@/components/WantedItemModal'

const PRIORITY_STYLES: Record<string, string> = {
  high:   'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  low:    'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export default function WantedPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showAcquired, setShowAcquired] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [acquiring, setAcquiring] = useState<string | null>(null)
  const [showWanted, setShowWanted] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const result = await getMuseumForUser(supabase)
      if (!result?.museum) { router.push('/login'); return }
      const { museum, isOwner, staffAccess } = result

      if (!getPlan(museum.plan).wishlist) { router.push('/dashboard'); return }

      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setShowWanted(museum.show_wanted ?? false)
      await loadItems(museum.id)
      setLoading(false)
    }
    load()
  }, [])

  async function loadItems(museumId: string) {
    const { data } = await supabase
      .from('wanted_items')
      .select('*')
      .eq('museum_id', museumId)
      .order('created_at', { ascending: false })
    setItems(data || [])
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  async function handleDelete(id: string) {
    if (!canEdit) return
    if (!confirm('Delete this wanted item?')) return
    await supabase.from('wanted_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast('Item deleted')
  }

  async function handleAcquire(item: any) {
    if (!canEdit || acquiring) return
    setAcquiring(item.id)
    try {
      const res = await fetch(`/api/wanted/${item.id}/acquire`, { method: 'POST' })
      if (!res.ok) { toast('Failed to mark as acquired', 'error'); return }
      const { objectId } = await res.json()
      toast('Item marked as acquired — opening new object…')
      await loadItems(museum.id)
      router.push(`/dashboard/objects/${objectId}`)
    } catch {
      toast('Something went wrong', 'error')
    } finally {
      setAcquiring(null)
    }
  }

  function openAdd() { setEditingItem(null); setModalOpen(true) }
  function openEdit(item: any) { setEditingItem(item); setModalOpen(true) }

  async function handleSaved() {
    setModalOpen(false)
    await loadItems(museum.id)
  }

  async function handleTogglePublic() {
    if (!canEdit || savingToggle) return
    setSavingToggle(true)
    const next = !showWanted
    const { error } = await supabase.from('museums').update({ show_wanted: next }).eq('id', museum.id)
    if (error) { toast('Failed to save', 'error') } else { setShowWanted(next); toast(next ? 'Wishlist is now public' : 'Wishlist hidden from public site') }
    setSavingToggle(false)
  }

  const filtered = items
    .filter(i => showAcquired ? true : !i.acquired_at)
    .filter(i => priorityFilter === 'all' ? true : i.priority === priorityFilter)
    .filter(i => search ? i.title.toLowerCase().includes(search.toLowerCase()) : true)
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 1
      const pb = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 1
      if (pa !== pb) return pa - pb
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/wanted" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8"><TableSkeleton rows={5} cols={4} /></div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      museum={museum}
      activePath="/dashboard/wanted"
      onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
      isOwner={isOwner}
      staffAccess={staffAccess}
    >
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Wishlist</span>
        {canEdit && (
          <button
            onClick={openAdd}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors"
          >
            + Add item
          </button>
        )}
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Public toggle */}
        {canEdit && (
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-4">
            <div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Show on public site</div>
              <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Displays your active wishlist as a tab on your collection page</div>
            </div>
            <button
              type="button"
              onClick={handleTogglePublic}
              disabled={savingToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${showWanted ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showWanted ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 w-48"
          />
          <div className="flex gap-1">
            {['all', 'high', 'medium', 'low'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                  priorityFilter === p
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white'
                    : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAcquired(!showAcquired)}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              showAcquired
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            {showAcquired ? '✓ Showing acquired' : 'Show acquired'}
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-12 text-center">
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
              {items.length === 0
                ? 'Your wishlist is empty. Add items you\'re actively hunting for.'
                : 'No items match your filters.'}
            </p>
            {items.length === 0 && canEdit && (
              <button
                onClick={openAdd}
                className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors border border-stone-200 dark:border-stone-700 px-4 py-2 rounded"
              >
                Add your first wishlist item →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 px-6 py-4 ${idx < filtered.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''} ${item.acquired_at ? 'opacity-60' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.title}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium}`}>
                      {item.priority}
                    </span>
                    {item.acquired_at && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        acquired
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-stone-400 dark:text-stone-500">
                    {item.year && <span>{item.year}</span>}
                    {item.medium && <span>{item.medium}</span>}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">{item.notes}</p>
                  )}
                  {item.acquired_at && item.converted_object_id && (
                    <button
                      onClick={() => router.push(`/dashboard/objects/${item.converted_object_id}`)}
                      className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mt-1 transition-colors"
                    >
                      View object →
                    </button>
                  )}
                </div>
                {canEdit && !item.acquired_at && (
                  <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    <button
                      onClick={() => handleAcquire(item)}
                      disabled={!!acquiring}
                      className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
                    >
                      {acquiring === item.id ? 'Marking…' : 'Mark as acquired'}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <WantedItemModal
          museumId={museum.id}
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </DashboardShell>
  )
}
