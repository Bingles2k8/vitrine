import { describe, it, expect, vi, beforeEach } from 'vitest'

// R2 is mocked so the purge can be run end to end without a bucket. r2Locate
// mirrors the real one against two fake public base URLs.
const { r2Send } = vi.hoisted(() => ({ r2Send: vi.fn().mockResolvedValue({}) }))
vi.mock('@/lib/r2', () => ({
  r2: { send: r2Send },
  DeleteObjectsCommand: class { constructor(public input: { Bucket: string; Delete: { Objects: Array<{ Key: string }> } }) {} },
  r2Locate: (url: string | null | undefined) => {
    if (!url) return null
    for (const [bucket, base] of [['object-images', 'https://img.test'], ['object-documents', 'https://docs.test']]) {
      if (url.startsWith(`${base}/`)) return { bucket, key: url.slice(base.length + 1) }
    }
    return null
  },
}))

import {
  communityLimitsSummary,
  describeOverage,
  downgradeUpdate,
  hasOverage,
  measureOverage,
  purgeOverLimit,
  retentionDays,
  selectExtraImages,
  selectFilesToRemove,
  selectNewestBeyond,
  splitProtectedObjects,
  staffAllowance,
  type ImageRow,
  type Overage,
  type StoredFile,
} from '@/lib/billing/downgrade'
import { PLANS } from '@/lib/plans'

const at = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 60_000).toISOString()

// ── Policy ───────────────────────────────────────────────────────────────────

describe('retentionDays', () => {
  it('keeps over-limit data 180 days for a customer who paid, 30 for a trial', () => {
    expect(retentionDays(true)).toBe(180)
    expect(retentionDays(false)).toBe(30)
  })
})

describe('downgradeUpdate', () => {
  const now = new Date('2026-10-05T12:00:00Z')

  it('moves the museum to Community and clears every lockout field', () => {
    const u = downgradeUpdate({ now, purgeAt: null, retentionDays: 180 })
    expect(u).toMatchObject({
      plan: 'community',
      ui_mode: 'simple',
      stripe_subscription_id: null,
      locked_at: null,
      lock_reason: null,
      read_only_until: null,
      scheduled_deletion_at: null,
      over_limit_purge_at: null,
      purge_warning_30d_sent_at: null,
    })
  })

  it('schedules the purge, leaving both reminders to send for a 180 day window', () => {
    const purgeAt = new Date('2027-04-03T12:00:00Z')
    const u = downgradeUpdate({ now, purgeAt, retentionDays: 180 })
    expect(u.over_limit_purge_at).toBe(purgeAt.toISOString())
    expect(u.purge_warning_30d_sent_at).toBeNull()
    expect(u.purge_warning_7d_sent_at).toBeNull()
  })

  it('counts today’s email as the 30 day reminder for a 30 day trial window', () => {
    const purgeAt = new Date('2026-11-04T12:00:00Z')
    const u = downgradeUpdate({ now, purgeAt, retentionDays: 30 })
    expect(u.purge_warning_30d_sent_at).toBe(now.toISOString())
    expect(u.purge_warning_7d_sent_at).toBeNull()
  })
})

// ── Selection: the rules that decide what is deleted ────────────────────────

describe('selectNewestBeyond', () => {
  const rows = [
    { id: 'c', created_at: at(3) },
    { id: 'a', created_at: at(1) },
    { id: 'b', created_at: at(2) },
  ]

  it('keeps the oldest and returns the rest newest first', () => {
    expect(selectNewestBeyond(rows, 1).map(r => r.id)).toEqual(['c', 'b'])
  })

  it('removes everything at zero and nothing when unlimited', () => {
    expect(selectNewestBeyond(rows, 0).map(r => r.id)).toEqual(['c', 'b', 'a'])
    expect(selectNewestBeyond(rows, null)).toEqual([])
    expect(selectNewestBeyond(rows, 5)).toEqual([])
  })

  it('breaks ties on the timestamp by id so the choice is stable', () => {
    const tied = [{ id: 'y', created_at: at(1) }, { id: 'x', created_at: at(1) }]
    expect(selectNewestBeyond(tied, 1).map(r => r.id)).toEqual(['y'])
  })
})

