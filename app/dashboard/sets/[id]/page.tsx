'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getMuseumForUser } from '@/lib/get-museum'
import DashboardShell from '@/components/DashboardShell'
import DashboardTopBar, { TopBarButton } from '@/components/DashboardTopBar'
import { TableSkeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import NavStylePicker from '@/components/groups/NavStylePicker'
import RuleBuilder from '@/components/groups/RuleBuilder'
import ObjectPickerModal from '@/components/groups/ObjectPickerModal'
import { collectionLabels } from '@/lib/publicProfile'
import {
  EMPTY_RULE, GROUP_SORTS, RULE_FIELDS, groupNouns, parseRule, resolveMembers,
} from '@/lib/collectionGroups'
import type {
  CollectionGroupItemRow, CollectionGroupRow, GroupRule, GroupSort, SetNavStyle,
} from '@/lib/collectionGroups/types'

const SORT_LABELS: Record<GroupSort, string> = {
  manual: 'The order I choose',
  alpha: 'A – Z by title',
  date_added: 'Recently added first',
  date_made: 'Oldest first',
  grade: 'Highest grade first',
}

const inputCls =
  'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
      <h2 className="font-serif italic text-lg text-stone-900 dark:text-stone-100 mb-4">{title}</h2>
      {children}
    </section>
  )
}

