'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import { TableSkeleton } from '@/components/Skeleton'
import ShareLinkModal from '@/components/ShareLinkModal'
import DashboardTopBar, { TopBarButton } from '@/components/DashboardTopBar'

type LinkRow = {
  id: string
  label: string | null
  scope_filter: { ids?: string[]; status?: string[] } | null
  expires_at: string | null
  max_views: number | null
  view_count: number
  last_viewed_at: string | null
  created_at: string
  revoked_at: string | null
}

export default function SharePage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [showRevoked, setShowRevoked] = useState(false)
  const [working, setWorking] = useState<string | null>(null)
  const [justCreated, setJustCreated] = useState<{ id: string; passcodeHint: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const result = await getMuseumForUser(supabase)
      if (!result?.museum) { router.push('/login'); return }
      const { museum, isOwner, staffAccess } = result

      if (getPlan(museum.plan).shareLinks === 0) { router.push('/dashboard'); return }

      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      await loadLinks()
      setLoading(false)
    }
    load()
  }, [])

  async function loadLinks() {
    const res = await fetch('/api/share-links')
    if (!res.ok) return
    const { links } = await res.json()
    setLinks(links || [])
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  async function handleRevoke(id: string) {
    if (!canEdit || working) return
    if (!confirm('Revoke this share link? It will stop working immediately.')) return
    setWorking(id)
    const res = await fetch(`/api/share-links/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Failed to revoke', 'error'); setWorking(null); return }
    toast('Link revoked')
    await loadLinks()
    setWorking(null)
  }

  async function handleCreated(link: { id: string }) {
    setModalOpen(false)
    setJustCreated({ id: link.id, passcodeHint: 'Keep your passcode safe — it cannot be recovered.' })
    await loadLinks()
  }

  function shareUrl(id: string) {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/share/${id}`
  }

  async function copy(text: string, msg = 'Copied') {
    try {
      await navigator.clipboard.writeText(text)
      toast(msg)
    } catch {
      toast('Could not copy', 'error')
    }
  }

  const today = new Date()

  function statusOf(link: LinkRow): { label: string; tone: string } {
    if (link.revoked_at) return { label: 'revoked', tone: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' }
    if (link.expires_at && new Date(link.expires_at) < today) return { label: 'expired', tone: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' }
    if (link.max_views !== null && link.view_count >= link.max_views) return { label: 'used up', tone: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' }
    return { label: 'active', tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' }
  }

  function summariseScope(link: LinkRow) {
    const f = link.scope_filter ?? {}
    const parts: string[] = []
    if (f.ids && f.ids.length > 0) parts.push(`${f.ids.length} picked object${f.ids.length === 1 ? '' : 's'}`)
    if (f.status && f.status.length > 0) parts.push(f.status.join(', '))
    return parts.length === 0 ? 'Entire collection' : parts.join(' · ')
  }

  const filtered = links.filter(l => showRevoked || (!l.revoked_at && statusOf(l).label === 'active'))

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/share" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8"><TableSkeleton rows={3} cols={3} /></div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      museum={museum}
      activePath="/dashboard/share"
      onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
      isOwner={isOwner}
      staffAccess={staffAccess}
    >
      <DashboardTopBar
        title="Private share links"
        actions={canEdit && (
          <TopBarButton variant="primary" onClick={() => setModalOpen(true)}>
            + New share link
          </TopBarButton>
        )}
      />

      <div className="p-4 md:p-8 space-y-6">
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
          Share a passcode-protected view of part of your collection with an insurance broker, family member, or collaborator. Recipients don't need an account.
        </p>

        {justCreated && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Link created</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{justCreated.passcodeHint}</p>
              </div>
              <button
                onClick={() => setJustCreated(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-900 rounded px-2 py-1 text-stone-900 dark:text-stone-100 break-all">
                {shareUrl(justCreated.id)}
              </code>
              <button
                onClick={() => copy(shareUrl(justCreated.id), 'Link copied')}
                className="text-xs font-mono text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setShowRevoked(!showRevoked)}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              showRevoked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            {showRevoked ? '✓ Showing revoked & expired' : 'Show revoked & expired'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-12 text-center">
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
              {links.length === 0 ? 'No share links yet.' : 'No active share links.'}
            </p>
            {canEdit && (
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors border border-stone-200 dark:border-stone-700 px-4 py-2 rounded"
              >
                Create your first share link →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            {filtered.map((link, idx) => {
              const status = statusOf(link)
              const url = shareUrl(link.id)
              return (
                <div
                  key={link.id}
                  className={`px-6 py-4 ${idx < filtered.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''} ${link.revoked_at ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {link.label || 'Untitled link'}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${status.tone}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">
                        {summariseScope(link)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-stone-400 dark:text-stone-500">
                        <span>created {new Date(link.created_at).toISOString().slice(0, 10)}</span>
                        {link.expires_at && <span>expires {new Date(link.expires_at).toISOString().slice(0, 10)}</span>}
                        <span>{link.view_count} view{link.view_count === 1 ? '' : 's'}{link.max_views ? ` / ${link.max_views}` : ''}</span>
                        {link.last_viewed_at && <span>last viewed {new Date(link.last_viewed_at).toISOString().slice(0, 10)}</span>}
                      </div>
                    </div>
                    {!link.revoked_at && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => copy(url, 'Link copied')}
                          className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                        >
                          Copy link
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleRevoke(link.id)}
                            disabled={!!working}
                            className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {working === link.id ? 'Revoking…' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <ShareLinkModal
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </DashboardShell>
  )
}