describe('staffAllowance', () => {
  it('excludes the owner from the plan’s staff figure', () => {
    expect(staffAllowance(1)).toBe(0)
    expect(staffAllowance(10)).toBe(9)
    expect(staffAllowance(null)).toBe(Infinity)
  })
})

describe('splitProtectedObjects', () => {
  it('keeps objects with a disposal record even when over the limit', () => {
    const r = splitProtectedObjects(['n3', 'n2', 'n1'], new Set(['n2']))
    expect(r.remove).toEqual(['n3', 'n1'])
    expect(r.kept).toEqual(['n2'])
  })
})

describe('selectExtraImages', () => {
  const img = (id: string, object_id: string, o: Partial<ImageRow> = {}): ImageRow => ({
    id, object_id, url: `https://img.test/${id}.jpg`, is_primary: false, sort_order: 0, created_at: at(0), ...o,
  })

  it('keeps the primary photo and removes the rest', () => {
    const r = selectExtraImages([
      img('a', 'o1', { sort_order: 0 }),
      img('b', 'o1', { sort_order: 1, is_primary: true }),
      img('c', 'o1', { sort_order: 2 }),
    ], 1, new Map())
    expect(r.remove.map(i => i.id).sort()).toEqual(['a', 'c'])
    expect(r.coverFixes).toEqual([])
  })

  it('without a primary, keeps the photo the object shows as its cover', () => {
    const r = selectExtraImages([
      img('a', 'o1', { sort_order: 0 }),
      img('b', 'o1', { sort_order: 1 }),
    ], 1, new Map([['o1', 'https://img.test/b.jpg']]))
    expect(r.remove.map(i => i.id)).toEqual(['a'])
    expect(r.coverFixes).toEqual([])
  })

  it('otherwise keeps the first in gallery order, then the earliest added', () => {
    const r = selectExtraImages([
      img('late', 'o1', { sort_order: 0, created_at: at(9) }),
      img('early', 'o1', { sort_order: 0, created_at: at(1) }),
      img('back', 'o1', { sort_order: 5, created_at: at(0) }),
    ], 1, new Map())
    expect(r.remove.map(i => i.id).sort()).toEqual(['back', 'late'])
  })

  it('repoints the cover when the cover photo itself is removed', () => {
    const r = selectExtraImages([
      img('keep', 'o1', { is_primary: true }),
      img('cover', 'o1', { sort_order: 1 }),
    ], 1, new Map([['o1', 'https://img.test/cover.jpg']]))
    expect(r.remove.map(i => i.id)).toEqual(['cover'])
    expect(r.coverFixes).toEqual([{ objectId: 'o1', image: expect.objectContaining({ id: 'keep' }) }])
  })

  it('leaves objects within the limit alone', () => {
    const r = selectExtraImages([img('a', 'o1'), img('b', 'o2')], 1, new Map())
    expect(r.remove).toEqual([])
  })
})

describe('selectFilesToRemove', () => {
  const file = (id: string, size: number, n: number): StoredFile => ({
    table: 'object_documents', id, url: `https://docs.test/${id}.pdf`, size, created_at: at(n), objectId: null,
  })
  const files = [file('old', 400, 1), file('mid', 300, 2), file('new', 200, 3)]

  it('removes nothing when storage is unlimited', () => {
    expect(selectFilesToRemove(files, null)).toEqual([])
  })

  it('removes every file, even one with no recorded size, when there is no storage', () => {
    const r = selectFilesToRemove([...files, file('unsized', 0, 4)], 0)
    expect(r.map(f => f.id)).toEqual(['unsized', 'new', 'mid', 'old'])
  })

  it('removes the newest until the total fits', () => {
    expect(selectFilesToRemove(files, 500).map(f => f.id)).toEqual(['new', 'mid'])
    expect(selectFilesToRemove(files, 900).map(f => f.id)).toEqual([])
  })
})

// ── Describing an overage ───────────────────────────────────────────────────

