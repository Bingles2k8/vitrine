/**
 * What happens to a museum when its subscription ends.
 *
 * Policy (October 2026):
 *
 *  - When a subscription ends, for any reason, the museum drops to Community
 *    straight away. Nothing is locked and nothing is deleted on the day: the
 *    dashboard and public site stay up on Community's features.
 *  - Anything over Community's limits is kept for 180 days if the museum ever
 *    paid, or 30 days if it only ever trialled. The owner is told what and
 *    when before cancelling, in the email when the plan ends, on every
 *    dashboard page, and again 30 and 7 days before.
 *  - Then whatever is still over the limit is deleted, most recently added
 *    first. Resubscribing at any point before that cancels it.
 *
 * The `select*` functions decide what goes and are pure. Everything async here
 * only fetches rows for them or deletes what they chose. Code whose whole job
 * is deleting customer data should have its decisions testable without a
 * database, and these are, exhaustively, in __tests__/lib/downgrade.test.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getPlan, type PlanId } from '@/lib/plans'
import { fetchAll } from '@/lib/fetchAll'
import { r2, r2Locate, DeleteObjectsCommand } from '@/lib/r2'

/** The plan a museum lands on when its subscription ends. */
export const DOWNGRADE_PLAN: PlanId = 'community'

const DAY_MS = 24 * 60 * 60 * 1000
const MB = 1024 * 1024

export { retentionDays } from './config'

/**
 * The museums columns written when a subscription ends.
 *
 * Clears every lockout field as well as setting the plan: nothing locks a
 * museum any more, and a row locked under the old policy should come out of it
 * the next time Stripe tells us anything.
 */
export function downgradeUpdate(args: {
  now: Date
  /** Null when nothing is over the limit, so nothing needs deleting. */
  purgeAt: Date | null
  retentionDays: number
}): Record<string, unknown> {
  const plan = getPlan(DOWNGRADE_PLAN)
  return {
    plan: DOWNGRADE_PLAN,
    ui_mode: plan.fullMode ? 'full' : 'simple',
    stripe_subscription_id: null,
    pending_downgrade_plan: null,
    pending_downgrade_date: null,
    payment_past_due: false,
    locked_at: null,
    lock_reason: null,
    read_only_until: null,
    scheduled_deletion_at: null,
    deletion_warning_30d_sent_at: null,
    deletion_warning_7d_sent_at: null,
    over_limit_purge_at: args.purgeAt ? args.purgeAt.toISOString() : null,
    // A trial-only window is 30 days, so the email sent today already is the
    // 30-day warning. Marking it sent stops a second one going out tomorrow.
    purge_warning_30d_sent_at:
      args.purgeAt && args.retentionDays <= 31 ? args.now.toISOString() : null,
    purge_warning_7d_sent_at: null,
  }
}

/** Columns that cancel a scheduled purge. Spread into any (re)activation. */
export const CANCEL_PURGE_FIELDS = {
  over_limit_purge_at: null,
  purge_warning_30d_sent_at: null,
  purge_warning_7d_sent_at: null,
} as const

export function purgeDate(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS)
}

// ---------------------------------------------------------------------------
// Measuring: how much is over, for warnings. Cheap counts, no listing.
// ---------------------------------------------------------------------------

export type Overage = {
  /** Objects beyond the plan's object limit. */
  objects: number
  /** Photos beyond the per-object limit, on the objects that stay. */
  images: number
  /** Document files, and their bytes, that will be removed for storage. */
  files: number
  fileBytes: number
  /** Staff accounts beyond the plan's allowance. The owner never counts. */
  staff: number
  /** Live private share links beyond the plan's allowance. */
  shareLinks: number
}

export function hasOverage(o: Overage): boolean {
  return o.objects + o.images + o.files + o.staff + o.shareLinks > 0
}

/**
 * Plain-English lines describing an overage, for emails and the dashboard.
 * Empty when nothing is over.
 */
