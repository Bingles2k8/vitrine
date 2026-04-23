import type { SupabaseClient } from '@supabase/supabase-js'
import { r2, DeleteObjectsCommand, ListObjectsV2Command } from './r2'

const R2_BUCKETS = ['object-images', 'object-documents', 'museum-assets'] as const

// Tables to delete in dependency order (children before parents). Every table
// with a museum_id FK already cascades, but we delete explicitly so the
// helper works even if a row is referenced from another museum's data
// through some junction we've missed, and so the operation is observable
// in logs.
// NOTE: `event_time_slots` and `tickets` don't have museum_id — they cascade
// through events.museum_id and ticket_orders.museum_id respectively. Don't add
// them here; the `.eq('museum_id', …)` filter would error on a missing column.
const TABLES_IN_DEPENDENCY_ORDER = [
  'page_views',
  'activity_log',
  'ticket_orders',
  'events',
  'emergency_event_objects',
  'emergency_events',
  'emergency_salvage_priorities',
  'emergency_plan_documents',
  'insurance_policy_documents',
  'insurance_policy_objects',
  'insurance_policies',
  'documentation_plan_documents',
  'documentation_plan_backlogs',
  'documentation_plans',
  'rights_records',
  'reproduction_requests',
  'disposal_record_documents',
  'disposal_records',
  'collection_reviews',
  'collection_use_records',
  'audit_exercises',
  'object_share_links',
  'personal_loans',
  'object_duplicates',
  'wanted_items',
  'object_documents',
  'object_images',
  'object_components',
  'valuations',
  'risk_register',
  'damage_reports',
  'location_history',
  'condition_assessments',
  'conservation_treatments',
  'audit_records',
  'object_exits',
  'entry_records',
  'loans',
  'emergency_plans',
  'staff_members',
  'staff',
  'locations',
  'objects',
] as const

async function emptyBucketPrefix(bucket: string, prefix: string) {
  let ContinuationToken: string | undefined
  do {
    const list = await r2.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken,
    }))
    const keys = (list.Contents ?? []).map(o => o.Key).filter((k): k is string => !!k)
    if (keys.length > 0) {
      // DeleteObjects accepts up to 1000 keys per call; ListObjectsV2 returns
      // up to 1000 per page by default, so one delete per page is fine.
      await r2.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true },
      }))
    }
    ContinuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (ContinuationToken)
}

type DeletionReason = 'trial_expired' | 'subscription_ended' | 'user_requested'

/**
 * Permanently deletes everything for a museum: R2 files, all DB rows via
 * cascade + explicit deletes, the owner's auth user, and logs the event.
 * Idempotent-ish: safe to retry if it fails mid-way (R2 list/delete is
 * idempotent; DB deletes use eq(museum_id) which is a no-op after rows gone).
 *
 * Requires a service-role client.
 */
export async function deleteMuseumEverywhere(
  service: SupabaseClient,
  museumId: string,
  reason: DeletionReason,
): Promise<void> {
  // Snapshot for audit log before deletion
  const { data: museum } = await service
    .from('museums')
    .select('id, name, slug, owner_id')
    .eq('id', museumId)
    .maybeSingle()

  let ownerEmail: string | null = null
  if (museum?.owner_id) {
    const { data: owner } = await service.auth.admin.getUserById(museum.owner_id)
    ownerEmail = owner?.user?.email ?? null
  }

  // R2: delete all files under ${museumId}/ across buckets. Do this first — if
  // a subsequent step fails and we retry, the orphaned rows still let us find
  // the museum by id. If we did DB first and R2 failed, we'd orphan files.
  for (const bucket of R2_BUCKETS) {
    await emptyBucketPrefix(bucket, `${museumId}/`)
  }

  // DB: explicit deletes in dependency order.
  for (const table of TABLES_IN_DEPENDENCY_ORDER) {
    const { error } = await service.from(table).delete().eq('museum_id', museumId)
    if (error) {
      // Log and continue — some tables may not exist in all environments,
      // and the final museums.delete() will cascade anyway.
      console.error(`[deleteMuseumEverywhere] ${table}: ${error.message}`)
    }
  }

  // Finally the museum row itself — cascades anything we missed above.
  await service.from('museums').delete().eq('id', museumId)

  // Write audit log after the row is gone so it survives.
  await service.from('deletion_log').insert({
    museum_id: museumId,
    museum_name: museum?.name ?? null,
    museum_slug: museum?.slug ?? null,
    owner_email: ownerEmail,
    reason,
  })

  // Delete the auth user last (can't be undone; must succeed after everything
  // else). If no other museums reference this user, safe to delete.
  if (museum?.owner_id) {
    // Check if this user owns any other museums (multi-museum accounts aren't
    // currently supported but be defensive)
    const { count } = await service
      .from('museums')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', museum.owner_id)
    if (!count || count === 0) {
      await service.auth.admin.deleteUser(museum.owner_id)
    }
  }
}