describe('describeOverage', () => {
  const none: Overage = { objects: 0, images: 0, files: 0, fileBytes: 0, staff: 0, shareLinks: 0 }

  it('says nothing when nothing is over', () => {
    expect(describeOverage(none)).toEqual([])
    expect(hasOverage(none)).toBe(false)
  })

  it('names each kind of data over Community’s limits, with the limit', () => {
    const lines = describeOverage({ objects: 12, images: 1, files: 3, fileBytes: 5 * 1024 * 1024, staff: 2, shareLinks: 1 })
    expect(lines).toEqual([
      `12 objects, the most recently added (Community allows ${PLANS.community.objects})`,
      '1 extra photo (Community keeps 1 photo per object)',
      '3 documents, 5.0 MB (Community has no document storage)',
      '2 staff accounts (Community is for the owner only)',
      '1 private share link (not included in Community)',
    ])
  })

  it('summarises the limits when the specific overage is unknown', () => {
    expect(communityLimitsSummary()).toBe(
      'Anything over Community\'s limits: 100 objects, 1 photo per object, no document storage, no staff accounts besides the owner, no private share links'
    )
  })
})

// ── End to end against an in-memory database ────────────────────────────────

type Row = Record<string, unknown>

/**
 * Just enough of the supabase-js query builder for the purge: filters, order,
 * range, count, delete and update, applied to in-memory tables.
 */
function fakeDb(tables: Record<string, Row[]>, opts: { failSelectOn?: string } = {}) {
  function from(table: string) {
    tables[table] ??= []
    const filters: Array<(r: Row) => boolean> = []
    const orders: Array<[string, boolean]> = []
    let range: [number, number] | null = null
    let op: 'select' | 'delete' | 'update' = 'select'
    let patch: Row = {}
    let head = false

    function rows() {
      let out = tables[table].filter(r => filters.every(f => f(r)))
      if (orders.length) {
        out = [...out].sort((a, b) => {
          for (const [col, asc] of orders) {
            const x = String(a[col] ?? ''), y = String(b[col] ?? '')
            if (x !== y) return (x < y ? -1 : 1) * (asc ? 1 : -1)
          }
          return 0
        })
      }
      return range ? out.slice(range[0], range[1] + 1) : out
    }

    function exec() {
      if (op === 'select' && opts.failSelectOn === table) {
        return Promise.resolve({ data: null, error: { message: 'boom' }, count: null })
      }
      const matched = rows()
      if (op === 'delete') {
        tables[table] = tables[table].filter(r => !matched.includes(r))
        // ON DELETE CASCADE from objects, as in the real schema.
        if (table === 'objects') {
          const gone = new Set(matched.map(r => r.id))
          for (const child of ['object_images', 'object_documents', 'conservation_treatments']) {
            if (tables[child]) tables[child] = tables[child].filter(r => !gone.has(r.object_id))
          }
        }
        return Promise.resolve({ data: null, error: null })
      }
      if (op === 'update') {
        for (const r of matched) Object.assign(r, patch)
        return Promise.resolve({ data: null, error: null })
      }
      return Promise.resolve({ data: head ? null : matched, error: null, count: matched.length })
    }

    const b: Record<string, unknown> = {
      select: (_c?: string, o?: { head?: boolean }) => { if (o?.head) head = true; return b },
      eq: (c: string, v: unknown) => { filters.push(r => r[c] === v); return b },
      is: (c: string, v: unknown) => { filters.push(r => (r[c] ?? null) === v); return b },
      not: (c: string, _op: string, v: unknown) => { filters.push(r => (r[c] ?? null) !== v); return b },
      in: (c: string, vs: unknown[]) => { filters.push(r => vs.includes(r[c])); return b },
      order: (c: string, o?: { ascending?: boolean }) => { orders.push([c, o?.ascending !== false]); return b },
      range: (f: number, t: number) => { range = [f, t]; return b },
      limit: () => b,
      delete: () => { op = 'delete'; return b },
      update: (p: Row) => { op = 'update'; patch = p; return b },
      maybeSingle: () => exec().then(r => ({ ...r, data: (r.data as Row[] | null)?.[0] ?? null })),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => exec().then(res, rej),
    }
    return b
  }
  return { from } as unknown as Parameters<typeof purgeOverLimit>[0]
}

