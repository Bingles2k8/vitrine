'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getMuseumForUser } from '@/lib/get-museum'
import DashboardShell from '@/components/DashboardShell'
import DashboardTopBar, { TopBarButton } from '@/components/DashboardTopBar'
import { TableSkeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { formatGroupDates, groupNouns, navStyleMeta } from '@/lib/collectionGroups'
import type { CollectionGroupRow } from '@/lib/collectionGroups/types'

export default function SetsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [sets, setSets] = useState<CollectionGroupRow[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const result = await getMuseumForUser(supabase)
      if (!result?.museum) { router.push('/login'); return }
      setMuseum(result.museum)
      setIsOwner(result.isOwner)
      setStaffAccess(result.staffAccess)
      await loadSets(result.museum.id)
      setLoading(false)
    }
    load()
  }, [])

  async function loadSets(museumId: string) {
    const [{ data: groups }, { data: items }] = await Promise.all([
      supabase
        .from('collection_groups').select('*').eq('museum_id', museumId)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('collection_group_items').select('group_id, role').eq('museum_id', museumId),
    ])

    setSets((groups ?? []) as CollectionGroupRow[])

    // Manual counts are exact; rule counts are resolved on the set's own page
    // rather than approximated here from a join.
    const tally: Record<string, number> = {}
    for (const item of items ?? []) {
      if ((item as any).role !== 'include') continue
      const key = (item as any).group_id as string
      tally[key] = (tally[key] ?? 0) + 1
    }
    setCounts(tally)
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const nouns = museum ? groupNouns(museum) : { singular: 'Set', plural: 'Sets' }

  async function handleCreate() {
    if (!canEdit || creating) return
    setCreating(true)
    const res = await fetch('/api/collection-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Untitled ${nouns.singular.toLowerCase()}` }),
    })
    setCreating(false)
    if (!res.ok) { toast(`Could not create the ${nouns.singular.toLowerCase()}`, 'error'); return }
    const created = await res.json()
    router.push(`/dashboard/sets/${created.id}`)
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...sets]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSets(next)
    await fetch('/api/collection-groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map(s => s.id) }),
    })
  }

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/sets" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8"><TableSkeleton rows={4} cols={4} /></div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      museum={museum}
      activePath="/dashboard/sets"
      onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
      isOwner={isOwner}
      staffAccess={staffAccess}
    >
      <DashboardTopBar
        title={nouns.plural}
        actions={canEdit && (
          <TopBarButton variant="primary" onClick={handleCreate} disabled={creating}>
            + New {nouns.singular.toLowerCase()}
          </TopBarButton>
        )}
      />

      <div className="p-4 md:p-8">
        {sets.length === 0 ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <div className="text-5xl mb-4">🗂️</div>
            <h2 className="font-serif italic text-2xl text-stone-900 dark:text-stone-100 mb-3">
              No {nouns.plural.toLowerCase()} yet
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
              A {nouns.singular.toLowerCase()} gathers part of your collection under a name, with its own
              page on your public site. Pick the items yourself, or save a filter and let
              it keep itself up to date.
            </p>
            {canEdit && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="text-sm font-mono px-5 py-2.5 rounded bg-stone-900 text-white dark:bg-white dark:text-stone-900 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Create your first {nouns.singular.toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            {sets.map((set, i) => {
              const dates = formatGroupDates(set)
              const nav = navStyleMeta(set.nav_style)
              return (
                <div
                  key={set.id}
                  className="flex items-center gap-4 px-5 py-4 border-b border-stone-100 dark:border-stone-800 last:border-b-0 hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors"
                >
                  {canEdit && (
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 text-xs leading-none"
                      >▲</button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === sets.length - 1}
                        aria-label="Move down"
                        className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 text-xs leading-none"
                      >▼</button>
                    </div>
                  )}

                  <Link href={`/dashboard/sets/${set.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{set.title}</span>
                      {set.status === 'draft' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                          Draft
                        </span>
                      )}
                      {set.membership === 'rule' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                          Automatic
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-1">
                      {[
                        set.membership === 'rule' ? 'Filter-based' : `${counts[set.id] ?? 0} items`,
                        dates,
                        nav.id === 'grid' ? null : nav.label,
                        set.show_as_section ? 'On homepage' : null,
                        set.show_as_chip ? 'Filter chip' : null,
                      ].filter(Boolean).join('  ·  ')}
                    </div>
                  </Link>

                  {set.status === 'published' && museum?.slug && (
                    <a
                      href={`/museum/${museum.slug}/sets/${set.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 shrink-0 transition-colors"
                    >
                      View ↗
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
