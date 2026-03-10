'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { useToast } from '@/components/Toast'
import { TableSkeleton } from '@/components/Skeleton'

type AccessLevel = 'Admin' | 'Editor' | 'Viewer'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  department: string
  access: AccessLevel
  created_at: string
  user_id: string | null
  invited_at: string | null
}

const DEPARTMENTS = ['Curatorial', 'Conservation', 'Education', 'Operations', 'Finance', 'Marketing']
const ACCESS_LEVELS: AccessLevel[] = ['Admin', 'Editor', 'Viewer']

const ACCESS_DESCRIPTIONS: Record<AccessLevel, string> = {
  Admin: 'Full access — can manage staff, site settings, and all objects',
  Editor: 'Can add and edit objects, cannot manage staff or billing',
  Viewer: 'Read-only access to the dashboard and collection',
}

const ACCESS_STYLES: Record<AccessLevel, string> = {
  Admin: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  Editor: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Viewer: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

export default function StaffPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [filterDept, setFilterDept] = useState('All')
  const [inviting, setInviting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    department: 'Curatorial',
    access: 'Editor' as AccessLevel,
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const result = await getMuseumForUser(supabase)
    if (!result) { router.push('/onboarding'); return }
    const { museum, isOwner, staffAccess } = result
    setMuseum(museum)
    setIsOwner(isOwner)
    setStaffAccess(staffAccess)

    const { data: staffData } = await supabase
      .from('staff_members')
      .select('*')
      .eq('museum_id', museum.id)
      .order('created_at', { ascending: true })

    setStaff(staffData || [])
    setLoading(false)
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', email: '', role: '', department: 'Curatorial', access: 'Editor' })
        setModalOpen(true)
  }

  function openEdit(member: StaffMember) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      access: member.access,
    })
        setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    if (!form.email.trim()) { toast('Email is required', 'error'); return }
    if (!form.role.trim()) { toast('Job title is required', 'error'); return }

    if (!editingId) {
      const planInfo = getPlan(museum?.plan)
      if (planInfo.staff !== null && staff.length >= planInfo.staff) {
        toast(`Your ${planInfo.label} plan allows up to ${planInfo.staff} staff member${planInfo.staff === 1 ? '' : 's'}. Upgrade your plan to add more.`, 'error')
        return
      }
    }

    setSaving(true)

    if (editingId) {
      const { error } = await supabase
        .from('staff_members')
        .update(form)
        .eq('id', editingId)
      if (error) { toast(error.message, 'error'); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('staff_members')
        .insert({ ...form, museum_id: museum.id })
      if (error) { toast(error.message, 'error'); setSaving(false); return }
    }

    setSaving(false)
    setModalOpen(false)
    load()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from your team? They will lose access immediately.`)) return
    const { error } = await supabase.from('staff_members').delete().eq('id', id)
    if (error) { alert(`Failed to remove staff member: ${error.message}`); return }
    load()
  }

  async function handleInvite(staffId: string, email: string) {
    setInviting(staffId)
    const res = await fetch('/api/invite-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, email }),
    })
    setInviting(null)
    if (res.ok) {
      load()
    } else {
      const { error } = await res.json()
      alert(error || 'Failed to send invite')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filtered = staff.filter(s => filterDept === 'All' || s.department === filterDept)
  const depts = ['All', ...DEPARTMENTS]

  const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const avatarColors: Record<string, string> = {
    Curatorial: '#1a4a8a', Conservation: '#1a6b5a', Education: '#8a6020',
    Operations: '#2d3a4a', Finance: '#4a2d6a', Marketing: '#6a2d2d',
  }

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  function InviteStatusBadge({ member }: { member: StaffMember }) {
    if (member.user_id) {
      return <span className="text-xs font-mono px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Active</span>
    }
    if (member.invited_at) {
      return (
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-mono px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 w-fit"
            title="Invitation links expire after 24 hours. Resend if the member hasn't accepted."
          >
            Pending
          </span>
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500 px-2">
            Sent {relativeTime(member.invited_at)}
          </span>
        </div>
      )
    }
    return <span className="text-xs font-mono px-2 py-1 rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">Not invited</span>
  }

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/staff" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8 space-y-6">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </DashboardShell>
    )
  }

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/staff" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Staff &amp; Roles</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Staff management is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Add team members, assign roles (Admin, Editor, Viewer), and manage access to your collection. Available on Professional, Institution, and Enterprise plans.</p>
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

  return (
    <DashboardShell museum={museum} activePath="/dashboard/staff" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0 z-10">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Staff & Roles</span>
        </div>

        <div className="p-4 md:p-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Staff', value: staff.length },
              { label: 'Admins', value: staff.filter(s => s.access === 'Admin').length },
              { label: 'Editors', value: staff.filter(s => s.access === 'Editor').length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          {(isOwner || staffAccess === 'Admin') && (
            <div className="flex justify-end mb-4">
              <button
                onClick={openAdd}
                className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm font-mono px-5 py-2.5 rounded border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                + Invite staff
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {depts.map(d => (
              <button
                key={d}
                onClick={() => setFilterDept(d)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                  filterDept === d
                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white'
                    : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Table */}
          {staff.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">👥</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No staff yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Invite your team to collaborate on the collection.</p>
              {(isOwner || staffAccess === 'Admin') && (
                <button
                  onClick={openAdd}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded"
                >
                  + Invite your first team member
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Name</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Department</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Job Title</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Email</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Access</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => (
                    <tr key={member.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-mono flex-shrink-0"
                            style={{ background: avatarColors[member.department] || '#2d3a4a' }}
                          >
                            {initials(member.name)}
                          </div>
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{member.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{member.department}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{member.role}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-400 dark:text-stone-500">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${ACCESS_STYLES[member.access]}`}>
                          {member.access}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <InviteStatusBadge member={member} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {(isOwner || staffAccess === 'Admin') && !member.user_id && (
                            <button
                              onClick={() => handleInvite(member.id, member.email)}
                              disabled={inviting === member.id}
                              className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 transition-colors disabled:opacity-50"
                            >
                              {inviting === member.id ? 'Sending…' : member.invited_at ? 'Resend invite' : 'Send invite'}
                            </button>
                          )}
                          {(isOwner || staffAccess === 'Admin') && !member.user_id && <span className="text-stone-200 dark:text-stone-700">·</span>}
                          {(isOwner || staffAccess === 'Admin') && (
                            <button
                              onClick={() => openEdit(member)}
                              className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {(isOwner || staffAccess === 'Admin') && <span className="text-stone-200 dark:text-stone-700">·</span>}
                          {(isOwner || staffAccess === 'Admin') && (
                            <button
                              onClick={() => handleDelete(member.id, member.name)}
                              className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Access level legend */}
          <div className="mt-6 border border-stone-200 dark:border-stone-700 rounded-lg p-5 bg-white dark:bg-stone-900">
            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">Access Levels</div>
            <div className="space-y-3">
              {ACCESS_LEVELS.map(level => (
                <div key={level} className="flex items-center gap-4">
                  <span className={`text-xs font-mono px-2 py-1 rounded-full w-16 text-center ${ACCESS_STYLES[level]}`}>
                    {level}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{ACCESS_DESCRIPTIONS[level]}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      {/* Modal */}
      {(isOwner || staffAccess === 'Admin') && modalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h2 className="font-serif text-xl italic text-stone-900 dark:text-stone-100">
                {editingId ? 'Edit staff member' : 'Invite staff member'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Job Title *</label>
                  <input
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    placeholder="Senior Curator"
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="jane@yourmuseum.org"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Department</label>
                  <select
                    value={form.department}
                    onChange={e => set('department', e.target.value)}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Access Level</label>
                  <select
                    value={form.access}
                    onChange={e => set('access', e.target.value as AccessLevel)}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  >
                    {ACCESS_LEVELS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Access description */}
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg px-3 py-2.5">
                <p className="text-xs text-stone-500 dark:text-stone-400">{ACCESS_DESCRIPTIONS[form.access]}</p>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-5 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-5 py-2 rounded disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes →' : 'Add to team →'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  )
}