/** A Community museum that kept its Professional-sized collection. */
function overLimitMuseum() {
  const objects: Row[] = Array.from({ length: 103 }, (_, i) => ({
    id: `obj-${String(i).padStart(3, '0')}`,
    museum_id: 'm1',
    created_at: at(i),
    deleted_at: null,
    image_url: i === 0 ? 'https://img.test/o0-b.jpg' : null,
  }))
  objects.push({ id: 'binned', museum_id: 'm1', created_at: at(500), deleted_at: at(501), image_url: null })

  return {
    objects,
    // obj-101 is over the limit but has been formally deaccessioned.
    disposal_records: [{ id: 'd1', museum_id: 'm1', object_id: 'obj-101' }],
    object_images: [
      { id: 'o0-a', object_id: 'obj-000', museum_id: 'm1', url: 'https://img.test/o0-a.jpg', is_primary: false, sort_order: 0, created_at: at(1) },
      { id: 'o0-b', object_id: 'obj-000', museum_id: 'm1', url: 'https://img.test/o0-b.jpg', is_primary: false, sort_order: 1, created_at: at(2) },
      { id: 'o0-c', object_id: 'obj-000', museum_id: 'm1', url: 'https://img.test/o0-c.jpg', is_primary: false, sort_order: 2, created_at: at(3) },
      { id: 'o102-a', object_id: 'obj-102', museum_id: 'm1', url: 'https://img.test/o102-a.jpg', is_primary: true, sort_order: 0, created_at: at(4) },
    ],
    object_documents: [
      { id: 'doc-kept', object_id: 'obj-000', museum_id: 'm1', file_url: 'https://docs.test/kept.pdf', file_size: 1000, created_at: at(5) },
      { id: 'doc-on-removed', object_id: 'obj-102', museum_id: 'm1', file_url: 'https://docs.test/removed.pdf', file_size: 2000, created_at: at(6) },
    ],
    insurance_policy_documents: [
      { id: 'ins-1', museum_id: 'm1', file_url: 'https://docs.test/ins.pdf', file_size: 3000, created_at: at(7) },
    ],
    disposal_record_documents: [],
    emergency_plan_documents: [],
    documentation_plan_documents: [],
    conservation_treatments: [],
    staff_members: [
      { id: 's1', museum_id: 'm1', created_at: at(1) },
      { id: 's2', museum_id: 'm1', created_at: at(2) },
    ],
    object_share_links: [
      { id: 'l1', museum_id: 'm1', created_at: at(1), revoked_at: null },
    ],
    // Another museum's rows must never be touched.
    other: [],
  } as Record<string, Row[]>
}

describe('measureOverage', () => {
  it('counts what is over Community’s limits, without double counting files on removed objects', async () => {
    const tables = overLimitMuseum()
    const o = await measureOverage(fakeDb(tables), 'm1')
    expect(o).toEqual({
      objects: 3,
      images: 2,
      // doc-kept and the insurance document. The document on obj-102 goes
      // with the object, so it is not counted twice.
      files: 2,
      fileBytes: 4000,
      staff: 2,
      shareLinks: 1,
    })
  })
})