export function describeOverage(o: Overage, planId: PlanId = DOWNGRADE_PLAN): string[] {
  const p = getPlan(planId)
  const lines: string[] = []
  if (o.objects > 0) {
    lines.push(
      `${plural(o.objects, 'object')}, the most recently added (${p.label} allows ${p.objects?.toLocaleString('en-GB')})`
    )
  }
  if (o.images > 0) {
    lines.push(
      `${plural(o.images, 'extra photo')} (${p.label} keeps ${plural(p.imagesPerObject, 'photo')} per object)`
    )
  }
  if (o.files > 0) {
    const size = o.fileBytes > 0 ? `, ${formatBytes(o.fileBytes)}` : ''
    lines.push(
      p.documentStorageMb === 0
        ? `${plural(o.files, 'document')}${size} (${p.label} has no document storage)`
        : `${plural(o.files, 'document')}${size} over ${p.label}'s ${formatBytes((p.documentStorageMb ?? 0) * MB)} of storage`
    )
  }
  if (o.staff > 0) {
    lines.push(
      p.staff === 1
        ? `${plural(o.staff, 'staff account')} (${p.label} is for the owner only)`
        : `${plural(o.staff, 'staff account')} (${p.label} allows ${p.staff})`
    )
  }
  if (o.shareLinks > 0) {
    lines.push(
      p.shareLinks === 0
        ? `${plural(o.shareLinks, 'private share link')} (not included in ${p.label})`
        : `${plural(o.shareLinks, 'private share link')} (${p.label} allows ${p.shareLinks})`
    )
  }
  return lines
}

/**
 * A plan's limits in one line, for when the specific overage is not known.
 * Derived from lib/plans.ts so it cannot drift from what is enforced.
 */
export function communityLimitsSummary(planId: PlanId = DOWNGRADE_PLAN): string {
  const p = getPlan(planId)
  const parts: string[] = []
  if (p.objects !== null) parts.push(`${p.objects.toLocaleString('en-GB')} objects`)
  parts.push(`${plural(p.imagesPerObject, 'photo')} per object`)
  if (p.documentStorageMb === 0) parts.push('no document storage')
  else if (p.documentStorageMb !== null) parts.push(`${formatBytes(p.documentStorageMb * MB)} of document storage`)
  if (p.staff === 1) parts.push('no staff accounts besides the owner')
  else if (p.staff !== null) parts.push(`${p.staff} staff accounts`)
  if (p.shareLinks === 0) parts.push('no private share links')
  return `Anything over ${p.label}'s limits: ${parts.join(', ')}`
}

/**
 * How far a museum is over `planId`'s limits right now.
 *
 * Built from counts plus one small query for the photos, so it is cheap
 * enough to run inside the Stripe webhook. The figures are what the purge
 * would remove if it ran now, give or take objects it keeps because they carry
 * a disposal record.
 */
export async function measureOverage(
  service: SupabaseClient,
  museumId: string,
  planId: PlanId = DOWNGRADE_PLAN
): Promise<Overage> {
  const p = getPlan(planId)

  const [activeObjects, staffCount, liveLinks, files] = await Promise.all([
    countRows(service.from('objects').select('id', { count: 'exact', head: true })
      .eq('museum_id', museumId).is('deleted_at', null)),
    countRows(service.from('staff_members').select('id', { count: 'exact', head: true })
      .eq('museum_id', museumId)),
    countRows(service.from('object_share_links').select('id', { count: 'exact', head: true })
      .eq('museum_id', museumId).is('revoked_at', null)),
    p.documentStorageMb === null ? Promise.resolve([] as StoredFile[]) : listStoredFiles(service, museumId),
  ])

  const objects = p.objects === null ? 0 : Math.max(0, activeObjects - p.objects)

  let images = 0
  const keptIds = await listKeptObjectIds(service, museumId, p.objects)
  if (keptIds.length > 0) {
    const imgs = await listImages(service, keptIds)
    images = selectExtraImages(imgs, p.imagesPerObject, new Map()).remove.length
  }

  // Files on objects that are themselves going are counted under objects.
  const keptSet = new Set(keptIds)
  const fileCandidates = p.objects === null
    ? files
    : files.filter(f => !f.objectId || keptSet.has(f.objectId) || !f.objectActive)
  const fileRemovals = selectFilesToRemove(fileCandidates, mbToBytes(p.documentStorageMb))

  return {
    objects,
    images,
    files: fileRemovals.length,
    fileBytes: fileRemovals.reduce((n, f) => n + f.size, 0),
    staff: p.staff === null ? 0 : Math.max(0, staffCount - staffAllowance(p.staff)),
    shareLinks: p.shareLinks === null ? 0 : Math.max(0, liveLinks - p.shareLinks),
  }
}

