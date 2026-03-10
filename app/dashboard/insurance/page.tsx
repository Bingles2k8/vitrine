'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

const COVERAGE_TYPES = ['All Risks', 'Named Perils', 'Government Indemnity', 'Transit', 'Exhibition']
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY']

const STATUS_STYLES: Record<string, string> = {
  Active:             'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Expired:            'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  'Pending Renewal':  'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Cancelled:          'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

const EMPTY_FORM = {
  policy_number: '', provider: '', coverage_type: 'All Risks',
  coverage_amount: '', currency: 'GBP', deductible: '',
  start_date: '', end_date: '', renewal_date: '',
  covers_loans: false, covers_transit: false, covers_exhibition: false,
  exclusions: '', claims_procedure: '',
  contact_name: '', contact_email: '', contact_phone: '',
  notes: '',
}

export default function InsurancePage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Expired' | 'Pending Renewal' | 'Cancelled'>('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: policies } = await supabase
        .from('insurance_policies')
        .select('*')
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setPolicies(policies || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function addPolicy() {
    if (!form.policy_number || !form.provider || !form.start_date) return
    setSaving(true)
    await supabase.from('insurance_policies').insert({
      ...form,
      coverage_amount: form.coverage_amount ? Number(form.coverage_amount) : null,
      deductible: form.deductible ? Number(form.deductible) : null,
      end_date: form.end_date || null,
      renewal_date: form.renewal_date || null,
      museum_id: museum.id,
    })
    const { data } = await supabase
      .from('insurance_policies')
      .select('*')
      .eq('museum_id', museum.id)
      .order('created_at', { ascending: false })
    setPolicies(data || [])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('insurance_policies').update({ status }).eq('id', id)
    setPolicies(p => p.map(x => x.id === id ? { ...x, status } : x))
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/insurance" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/insurance" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Insurance</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Insurance is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Manage insurance policies and coverage for your collection. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const today = new Date().toISOString().slice(0, 10)

  const activePolicies = policies.filter(p => p.status === 'Active')
  const totalCoverage = activePolicies.reduce((sum, p) => sum + (p.coverage_amount || 0), 0)
  const soonExpiring = policies.filter(p => {
    if (p.status !== 'Active' || !p.renewal_date) return false
    const daysUntil = (new Date(p.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntil <= 30 && daysUntil >= 0
  })
  const expiredPolicies = policies.filter(p => p.status === 'Expired')

  const filtered = policies.filter(p => filter === 'All' || p.status === filter)

  function formatCurrency(amount: number, currency: string) {
    const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', CHF: 'CHF ', AUD: 'A$', CAD: 'C$', JPY: '¥' }
    return `${symbols[currency] || ''}${amount.toLocaleString()}`
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/insurance" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Insurance & Indemnity</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Policies', value: String(activePolicies.length), warn: activePolicies.length === 0 },
              { label: 'Total Coverage', value: activePolicies.length > 0 ? formatCurrency(totalCoverage, activePolicies[0]?.currency || 'GBP') : '—', warn: false },
              { label: 'Expiring Soon', value: String(soonExpiring.length), warn: soonExpiring.length > 0 },
              { label: 'Expired', value: String(expiredPolicies.length), warn: expiredPolicies.length > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-3xl ${s.warn ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button onClick={() => setShowForm(s => !s)}
                className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm font-mono px-5 py-2.5 rounded border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                {showForm ? 'Cancel' : '+ Add policy'}
              </button>
            </div>
          )}

          {/* Add form */}
          {showForm && canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-sm font-mono text-stone-500 dark:text-stone-400 mb-2">New insurance policy</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Policy Number *</label>
                  <input value={form.policy_number} onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))}
                    placeholder="e.g. POL-2026-001"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Provider *</label>
                  <input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                    placeholder="Insurance company"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Coverage Type</label>
                  <select value={form.coverage_type} onChange={e => setForm(f => ({ ...f, coverage_type: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {COVERAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Coverage Amount</label>
                  <input type="number" value={form.coverage_amount} onChange={e => setForm(f => ({ ...f, coverage_amount: e.target.value }))}
                    placeholder="e.g. 1000000"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Deductible</label>
                  <input type="number" value={form.deductible} onChange={e => setForm(f => ({ ...f, deductible: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Renewal Date</label>
                  <input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <input type="checkbox" checked={form.covers_loans} onChange={e => setForm(f => ({ ...f, covers_loans: e.target.checked }))}
                    className="rounded border-stone-300" />
                  Covers Loans
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <input type="checkbox" checked={form.covers_transit} onChange={e => setForm(f => ({ ...f, covers_transit: e.target.checked }))}
                    className="rounded border-stone-300" />
                  Covers Transit
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <input type="checkbox" checked={form.covers_exhibition} onChange={e => setForm(f => ({ ...f, covers_exhibition: e.target.checked }))}
                    className="rounded border-stone-300" />
                  Covers Exhibition
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Contact Name</label>
                  <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    placeholder="Broker / agent name"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Contact Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    placeholder="email@provider.com"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Contact Phone</label>
                  <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="+44 ..."
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Exclusions</label>
                <textarea value={form.exclusions} onChange={e => setForm(f => ({ ...f, exclusions: e.target.value }))}
                  rows={2} placeholder="Coverage exclusions…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Claims Procedure</label>
                <textarea value={form.claims_procedure} onChange={e => setForm(f => ({ ...f, claims_procedure: e.target.value }))}
                  rows={2} placeholder="How to file a claim…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Additional notes…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={addPolicy} disabled={saving || !form.policy_number || !form.provider || !form.start_date}
                  className="px-4 py-2 text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 transition-colors">
                  {saving ? 'Saving…' : 'Add policy'}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Active', 'Expired', 'Pending Renewal', 'Cancelled'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Policies' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🛡</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No insurance policies</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Use the Add policy button to register your first insurance policy.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Policy</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Provider</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Coverage</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const expiringSoon = p.status === 'Active' && p.renewal_date && (() => {
                      const d = (new Date(p.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      return d <= 30 && d >= 0
                    })()
                    return (
                      <tr key={p.id} className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${expiringSoon ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{p.policy_number}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{p.coverage_type}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">{p.provider}</td>
                        <td className="px-4 py-3 text-sm font-mono text-stone-900 dark:text-stone-100">
                          {p.coverage_amount ? formatCurrency(p.coverage_amount, p.currency) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                            {new Date(p.start_date).toLocaleDateString('en-GB')}
                            {p.end_date && ` — ${new Date(p.end_date).toLocaleDateString('en-GB')}`}
                          </div>
                          {p.renewal_date && (
                            <div className={`text-xs font-mono mt-0.5 ${expiringSoon ? 'text-amber-600 font-medium' : 'text-stone-400 dark:text-stone-500'}`}>
                              Renewal: {new Date(p.renewal_date).toLocaleDateString('en-GB')}
                              {expiringSoon && ' ⚠'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[p.status] || STATUS_STYLES.Active}`}>
                            {p.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status === 'Active' && (
                                <button onClick={() => updateStatus(p.id, 'Pending Renewal')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Renew
                                </button>
                              )}
                              {p.status === 'Pending Renewal' && (
                                <button onClick={() => updateStatus(p.id, 'Active')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Renewed
                                </button>
                              )}
                              {p.status !== 'Expired' && p.status !== 'Cancelled' && (
                                <button onClick={() => updateStatus(p.id, 'Expired')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Expire
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
