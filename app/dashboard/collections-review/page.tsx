'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'

export default function CollectionsReviewPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    review_title: '', scope: '', reviewer: '', criteria: '',
    review_date_start: '', review_date_end: '',
    objects_reviewed: '', objects_recommended_disposal: '',
    recommendations: '', notes: '',
    governing_body_reported: false, report_date: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data } = await supabase.from('collection_reviews').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setReviews(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  async function addReview() {
    if (!form.review_title || !form.review_date_start || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const count = reviews.filter(r => r.review_reference?.startsWith(`CR-${year}-`)).length
    const ref = `CR-${year}-${String(count + 1).padStart(3, '0')}`
    const { error: err } = await supabase.from('collection_reviews').insert({
      review_reference: ref, museum_id: museum.id,
      review_title: form.review_title, scope: form.scope || null,
      reviewer: form.reviewer || null, criteria: form.criteria || null,
      review_date_start: form.review_date_start,
      review_date_end: form.review_date_end || null,
      objects_reviewed: form.objects_reviewed ? parseInt(form.objects_reviewed) : 0,
      objects_recommended_disposal: form.objects_recommended_disposal ? parseInt(form.objects_recommended_disposal) : 0,
      recommendations: form.recommendations || null, notes: form.notes || null,
      governing_body_reported: form.governing_body_reported,
      report_date: form.governing_body_reported && form.report_date ? form.report_date : null,
    })
    if (err) { setError(err.message); setSubmitting(false); return }
    setForm({ review_title: '', scope: '', reviewer: '', criteria: '', review_date_start: '', review_date_end: '', objects_reviewed: '', objects_recommended_disposal: '', recommendations: '', notes: '', governing_body_reported: false, report_date: '' })
    const { data } = await supabase.from('collection_reviews').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false })
    setReviews(data || [])
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error: err } = await supabase.from('collection_reviews').update({ status }).eq('id', id)
    if (err) { setError(err.message); return }
    setReviews(r => r.map(rec => rec.id === id ? { ...rec, status } : rec))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading...</p>
    </div>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/collections-review" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Collections Review</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">&square;</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Collections Review is an Institution feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Conduct formal reviews of your collection to ensure alignment with your museum&apos;s mission and policies.</p>
              <button onClick={() => router.push('/dashboard/plan')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">View plans &rarr;</button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const inProgress = reviews.filter(r => r.status === 'In Progress')
  const completed = reviews.filter(r => r.status === 'Completed')
  const totalReviewed = reviews.reduce((sum, r) => sum + (r.objects_reviewed || 0), 0)

  return (
    <DashboardShell museum={museum} activePath="/dashboard/collections-review" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Collections Review</span>
        </div>
        <div className="p-4 md:p-8 space-y-6">
          {error && <div className="text-xs font-mono text-red-500">{error}</div>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Reviews', value: reviews.length },
              { label: 'In Progress', value: inProgress.length },
              { label: 'Completed', value: completed.length },
              { label: 'Objects Reviewed', value: totalReviewed },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Collections reviews ensure your collection aligns with your museum&apos;s mission and policies. Record scope, criteria, and outcomes.</p>
          </div>

          {canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">New Review</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Review Title *</label>
                  <input value={form.review_title} onChange={e => setForm(f => ({ ...f, review_title: e.target.value }))} placeholder="e.g. Annual Collections Review 2026" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Reviewer</label>
                  <input value={form.reviewer} onChange={e => setForm(f => ({ ...f, reviewer: e.target.value }))} placeholder="Name" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Scope</label>
                <textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} rows={2} placeholder="What is being reviewed and why..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Criteria</label>
                <textarea value={form.criteria} onChange={e => setForm(f => ({ ...f, criteria: e.target.value }))} rows={2} placeholder="Criteria used to assess objects..." className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" value={form.review_date_start} onChange={e => setForm(f => ({ ...f, review_date_start: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={form.review_date_end} onChange={e => setForm(f => ({ ...f, review_date_end: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Objects Reviewed</label>
                  <input type="number" min="0" value={form.objects_reviewed} onChange={e => setForm(f => ({ ...f, objects_reviewed: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Recommended for Disposal</label>
                  <input type="number" min="0" value={form.objects_recommended_disposal} onChange={e => setForm(f => ({ ...f, objects_recommended_disposal: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Recommendations</label>
                <textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} placeholder="Recommendations arising from the review..." className={`${inputCls} resize-none`} />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input type="checkbox" checked={form.governing_body_reported} onChange={e => setForm(f => ({ ...f, governing_body_reported: e.target.checked }))} />
                  Reported to governing body
                </label>
                {form.governing_body_reported && (
                  <div className="ml-6">
                    <label className={labelCls}>Report Date</label>
                    <input type="date" value={form.report_date} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))} className={inputCls} />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <button type="button" onClick={addReview} disabled={!form.review_title || !form.review_date_start || submitting}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving...' : 'Start review \u2192'}
              </button>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">&square;</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No reviews yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Start a collections review to assess your holdings.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Reference</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Title</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Reviewer</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Objects</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{r.review_reference}</td>
                      <td className="px-4 py-3 text-sm text-stone-900 dark:text-stone-100">{r.review_title}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.reviewer || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {r.review_date_start ? new Date(r.review_date_start).toLocaleDateString('en-GB') : '—'}
                        {r.review_date_end ? ` — ${new Date(r.review_date_end).toLocaleDateString('en-GB')}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-stone-900 dark:text-stone-100">{r.objects_reviewed || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                          r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>{r.status}</span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          {r.status === 'In Progress' && (
                            <button type="button" onClick={() => updateStatus(r.id, 'Completed')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Complete</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
