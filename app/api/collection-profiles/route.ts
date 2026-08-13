import { NextResponse } from 'next/server'
import {
  COLLECTION_PROFILES, NEUTRAL_NOUNS, MUSEUM_NOUNS,
  CANONICAL_STATUSES, CANONICAL_CONDITION_GRADES, PROFILE_FIELD_KEYS,
  CATEGORY_TO_PROFILE, DEFAULT_FIELD_ORDER,
} from '@/lib/collectionProfiles'
import { COLLECTION_CATEGORIES } from '@/lib/categories'

/**
 * The collection profile registry, published for VitrineCapture.
 * See docs/collection-profiles-plan.md §12.
 *
 * Public and cacheable — it contains no user data, only the definitions that
 * ship with the app. Capture caches by `version` and refetches on mismatch,
 * rather than duplicating the registry and drifting out of step.
 *
 * The profiles serialise verbatim, which is the whole reason they were defined
 * as plain data: grading authorities, scales, condition mappings and detail
 * field definitions all come across for free.
 */

/** Bump whenever a profile changes in a way Capture must pick up. */
const REGISTRY_VERSION = '2026-08-12'

export const revalidate = 3600

export async function GET() {
  return NextResponse.json(
    {
      version: REGISTRY_VERSION,
      canonical: {
        // Capture must send these values, not the profile's display labels.
        statuses: CANONICAL_STATUSES,
        conditionGrades: CANONICAL_CONDITION_GRADES,
        fieldKeys: PROFILE_FIELD_KEYS,
        defaultFieldOrder: DEFAULT_FIELD_ORDER,
        certColumns: [
          'cert_authority', 'cert_number', 'cert_grade', 'cert_grade_numeric',
          'cert_grade_scale', 'cert_date', 'cert_subgrades', 'cert_notes',
        ],
        categories: COLLECTION_CATEGORIES,
      },
      neutralNouns: NEUTRAL_NOUNS,
      museumNouns: MUSEUM_NOUNS,
      categoryToProfile: CATEGORY_TO_PROFILE,
      profiles: COLLECTION_PROFILES,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  )
}
