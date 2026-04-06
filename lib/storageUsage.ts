import { getPlan } from '@/lib/plans'

/**
 * Returns true if the museum has room for `additionalBytes` more storage.
 * Reads the cached storage_used_bytes column on the museums table,
 * which is kept in sync by Postgres triggers on all storage-contributing tables.
 *
 * Public gallery images (object_images table) are NOT counted — they are
 * governed by the per-object imagesPerObject count limit instead.
 */
export async function checkStorageQuota(
  supabase: any,
  museumId: string,
  planId: string,
  additionalBytes: number,
): Promise<boolean> {
  const plan = getPlan(planId)
  if (plan.documentStorageMb === null) return true
  const limitBytes = plan.documentStorageMb * 1024 * 1024

  const { data } = await supabase
    .from('museums')
    .select('storage_used_bytes')
    .eq('id', museumId)
    .single()

  return ((data?.storage_used_bytes ?? 0) + additionalBytes) <= limitBytes
}
