'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { useToast } from '@/components/Toast'
import { TableSkeleton } from '@/components/Skeleton'
import PersonalLoanModal from '@/components/PersonalLoanModal'
import DashboardTopBar, { TopBarButton } from '@/components/DashboardTopBar'

type LoanRow = {
  id: string
  object_id: string
  borrower_name: string
  borrower_contact: string | null
  lent_on: string
  due_back: string | null
  returned_on: string | null
  note: string | null
  reminder_sent_at: string | null
  created_at: string
  objects: { title: string; emoji: string | null; accession_no: string | null; image_url: string | null } | null
}

interface MuseumRow {
  id: string
  [key: string]: unknown
}

export default function OnLoanPage() {
  const [museum, setMuseum] = useState<MuseumRow | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loans, setLoans] = useState<LoanRow[]>([])
  const [objects, setObjects] = useState<{ id: string; title: string; emoji: string | null; accession_no: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showReturned, setShowReturned] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<LoanRow | null>(null)
  const [working, setWorking] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const result = await getMuseumForUser(supabase)
      if (!result?.museum) { router.push('/login'); return }
      const { museum, isOwner, staffAccess } = result
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      await Promise.all([loadLoans(), loadObjects(museum.id)])
      setLoading(false)
    }
    load()
  }, [])

  async function loadLoans() {
    const res = await fetch('/api/personal-loans')
    if (!res.ok) return
    const { loans } = await res.json()
    setLoans(loans || [])
  }

  async function loadObjects(museumId: string) {
    const { data } = await supabase
      .from('objects')
      .select('id, title, emoji, accession_no')
      .eq('museum_id', museumId)
      .is('deleted_at', null)
      .order('title')
    setObjects(data || [])
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  async function markReturned(loan: LoanRow) {
    if (!canEdit || working) return
    setWorking(loan.id)
    const res = await fetch(`/api/personal-loans/${loan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returned_on: new Date().toISOString().slice(0, 10) }),
    })
    if (!res.ok) { toast('Failed to mark returned', 'error'); setWorking(null); return }
    toast('Marked as returned')
    await loadLoans()
    setWorking(null)
  }

  async function handleDelete(id: string) {
    if (!canEdit) return
    if (!confirm('Delete this loan record?')) return
    const res = await fetch(`/api/personal-loans/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Failed to delete', 'error'); return }
    setLoans(prev => prev.filter(l => l.id !== id))
    toast('Loan deleted')
  }

  function openAdd() { setEditingLoan(null); setModalOpen(true) }
  function openEdit(loan: LoanRow) { setEditingLoan(loan); setModalOpen(true) }

  async function handleSaved() {
    setModalOpen(false)
    setEditingLoan(null)
    await loadLoans()
  }

  const today = new Date().toISOString().slice(0, 10)

  const filtered = loans
    .filter(l => showReturned ? true : !l.returned_on)
    .filter(l => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        l.borrower_name.toLowerCase().includes(q) ||
        (l.objects?.title.toLowerCase().includes(q) ?? false) ||
        (l.note?.toLowerCase().includes(q) ?? false)
      )
    })

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/on-loan" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8"><TableSkeleton rows={5} cols={4} /></div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      museum={museum}
      activePath="/dashboard/on-loan"
      onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
      isOwner={isOwner}
      staffAccess={staffAccess}
    >
      <DashboardTopBar
        title="Lent out"
        actions={canEdit && (
          <TopBarButton variant="primary" onClick={openAdd}>
            + Lend something
          </TopBarButton>
        )}
        subRow={
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search by who has it, or what it is…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 w-64"
            />
            <button
              onClick={() => setShowReturned(!showReturned)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                showReturned
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                  : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              {showReturned ? '✓ Showing ones that came back' : 'Also show ones that came back'}
            </button>
          </div>
        }
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* The reason anyone opens this page is to find out whether something
            is late, so it leads rather than sitting as a pill you have to spot
            partway down the list. */}
        {(() => {
          const late = loans.filter(l => !l.returned_on && l.due_back && l.due_back < today)
          if (late.length === 0) return null
          const names = late.map(l => l.objects?.title || 'Something').slice(0, 2).join(' and ')
          return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400 flex-shrink-0">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" />
              </svg>
              <span className="text-sm text-red-800 dark:text-red-300">
                {late.length === 1
                  ? `${names} is past the date it was due back.`
                  : `${late.length} things are past the date they were due back.`}
              </span>
            </div>
          )
        })()}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-12 text-center">
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
              {loans.length === 0
                ? 'Nothing lent out. Record anything you\'ve lent to friends or family so you remember who has it.'
                : 'No loans match your filters.'}
            </p>
            {loans.length === 0 && canEdit && objects.length > 0 && (
              <button
                onClick={openAdd}
                className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors border border-stone-200 dark:border-stone-700 px-4 py-2 rounded"
              >
                Record something you’ve lent →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            {filtered.map((loan, idx) => {
              const overdue = !loan.returned_on && loan.due_back && loan.due_back < today
              return (
                <div
                  key={loan.id}
                  className={`flex items-start gap-4 px-6 py-4 ${idx < filtered.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''} ${loan.returned_on ? 'opacity-60' : ''}`}
                >
                  {loan.objects?.image_url ? (
                    <img src={loan.objects.image_url} alt="" className="w-12 h-12 object-cover rounded border border-stone-200 dark:border-stone-700 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-lg shrink-0">
                      {loan.objects?.emoji || '◯'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        onClick={() => router.push(`/dashboard/objects/${loan.object_id}`)}
                        className="text-sm font-medium text-stone-900 dark:text-stone-100 hover:underline"
                      >
                        {loan.objects?.title || 'Untitled'}
                      </button>
                      {loan.returned_on ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                          Came back {loan.returned_on}
                        </span>
                      ) : overdue ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          Out
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      With <strong className="text-stone-700 dark:text-stone-300">{loan.borrower_name}</strong>
                      {loan.borrower_contact ? ` · ${loan.borrower_contact}` : ''}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                      <span>lent {loan.lent_on}</span>
                      {loan.due_back && <span>due {loan.due_back}</span>}
                    </div>
                    {loan.note && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed italic">{loan.note}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-3 shrink-0 mt-0.5">
                      {!loan.returned_on && (
                        <button
                          onClick={() => markReturned(loan)}
                          disabled={!!working}
                          className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
                        >
                          {working === loan.id ? 'Marking…' : 'It’s back'}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(loan)}
                        className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {loans.length > 0 && (
        <p className="px-6 md:px-10 pb-8 -mt-2 text-xs font-mono text-stone-400 dark:text-stone-500 leading-relaxed max-w-2xl">
          Anything lent out still counts as yours and still shows on your public page — it is just marked as being elsewhere.
        </p>
      )}

      {modalOpen && (
        <PersonalLoanModal
          museumId={museum!.id}
          loan={editingLoan}
          objects={objects}
          onClose={() => { setModalOpen(false); setEditingLoan(null) }}
          onSaved={handleSaved}
        />
      )}
    </DashboardShell>
  )
}
