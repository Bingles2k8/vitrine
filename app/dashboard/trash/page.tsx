'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { useToast } from '@/components/Toast'
import { TableSkeleton } from '@/components/Skeleton'

export default function TrashPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

      const { data } = await supabase
        .from('objects')
        .select('id, title, emoji, accession_no, status, deleted_at')
        .eq('museum_id', result.museum.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      setObjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleRestore(id: string) {
    const { error } = await supabase
      .from('objects')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Object restored')
      setObjects(objects.filter(a => a.id !== id))
    }
  }

  async function handlePermanentDelete(id: string, title: string) {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return

    const { error } = await supabase
      .from('objects')
      .delete()
      .eq('id', id)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Permanently deleted')
      setObjects(objects.filter(a => a.id !== id))
    }
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/trash" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8"><TableSkeleton rows={5} cols={4} /></div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/trash" onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }} isOwner={isOwner} staffAccess={staffAccess}>
      {/* Header */}
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">Trash</span>
          <span className="text-xs font-mono text-stone-300 dark:text-stone-600">{objects.length} item{objects.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="p-8">
        {objects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-stone-400 dark:text-stone-500 font-mono">Trash is empty</p>
            <p className="text-xs text-stone-300 dark:text-stone-600 mt-1">Deleted objects will appear here</p>
          </div>
        ) : (
          <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Accession No.</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Deleted</th>
                  {canEdit && <th className="text-right text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {objects.map(a => (
                  <tr key={a.id} className="border-b border-stone-100 dark:border-stone-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{a.emoji || '🖼️'}</span>
                        <span className="text-sm text-stone-700 dark:text-stone-300">{a.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{a.accession_no || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-stone-400">
                      {a.deleted_at ? new Date(a.deleted_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleRestore(a.id)}
                            className="text-xs font-mono text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(a.id, a.title)}
                            className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                          >
                            Delete forever
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-stone-400 dark:text-stone-500 mt-4">
          Items in the trash can be restored or permanently deleted.
        </p>
      </div>
    </DashboardShell>
  )
}