export default function SetEditor() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [form, setForm] = useState<CollectionGroupRow | null>(null)
  const [rule, setRule] = useState<GroupRule>(EMPTY_RULE)
  const [items, setItems] = useState<CollectionGroupItemRow[]>([])
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getMuseumForUser(supabase)
      if (!result?.museum) { router.push('/login'); return }
      setMuseum(result.museum)
      setIsOwner(result.isOwner)
      setStaffAccess(result.staffAccess)

      const [{ data: group }, { data: itemRows }, { data: objectRows }] = await Promise.all([
        supabase.from('collection_groups').select('*').eq('id', id).maybeSingle(),
        supabase.from('collection_group_items').select('*').eq('group_id', id)
          .order('sort_order', { ascending: true, nullsFirst: false }),
        supabase.from('objects')
          .select('id, title, artist, year, medium, culture, status, emoji, image_url, condition_grade, rarity, description, production_date, category, object_type, origin_country, collection_profile, cert_authority, cert_grade_numeric, created_at, show_on_site')
          .eq('museum_id', result.museum.id).is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ])

      if (!group) { router.push('/dashboard/sets'); return }
      setForm(group as CollectionGroupRow)
      setRule(parseRule((group as CollectionGroupRow).rule))
      setItems((itemRows ?? []) as CollectionGroupItemRow[])
      setObjects(objectRows ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const nouns = museum ? groupNouns(museum) : { singular: 'Set', plural: 'Sets' }
  const labels = useMemo(() => museum ? collectionLabels(museum) : null, [museum])

  function set<K extends keyof CollectionGroupRow>(key: K, value: CollectionGroupRow[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
    setDirty(true)
  }

  // The preview resolves through the same evaluator the public site uses, so
  // what is shown here is what will publish — never a second implementation.
  const visibleObjects = useMemo(() => objects.filter(o => o.show_on_site), [objects])

  const members = useMemo(() => {
    if (!form) return []
    return resolveMembers(
      { id: form.id, membership: form.membership, rule: { ...rule }, sort_by: form.sort_by },
      visibleObjects,
      items,
    )
  }, [form, rule, visibleObjects, items])

  const hiddenMemberCount = useMemo(() => {
    if (!form || form.membership !== 'manual') return 0
    const included = new Set(items.filter(i => i.role === 'include').map(i => i.object_id))
    return objects.filter(o => included.has(o.id) && !o.show_on_site).length
  }, [form, items, objects])

  const suggestions = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const field of RULE_FIELDS) {
      if (!field.suggest) continue
      const values = new Set<string>()
      for (const o of objects) {
        const v = o[field.key]
        if (typeof v === 'string' && v.trim()) values.add(v.trim())
      }
      out[field.key] = Array.from(values).sort().slice(0, 100)
    }
    return out
  }, [objects])

  const datedCount = useMemo(
    () => members.filter(m => m.year || m.production_date).length,
    [members],
  )

  const includedIds = useMemo(
    () => new Set(items.filter(i => i.role === 'include').map(i => i.object_id)),
    [items],
  )

  async function reloadItems() {
    const { data } = await supabase
      .from('collection_group_items').select('*').eq('group_id', id)
      .order('sort_order', { ascending: true, nullsFirst: false })
    setItems((data ?? []) as CollectionGroupItemRow[])
  }

  async function patchItems(body: Record<string, unknown>) {
    const res = await fetch(`/api/collection-groups/${id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast('Could not save that change', 'error'); return }
    await reloadItems()
  }

  async function handleSave() {
    if (!form || !canEdit || saving) return
    setSaving(true)
    const res = await fetch(`/api/collection-groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        status: form.status,
        membership: form.membership,
        rule,
        sort_by: form.sort_by,
        nav_style: form.nav_style,
        show_as_section: form.show_as_section,
        show_as_chip: form.show_as_chip,
        date_start: form.date_start,
        date_end: form.date_end,
        cover_object_id: form.cover_object_id,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast('Could not save', 'error'); return }
    setDirty(false)
    toast('Saved')
  }

  /** Save whatever is on screen and take it live in one go. */
  async function handlePublish() {
    if (!form || !canEdit || saving) return
    setForm({ ...form, status: 'published' })
    setSaving(true)
    const res = await fetch(`/api/collection-groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        status: 'published',
        membership: form.membership,
        rule,
        sort_by: form.sort_by,
        nav_style: form.nav_style,
        show_as_section: form.show_as_section,
        show_as_chip: form.show_as_chip,
        date_start: form.date_start,
        date_end: form.date_end,
        cover_object_id: form.cover_object_id,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      setForm(f => f ? { ...f, status: 'draft' } : f)
      toast('Could not publish', 'error')
      return
    }
    setDirty(false)
    toast(members.length === 0
      ? `Published — but it has no ${labels?.itemPlural.toLowerCase() ?? 'items'} in it yet, so it stays hidden until it does`
      : `${nouns.singular} is live on your site`)
  }

  async function handleDelete() {
    if (!canEdit || !form) return
    if (!confirm(`Delete “${form.title}”?\n\nThe ${labels?.itemPlural.toLowerCase() ?? 'items'} in it are not affected.`)) return
    const res = await fetch(`/api/collection-groups/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Could not delete', 'error'); return }
    toast(`${nouns.singular} deleted`)
    router.push('/dashboard/sets')
  }

  async function moveItem(objectId: string, direction: -1 | 1) {
    const order = members.map(m => m.id)
    const index = order.indexOf(objectId)
    const target = index + direction
    if (index === -1 || target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    await patchItems({ order })
  }

  if (loading || !form || !labels) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/sets" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8"><TableSkeleton rows={5} cols={3} /></div>
      </DashboardShell>
    )
  }

  const isRule = form.membership === 'rule'

  return (
    <DashboardShell
      museum={museum}
      activePath="/dashboard/sets"
      onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
      isOwner={isOwner}
      staffAccess={staffAccess}
    >
      <DashboardTopBar
        title={form.title || `Untitled ${nouns.singular.toLowerCase()}`}
        actions={canEdit && (
          <div className="flex items-center gap-2">
            {/* A draft is invisible on the public site — no page, no nav item,
                no homepage band. That is deliberate, but it needs saying here
                rather than only as a checkbox further down the page. */}
            {form.status === 'draft' && (
              <span className="hidden sm:inline text-xs font-mono text-stone-400 dark:text-stone-500">
                Not on your site yet
              </span>
            )}
            {form.status === 'published' && museum?.slug && (
              <TopBarButton as="a" href={`/museum/${museum.slug}/sets/${form.slug}`} variant="ghost">
                View ↗
              </TopBarButton>
            )}
            {form.status === 'draft' ? (
              <TopBarButton variant="primary" onClick={handlePublish} disabled={saving}>
                {saving ? 'Publishing…' : 'Publish'}
              </TopBarButton>
            ) : (
              <TopBarButton variant="primary" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
              </TopBarButton>
            )}
          </div>
        )}
      />

      <div className="p-4 md:p-8 max-w-4xl space-y-5">
        <Card title="Details">
          <div className="space-y-4">
            <Field label="Title">
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                disabled={!canEdit}
                className={inputCls}
              />
            </Field>

            <Field label="Subtitle" hint="One line under the title. Optional.">
              <input
                type="text"
                value={form.subtitle ?? ''}
                onChange={e => set('subtitle', e.target.value)}
                disabled={!canEdit}
                className={inputCls}
              />
            </Field>

            <Field label="Introduction" hint="Shown on the set's own page, above the items.">
              <textarea
                rows={4}
                value={form.description ?? ''}
                onChange={e => set('description', e.target.value)}
                disabled={!canEdit}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Opens" hint="Optional — leave both blank for a timeless set.">
                <input
                  type="date"
                  value={form.date_start ?? ''}
                  onChange={e => set('date_start', e.target.value || null)}
                  disabled={!canEdit}
                  className={inputCls}
                />
              </Field>
              <Field label="Closes">
                <input
                  type="date"
                  value={form.date_end ?? ''}
                  onChange={e => set('date_end', e.target.value || null)}
                  disabled={!canEdit}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title={`What goes in this ${nouns.singular.toLowerCase()}`}>
          <div className="flex gap-2 mb-5">
            {(['manual', 'rule'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => set('membership', mode)}
                disabled={!canEdit}
                className={`flex-1 text-left p-3 rounded-lg border transition-colors ${
                  form.membership === mode
                    ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-400'
                }`}
              >
                <div className="text-sm text-stone-900 dark:text-stone-100">
                  {mode === 'manual' ? 'I pick the items' : 'Match a filter'}
                </div>
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-1 leading-snug">
                  {mode === 'manual'
                    ? 'Choose them yourself, in your own order.'
                    : 'Stays up to date as you add to your collection.'}
                </div>
              </button>
            ))}
          </div>

          {isRule ? (
            <RuleBuilder
              rule={rule}
              onChange={r => { setRule(r); setDirty(true) }}
              suggestions={suggestions}
              labels={labels}
              matchCount={members.length}
              totalCount={visibleObjects.length}
              disabled={!canEdit}
            />
          ) : (
            <div>
              {canEdit && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-xs font-mono px-3 py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors mb-4"
                >
                  + Add {labels.itemPlural.toLowerCase()}
                </button>
              )}
              {members.length === 0 && (
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  Nothing in here yet.
                </p>
              )}
            </div>
          )}

          {hiddenMemberCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-4 leading-relaxed">
              {hiddenMemberCount} {hiddenMemberCount === 1 ? 'item is' : 'items are'} in this {nouns.singular.toLowerCase()} but hidden
              from your public site, so {hiddenMemberCount === 1 ? 'it' : 'they'} will not appear on it.
            </p>
          )}
        </Card>

        {members.length > 0 && (
          <Card title={`${members.length} ${members.length === 1 ? labels.item.toLowerCase() : labels.itemPlural.toLowerCase()}`}>
            <div className="border border-stone-100 dark:border-stone-800 rounded overflow-hidden">
              {members.map((member, i) => {
                const item = items.find(it => it.object_id === member.id && it.role === 'include')
                const pinned = isRule && !!item
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2.5 border-b border-stone-50 dark:border-stone-800 last:border-b-0"
                  >
                    {canEdit && form.sort_by === 'manual' && !isRule && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => moveItem(member.id, -1)} disabled={i === 0}
                          aria-label="Move up"
                          className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 text-[10px] leading-none">▲</button>
                        <button onClick={() => moveItem(member.id, 1)} disabled={i === members.length - 1}
                          aria-label="Move down"
                          className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 text-[10px] leading-none">▼</button>
                      </div>
                    )}

                    <div className="w-9 h-9 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                      {member.image_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={member.image_url} alt="" className="w-full h-full object-cover" />
                        : (member.emoji || '🖼️')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-stone-900 dark:text-stone-100 truncate flex items-center gap-2">
                        {member.title}
                        {pinned && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400 shrink-0">
                            Pinned
                          </span>
                        )}
                      </div>
                      {canEdit && (
                        <input
                          type="text"
                          defaultValue={item?.note ?? ''}
                          onBlur={e => {
                            const value = e.target.value.trim()
                            if (value === (item?.note ?? '')) return
                            patchItems({ notes: { [member.id]: value || null } })
                          }}
                          placeholder="Note on this item in this set…"
                          className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-stone-300 dark:focus:border-stone-600 outline-none py-0.5 text-stone-500 dark:text-stone-400 placeholder:text-stone-300 dark:placeholder:text-stone-600 transition-colors"
                        />
                      )}
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => isRule
                          ? patchItems(item ? { remove: [member.id] } : { exclude: [member.id] })
                          : patchItems({ remove: [member.id] })}
                        className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors shrink-0 px-1"
                        title={isRule && !item ? 'Exclude from this set' : 'Remove'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {members.length > 0 && (
          <Card title="Cover">
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-4 leading-relaxed">
              Left automatic, the cover is a mosaic of the first four {labels.itemPlural.toLowerCase()} in this {nouns.singular.toLowerCase()} —
              so it always looks deliberate without you uploading anything. Pick one instead if you would rather.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => set('cover_object_id', null)}
                disabled={!canEdit}
                className={`w-16 h-16 rounded border-2 flex items-center justify-center text-[10px] font-mono leading-tight text-center px-1 transition-colors ${
                  !form.cover_object_id
                    ? 'border-stone-900 dark:border-white text-stone-900 dark:text-stone-100'
                    : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:border-stone-400'
                }`}
              >
                Auto
              </button>
              {members.slice(0, 24).map(member => (
                <button
                  key={member.id}
                  onClick={() => set('cover_object_id', member.id)}
                  disabled={!canEdit}
                  title={member.title}
                  className={`w-16 h-16 rounded border-2 overflow-hidden flex items-center justify-center text-xl transition-colors ${
                    form.cover_object_id === member.id
                      ? 'border-stone-900 dark:border-white'
                      : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {member.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={member.image_url as string} alt="" className="w-full h-full object-cover" />
                    : (member.emoji as string || '🖼️')}
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card title="How people move through it">
          <NavStylePicker
            value={form.nav_style}
            onChange={v => set('nav_style', v as SetNavStyle)}
            itemCount={members.length}
            datedCount={datedCount}
            disabled={!canEdit}
          />

          <div className="mt-5">
            <Field label="Order">
              <select
                value={form.sort_by}
                onChange={e => set('sort_by', e.target.value as GroupSort)}
                disabled={!canEdit}
                className={inputCls}
              >
                {GROUP_SORTS.filter(s => !(isRule && s === 'manual')).map(s => (
                  <option key={s} value={s}>{SORT_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Where it appears">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === 'published'}
                onChange={e => set('status', e.target.checked ? 'published' : 'draft')}
                disabled={!canEdit}
                className="mt-0.5 rounded border-stone-300 dark:border-stone-600"
              />
              <span>
                <span className="text-sm text-stone-900 dark:text-stone-100">Published</span>
                <span className="block text-xs text-stone-400 dark:text-stone-500 leading-snug">
                  Listed on your public site with a page of its own. Unpublished {nouns.plural.toLowerCase()} are only visible here.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_as_section}
                onChange={e => set('show_as_section', e.target.checked)}
                disabled={!canEdit}
                className="mt-0.5 rounded border-stone-300 dark:border-stone-600"
              />
              <span>
                <span className="text-sm text-stone-900 dark:text-stone-100">Feature on the homepage</span>
                <span className="block text-xs text-stone-400 dark:text-stone-500 leading-snug">
                  Shows a row of items with a link through. The first six featured {nouns.plural.toLowerCase()} appear; the rest live on the {nouns.plural.toLowerCase()} page.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_as_chip}
                onChange={e => set('show_as_chip', e.target.checked)}
                disabled={!canEdit}
                className="mt-0.5 rounded border-stone-300 dark:border-stone-600"
              />
              <span>
                <span className="text-sm text-stone-900 dark:text-stone-100">Add a filter button to the collection</span>
                <span className="block text-xs text-stone-400 dark:text-stone-500 leading-snug">
                  Visitors can filter your main collection down to this {nouns.singular.toLowerCase()} without leaving the page.
                </span>
              </span>
            </label>
          </div>
        </Card>

        {canEdit && (
          <div className="pt-2">
            <button
              onClick={handleDelete}
              className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors"
            >
              Delete this {nouns.singular.toLowerCase()}
            </button>
          </div>
        )}
      </div>

      <ObjectPickerModal
        open={pickerOpen}
        objects={objects}
        alreadyIn={includedIds}
        itemPlural={labels.itemPlural}
        onClose={() => setPickerOpen(false)}
        onAdd={ids => patchItems({ add: ids })}
      />
    </DashboardShell>
  )
}