describe('purgeOverLimit', () => {
  beforeEach(() => r2Send.mockClear())

  it('in a dry run reports what would go and deletes nothing', async () => {
    const tables = overLimitMuseum()
    const before = JSON.stringify(tables)
    const r = await purgeOverLimit(fakeDb(tables), 'm1', { dryRun: true })
    expect(r).toMatchObject({ objects: 2, protectedObjects: 1, images: 2, files: 2, staff: 2, shareLinks: 1, errors: [] })
    expect(JSON.stringify(tables)).toBe(before)
    expect(r2Send).not.toHaveBeenCalled()
  })

  it('removes the newest objects over the limit and keeps the oldest 100', async () => {
    const tables = overLimitMuseum()
    const r = await purgeOverLimit(fakeDb(tables), 'm1')
    expect(r.errors).toEqual([])
    const ids = tables.objects.map(o => o.id)
    expect(ids).not.toContain('obj-102')
    expect(ids).not.toContain('obj-100')
    // Kept: the deaccessioned object, the oldest hundred, and the bin.
    expect(ids).toContain('obj-101')
    expect(ids).toContain('obj-000')
    expect(ids).toContain('obj-099')
    expect(ids).toContain('binned')
    expect(tables.objects.filter(o => !o.deleted_at)).toHaveLength(101)
  })

  it('keeps one photo per remaining object, the one shown as its cover', async () => {
    const tables = overLimitMuseum()
    await purgeOverLimit(fakeDb(tables), 'm1')
    const left = tables.object_images.filter(i => i.object_id === 'obj-000').map(i => i.id)
    expect(left).toEqual(['o0-b'])
  })

  it('removes every document, Community having no document storage', async () => {
    const tables = overLimitMuseum()
    await purgeOverLimit(fakeDb(tables), 'm1')
    expect(tables.object_documents).toEqual([])
    expect(tables.insurance_policy_documents).toEqual([])
  })

  it('removes staff accounts and share links', async () => {
    const tables = overLimitMuseum()
    await purgeOverLimit(fakeDb(tables), 'm1')
    expect(tables.staff_members).toEqual([])
    expect(tables.object_share_links).toEqual([])
  })

  it('deletes the files of everything it removed from R2', async () => {
    const tables = overLimitMuseum()
    await purgeOverLimit(fakeDb(tables), 'm1')
    const keys = r2Send.mock.calls.flatMap(([cmd]) =>
      (cmd as { input: { Bucket: string; Delete: { Objects: Array<{ Key: string }> } } }).input.Delete.Objects.map(o => o.Key)
    )
    expect(keys.sort()).toEqual([
      'ins.pdf', 'kept.pdf', 'o0-a.jpg', 'o0-c.jpg', 'o102-a.jpg', 'removed.pdf',
    ])
  })

  it('is safe to run twice: the second run finds nothing left to remove', async () => {
    const tables = overLimitMuseum()
    await purgeOverLimit(fakeDb(tables), 'm1')
    const second = await purgeOverLimit(fakeDb(tables), 'm1', { dryRun: true })
    expect(second).toMatchObject({ objects: 0, images: 0, files: 0, staff: 0, shareLinks: 0 })
  })

  it('deletes nothing at all if the object list cannot be read', async () => {
    const tables = overLimitMuseum()
    const before = JSON.stringify(tables)
    const r = await purgeOverLimit(fakeDb(tables, { failSelectOn: 'objects' }), 'm1')
    expect(r.errors[0]).toMatch(/could not list objects/)
    expect(JSON.stringify(tables)).toBe(before)
    expect(r2Send).not.toHaveBeenCalled()
  })

  it('deletes nothing if disposal records cannot be checked', async () => {
    const tables = overLimitMuseum()
    const before = JSON.stringify(tables)
    const r = await purgeOverLimit(fakeDb(tables, { failSelectOn: 'disposal_records' }), 'm1')
    expect(r.errors[0]).toMatch(/disposal records/)
    expect(JSON.stringify(tables)).toBe(before)
  })

  it('leaves a museum within the limits untouched', async () => {
    const tables: Record<string, Row[]> = {
      objects: [{ id: 'a', museum_id: 'm1', created_at: at(1), deleted_at: null, image_url: null }],
      object_images: [], object_documents: [], disposal_records: [], staff_members: [], object_share_links: [],
      insurance_policy_documents: [], disposal_record_documents: [], emergency_plan_documents: [],
      documentation_plan_documents: [], conservation_treatments: [],
    }
    const r = await purgeOverLimit(fakeDb(tables), 'm1')
    expect(r).toMatchObject({ objects: 0, images: 0, files: 0, staff: 0, shareLinks: 0, errors: [] })
    expect(tables.objects).toHaveLength(1)
  })
})