/**
 * describeOverage(measureOverage(...)), or undefined if it could not be
 * measured. For warnings that must still go out when the measurement fails;
 * renderers state the limits instead of specifics on undefined.
 */
export async function tryDescribeOverage(
  service: SupabaseClient,
  museumId: string
): Promise<string[] | undefined> {
  try {
    return describeOverage(await measureOverage(service, museumId))
  } catch (err) {
    console.error(`[downgrade] could not measure overage for ${museumId}:`, err instanceof Error ? err.message : err)
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Pure selection. These decide what is deleted.
// ---------------------------------------------------------------------------

/** Non-owner staff seats a plan allows. Its staff figure includes the owner. */
export function staffAllowance(planStaff: number | null): number {
  return planStaff === null ? Infinity : Math.max(0, planStaff - 1)
}

type Dated = { id: string; created_at: string | null }

function byOldest(a: Dated, b: Dated): number {
  const ta = a.created_at ? Date.parse(a.created_at) : 0
  const tb = b.created_at ? Date.parse(b.created_at) : 0
  return ta - tb || a.id.localeCompare(b.id)
}

/**
 * Keep the `keep` oldest rows; return the rest, newest first. `null` keeps
 * everything. Used for staff and share links.
 */
export function selectNewestBeyond<T extends Dated>(rows: T[], keep: number | null): T[] {
  if (keep === null || keep === Infinity) return []
  const sorted = [...rows].sort(byOldest)
  return sorted.slice(Math.max(0, keep)).reverse()
}

/**
 * Split the over-limit objects into the ones to delete and the ones that must
 * stay. An object with a disposal record cannot be deleted (the foreign key
 * is RESTRICT, deliberately: it is the evidence a deaccession was done
 * properly), so it is kept even though it is over the limit.
 */
export function splitProtectedObjects(
  overLimit: string[],
  protectedIds: Set<string>
): { remove: string[]; kept: string[] } {
  const remove: string[] = []
  const kept: string[] = []
  for (const id of overLimit) (protectedIds.has(id) ? kept : remove).push(id)
  return { remove, kept }
}

export type ImageRow = {
  id: string
  object_id: string
  url: string | null
  is_primary: boolean | null
  sort_order: number | null
  created_at: string | null
  matte?: string | null
  aspect?: number | null
}

/**
 * Photos over the per-object limit, on the objects that stay.
 *
 * Per object the primary photo is kept first, then the one the object already
 * shows as its cover, then the earliest in the gallery order. Everything after
 * that goes. If the cover itself goes (no primary was ever set), the object is
 * repointed at the photo that stays, so its public page does not break.
 */
export function selectExtraImages(
  images: ImageRow[],
  perObject: number,
  coverUrlByObject: Map<string, string | null>
): {
  remove: ImageRow[]
  coverFixes: Array<{ objectId: string; image: ImageRow | null }>
} {
  const byObject = new Map<string, ImageRow[]>()
  for (const img of images) {
    const list = byObject.get(img.object_id) ?? []
    list.push(img)
    byObject.set(img.object_id, list)
  }

  const remove: ImageRow[] = []
  const coverFixes: Array<{ objectId: string; image: ImageRow | null }> = []

  for (const [objectId, list] of byObject) {
    const cover = coverUrlByObject.get(objectId) ?? null
    const ranked = [...list].sort((a, b) => {
      const primary = Number(!!b.is_primary) - Number(!!a.is_primary)
      if (primary) return primary
      const isCover = Number(!!cover && b.url === cover) - Number(!!cover && a.url === cover)
      if (isCover) return isCover
      const order = (a.sort_order ?? 0) - (b.sort_order ?? 0)
      return order || byOldest(a, b)
    })
    const kept = ranked.slice(0, Math.max(0, perObject))
    const gone = ranked.slice(Math.max(0, perObject))
    remove.push(...gone)

    if (cover && gone.some(g => g.url === cover) && !kept.some(k => k.url === cover)) {
      coverFixes.push({ objectId, image: kept[0] ?? null })
    }
  }

  return { remove, coverFixes }
}

export type StoredFile = {
  /** Table the row lives in, or 'conservation_treatments' for a treatment photo. */
  table: string
  /** Row id. For a treatment photo, the treatment's id. */
  id: string
  url: string | null
  size: number
  created_at: string | null
  /** The object a file hangs off, when it hangs off one. */
  objectId: string | null
  /** False when that object is in the bin. */
  objectActive?: boolean
}

/**
 * Files to remove to bring document storage within `limitBytes`, newest
 * first. A zero allowance means no document storage at all, so every file
 * goes, including any whose size was never recorded. `null` is unlimited.
 */
export function selectFilesToRemove(files: StoredFile[], limitBytes: number | null): StoredFile[] {
  if (limitBytes === null) return []
  const newestFirst = [...files].sort((a, b) => byOldest(b, a))
  if (limitBytes === 0) return newestFirst

  let total = files.reduce((n, f) => n + f.size, 0)
  const remove: StoredFile[] = []
  for (const f of newestFirst) {
    if (total <= limitBytes) break
    remove.push(f)
    total -= f.size
  }
  return remove
}

// ---------------------------------------------------------------------------
// Purging
// ---------------------------------------------------------------------------

export type PurgeReport = {
  museumId: string
  dryRun: boolean
  objects: number
  /** Over the limit but kept, because they carry a disposal record. */
  protectedObjects: number
  images: number
  files: number
  staff: number
  shareLinks: number
  r2Deleted: number
  errors: string[]
}

/**
 * Delete whatever is over `planId`'s limits, most recently added first.
 *
 * Plans from the current state of the museum rather than from anything stored
 * at downgrade time, so it is safe to re-run: a second run finds nothing left
 * to remove. It refuses to delete anything if a listing came back incomplete,
 * because a short list would make it keep the wrong rows.
 *
 * Database rows go first and their files second. A file left behind in R2 is
 * an orphan that costs a fraction of a penny; a row left pointing at a deleted
 * file is a broken page. So R2 failures are logged and do not stop the purge.
 */
export async function purgeOverLimit(
  service: SupabaseClient,
  museumId: string,
  opts: { planId?: PlanId; dryRun?: boolean } = {}
): Promise<PurgeReport> {
  const planId = opts.planId ?? DOWNGRADE_PLAN
  const dryRun = opts.dryRun ?? false
  const p = getPlan(planId)
  const report: PurgeReport = {
    museumId, dryRun, objects: 0, protectedObjects: 0, images: 0, files: 0,
    staff: 0, shareLinks: 0, r2Deleted: 0, errors: [],
  }
  const urlsToDelete: string[] = []

  // ---- Objects over the limit ------------------------------------------
  let removeObjectIds: string[] = []
  if (p.objects !== null) {
    const limit = p.objects
    const tail = await fetchAll<{ id: string }>(r =>
      service.from('objects').select('id')
        .eq('museum_id', museumId).is('deleted_at', null)
        .order('created_at', { ascending: true }).order('id', { ascending: true })
        .range(limit + r.from, limit + r.to),
      { maxRows: 200_000 }
    )
    if (tail.error || tail.truncated) {
      report.errors.push(`could not list objects: ${tail.error?.message ?? 'listing truncated'}`)
      return report
    }
    const overLimit = tail.data.map(o => o.id).reverse() // newest first

    const protectedIds = new Set<string>()
    for (const batch of chunks(overLimit, 200)) {
      const { data, error } = await service.from('disposal_records').select('object_id').in('object_id', batch)
      if (error) {
        report.errors.push(`could not check disposal records: ${error.message}`)
        return report
      }
      for (const d of data ?? []) if (d.object_id) protectedIds.add(d.object_id as string)
    }
    const split = splitProtectedObjects(overLimit, protectedIds)
    removeObjectIds = split.remove
    report.protectedObjects = split.kept.length
  }
  const removedObjects = new Set(removeObjectIds)

  // ---- Photos over the per-object limit on the objects that stay -------
  const keptIds = await listKeptObjectIds(service, museumId, p.objects)
  const covers = new Map<string, string | null>()
  for (const batch of chunks(keptIds, 200)) {
    const { data } = await service.from('objects').select('id, image_url').in('id', batch)
    for (const o of data ?? []) covers.set(o.id as string, (o.image_url as string | null) ?? null)
  }
  const images = keptIds.length > 0 ? await listImages(service, keptIds) : []
  const { remove: removeImages, coverFixes } = selectExtraImages(images, p.imagesPerObject, covers)

  // ---- Document storage ---------------------------------------------------
  const allFiles = p.documentStorageMb === null ? [] : await listStoredFiles(service, museumId)
  // A file on an object that is being deleted goes with the object.
  const removeFiles = selectFilesToRemove(
    allFiles.filter(f => !f.objectId || !removedObjects.has(f.objectId)),
    mbToBytes(p.documentStorageMb)
  )

  // ---- Staff and share links ---------------------------------------------
  const { data: staffRows } = await service.from('staff_members')
    .select('id, created_at').eq('museum_id', museumId)
  const removeStaff = selectNewestBeyond((staffRows ?? []) as Dated[], p.staff === null ? null : staffAllowance(p.staff))

  const { data: linkRows } = await service.from('object_share_links')
    .select('id, created_at, revoked_at').eq('museum_id', museumId)
  const removeLinks = p.shareLinks === null
    ? []
    : p.shareLinks === 0
      ? ((linkRows ?? []) as Dated[])
      : selectNewestBeyond(((linkRows ?? []) as Array<Dated & { revoked_at: string | null }>).filter(l => !l.revoked_at), p.shareLinks)

  if (dryRun) {
    report.objects = removeObjectIds.length
    report.images = removeImages.length
    report.files = removeFiles.length
    report.staff = removeStaff.length
    report.shareLinks = removeLinks.length
    return report
  }

  // ---- Delete: objects -------------------------------------------------
  for (const batch of chunks(removeObjectIds, 100)) {
    const urls = await objectFileUrls(service, batch)
    const { error } = await service.from('objects').delete().in('id', batch).eq('museum_id', museumId)
    if (!error) {
      report.objects += batch.length
      for (const id of batch) urlsToDelete.push(...(urls.get(id) ?? []))
      continue
    }
    // One bad row should not save the other ninety-nine. Retry singly.
    for (const id of batch) {
      const { error: oneError } = await service.from('objects').delete().eq('id', id).eq('museum_id', museumId)
      if (oneError) {
        report.errors.push(`object ${id}: ${oneError.message}`)
      } else {
        report.objects += 1
        urlsToDelete.push(...(urls.get(id) ?? []))
      }
    }
  }

  // ---- Delete: extra photos --------------------------------------------
  for (const batch of chunks(removeImages, 200)) {
    const { error } = await service.from('object_images').delete().in('id', batch.map(i => i.id))
    if (error) {
      report.errors.push(`photos: ${error.message}`)
      continue
    }
    report.images += batch.length
    for (const img of batch) if (img.url) urlsToDelete.push(img.url)
  }
  for (const fix of coverFixes) {
    await service.from('objects').update({
      image_url: fix.image?.url ?? null,
      image_matte: fix.image?.matte ?? null,
      image_aspect: fix.image?.aspect ?? null,
    }).eq('id', fix.objectId).eq('museum_id', museumId)
  }

  // ---- Delete: documents -----------------------------------------------
  const rowsByTable = new Map<string, StoredFile[]>()
  const treatmentPhotos = new Map<string, Set<string>>()
  for (const f of removeFiles) {
    if (f.table === 'conservation_treatments') {
      const set = treatmentPhotos.get(f.id) ?? new Set<string>()
      if (f.url) set.add(f.url)
      treatmentPhotos.set(f.id, set)
    } else {
      const list = rowsByTable.get(f.table) ?? []
      list.push(f)
      rowsByTable.set(f.table, list)
    }
  }
  for (const [table, rows] of rowsByTable) {
    for (const batch of chunks(rows, 200)) {
      const { error } = await service.from(table).delete().in('id', batch.map(r => r.id)).eq('museum_id', museumId)
      if (error) {
        report.errors.push(`${table}: ${error.message}`)
        continue
      }
      report.files += batch.length
      for (const r of batch) if (r.url) urlsToDelete.push(r.url)
    }
  }
  for (const [treatmentId, urls] of treatmentPhotos) {
    const { data: t } = await service.from('conservation_treatments')
      .select('images').eq('id', treatmentId).eq('museum_id', museumId).maybeSingle()
    const current = Array.isArray(t?.images) ? (t!.images as Array<{ url?: string }>) : []
    const { error } = await service.from('conservation_treatments')
      .update({ images: current.filter(img => !img?.url || !urls.has(img.url)) })
      .eq('id', treatmentId).eq('museum_id', museumId)
    if (error) {
      report.errors.push(`conservation photos ${treatmentId}: ${error.message}`)
      continue
    }
    report.files += urls.size
    urlsToDelete.push(...urls)
  }

  // ---- Delete: staff and share links -----------------------------------
  if (removeStaff.length > 0) {
    const { error } = await service.from('staff_members').delete()
      .in('id', removeStaff.map(s => s.id)).eq('museum_id', museumId)
    if (error) report.errors.push(`staff: ${error.message}`)
    else report.staff = removeStaff.length
  }
  if (removeLinks.length > 0) {
    const { error } = await service.from('object_share_links').delete()
      .in('id', removeLinks.map(l => l.id)).eq('museum_id', museumId)
    if (error) report.errors.push(`share links: ${error.message}`)
    else report.shareLinks = removeLinks.length
  }

  report.r2Deleted = await deleteFromR2(urlsToDelete)
  return report
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/** The objects that stay: the oldest `limit` active ones. Null means all. */
async function listKeptObjectIds(
  service: SupabaseClient,
  museumId: string,
  limit: number | null
): Promise<string[]> {
  if (limit === 0) return []
  const res = await fetchAll<{ id: string }>(r => {
    const to = limit === null ? r.to : Math.min(r.to, limit - 1)
    return service.from('objects').select('id')
      .eq('museum_id', museumId).is('deleted_at', null)
      .order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(r.from, to)
  }, { maxRows: limit ?? 200_000 })
  return res.data.map(o => o.id)
}

async function listImages(service: SupabaseClient, objectIds: string[]): Promise<ImageRow[]> {
  const out: ImageRow[] = []
  for (const batch of chunks(objectIds, 200)) {
    const res = await fetchAll<ImageRow>(r =>
      service.from('object_images')
        .select('id, object_id, url, is_primary, sort_order, created_at, matte, aspect')
        .in('object_id', batch)
        .range(r.from, r.to)
    )
    out.push(...res.data)
  }
  return out
}

/** Tables whose files count against document storage. See cached-storage-usage.sql. */
const DOCUMENT_TABLES = [
  'object_documents',
  'disposal_record_documents',
  'emergency_plan_documents',
  'insurance_policy_documents',
  'documentation_plan_documents',
] as const

/**
 * Every file that counts against a museum's document storage: the rows of
 * the five document tables, plus the photos inside conservation treatments,
 * which the storage trigger also counts.
 */
async function listStoredFiles(service: SupabaseClient, museumId: string): Promise<StoredFile[]> {
  const files: StoredFile[] = []

  for (const table of DOCUMENT_TABLES) {
    const withObject = table === 'object_documents'
    const res = withObject
      ? await fetchAll<Record<string, unknown>>(r =>
          service.from(table).select('id, file_url, file_size, created_at, object_id')
            .eq('museum_id', museumId).range(r.from, r.to))
      : await fetchAll<Record<string, unknown>>(r =>
          service.from(table).select('id, file_url, file_size, created_at')
            .eq('museum_id', museumId).range(r.from, r.to))
    for (const row of res.data) {
      files.push({
        table,
        id: row.id as string,
        url: (row.file_url as string | null) ?? null,
        size: Number(row.file_size ?? 0),
        created_at: (row.created_at as string | null) ?? null,
        objectId: withObject ? ((row.object_id as string | null) ?? null) : null,
      })
    }
  }

  const treatments = await fetchAll<{ id: string; object_id: string | null; created_at: string | null; images: unknown }>(r =>
    service.from('conservation_treatments')
      .select('id, object_id, created_at, images')
      .eq('museum_id', museumId)
      .range(r.from, r.to)
  )
  for (const t of treatments.data) {
    if (!Array.isArray(t.images)) continue
    for (const img of t.images as Array<{ url?: string; file_size?: number; date?: string }>) {
      if (!img?.url) continue
      files.push({
        table: 'conservation_treatments',
        id: t.id,
        url: img.url,
        size: Number(img.file_size ?? 0),
        created_at: img.date ?? t.created_at,
        objectId: t.object_id,
      })
    }
  }

  // Note which objects are in the bin, so the measure can tell a file on a
  // binned object (stays, counts against storage) from one on an object
  // being deleted.
  const objectIds = [...new Set(files.map(f => f.objectId).filter((id): id is string => !!id))]
  const binned = new Set<string>()
  for (const batch of chunks(objectIds, 200)) {
    const { data } = await service.from('objects').select('id, deleted_at').in('id', batch)
    for (const o of data ?? []) if (o.deleted_at) binned.add(o.id as string)
  }
  for (const f of files) f.objectActive = f.objectId ? !binned.has(f.objectId) : undefined

  return files
}

/** Every R2 file hanging off each object, keyed by object id. */
async function objectFileUrls(service: SupabaseClient, objectIds: string[]): Promise<Map<string, string[]>> {
  const urls = new Map<string, string[]>()
  const add = (id: string, url: unknown) => {
    if (typeof url !== 'string' || !url) return
    const list = urls.get(id) ?? []
    list.push(url)
    urls.set(id, list)
  }

  const [objects, images, docs, treatments] = await Promise.all([
    service.from('objects').select('id, image_url').in('id', objectIds),
    service.from('object_images').select('object_id, url').in('object_id', objectIds),
    service.from('object_documents').select('object_id, file_url').in('object_id', objectIds),
    service.from('conservation_treatments')
      .select('object_id, before_image_url, after_image_url, images').in('object_id', objectIds),
  ])
  for (const o of objects.data ?? []) add(o.id as string, o.image_url)
  for (const i of images.data ?? []) add(i.object_id as string, i.url)
  for (const d of docs.data ?? []) add(d.object_id as string, d.file_url)
  for (const t of treatments.data ?? []) {
    add(t.object_id as string, t.before_image_url)
    add(t.object_id as string, t.after_image_url)
    if (Array.isArray(t.images)) for (const img of t.images as Array<{ url?: string }>) add(t.object_id as string, img?.url)
  }
  return urls
}

async function deleteFromR2(urls: string[]): Promise<number> {
  const byBucket = new Map<string, Set<string>>()
  for (const url of urls) {
    const loc = r2Locate(url)
    if (!loc) continue
    const keys = byBucket.get(loc.bucket) ?? new Set<string>()
    keys.add(loc.key)
    byBucket.set(loc.bucket, keys)
  }

  let deleted = 0
  for (const [bucket, keys] of byBucket) {
    for (const batch of chunks([...keys], 1000)) {
      try {
        await r2.send(new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch.map(Key => ({ Key })), Quiet: true },
        }))
        deleted += batch.length
      } catch (err) {
        console.error(`[downgrade] R2 delete failed in ${bucket}:`, err instanceof Error ? err.message : err)
      }
    }
  }
  return deleted
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function mbToBytes(mb: number | null): number | null {
  return mb === null ? null : mb * MB
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString('en-GB')} ${word}${n === 1 ? '' : 's'}`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * MB) return `${(bytes / (1024 * MB)).toFixed(1)} GB`
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
