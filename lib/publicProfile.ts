import {
  resolveCollectionProfile,
  resolveObjectProfile,
  resolveAppNouns,
  fieldLabel,
  fieldVisible,
  conditionLabel,
  statusLabel,
  certificationForAuthority,
  findAuthority,
  buildVerifyUrl,
  type CollectionProfile,
  type ProfileMuseumLike,
  type ProfileObjectLike,
} from '@/lib/collectionProfiles'

/**
 * Public-site vocabulary derived from the collection's profile.
 *
 * The dashboard has spoken each hobby's language since collection profiles
 * landed, but the public site never did — a coin collection published its mint
 * as "Artist" and its alloy as "Medium". These helpers close that gap.
 *
 * For full-mode plans every resolver returns MUSEUM_FIXED, so Professional and
 * above keep the museum wording they already had.
 *
 * The result is a flat, serialisable bag of strings so it can cross the server
 * /client boundary into the collection grid without shipping the whole profile
 * registry (vocab lists, grading scales) to the browser.
 */
export interface PublicLabels {
  /** "Coin" / "Object" / "Item" */
  item: string
  itemPlural: string
  collection: string
  maker: string
  medium: string
  origin: string
  type: string
  rarity: string
  date: string
  location: string
  condition: string
  inscription: string
  /** Placeholder for the collection search box, built from the above. */
  searchPlaceholder: string
  /** Canonical condition grade → this hobby's word for it. */
  conditionLabels: Record<string, string>
  /** Canonical status → this hobby's word for it. */
  statusLabels: Record<string, string>
  /** Fields this profile hides entirely. */
  hidden: Record<string, boolean>
}

const CANONICAL_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical']
const CANONICAL_STATUSES = [
  'Entry', 'On Display', 'Storage', 'On Loan',
  'Restoration', 'Conservation', 'Deaccessioned',
]

function labelsFor(profile: CollectionProfile, fullMode: boolean, nouns: {
  item: string; itemPlural: string; collection: string
}): PublicLabels {
  const title = fieldLabel(profile, 'title', 'Title')
  const maker = fieldLabel(profile, 'artist', fullMode ? 'Artist / Maker' : 'Maker')
  const medium = fieldLabel(profile, 'medium', fullMode ? 'Medium' : 'Medium / Material')
  const origin = fieldLabel(profile, 'culture', fullMode ? 'Culture' : 'Origin')

  const conditionLabels: Record<string, string> = {}
  for (const g of CANONICAL_CONDITIONS) conditionLabels[g] = conditionLabel(profile, g, g)

  const statusLabels: Record<string, string> = {}
  for (const s of CANONICAL_STATUSES) statusLabels[s] = statusLabel(profile, s, s)

  const hidden: Record<string, boolean> = {}
  for (const key of ['rarity', 'number_of_parts', 'inscription', 'medium', 'culture'] as const) {
    if (!fieldVisible(profile, key)) hidden[key] = true
  }

  // Only the fields the search actually matches on, lowercased so the
  // placeholder reads as a sentence rather than a row of headings.
  const searchable = [title, maker, medium, origin]
    .filter(Boolean)
    .map(s => s.toLowerCase())

  return {
    item: nouns.item,
    itemPlural: nouns.itemPlural,
    collection: nouns.collection,
    maker,
    medium,
    origin,
    type: fieldLabel(profile, 'object_type', 'Object Type'),
    rarity: fieldLabel(profile, 'rarity', 'Rarity'),
    date: fieldLabel(profile, 'production_date', 'Date'),
    location: fieldLabel(profile, 'current_location', 'Location'),
    condition: fieldLabel(profile, 'condition_grade', 'Condition'),
    inscription: fieldLabel(profile, 'inscription', 'Marks and Inscriptions'),
    searchPlaceholder: `Search by ${searchable.join(', ')}…`,
    conditionLabels,
    statusLabels,
    hidden,
  }
}

/** Vocabulary for collection-wide surfaces: the grid, filters, stats line. */
export function collectionLabels(
  museum: ProfileMuseumLike & { plan?: string | null },
): PublicLabels {
  const profile = resolveCollectionProfile(museum)
  const nouns = resolveAppNouns(museum)
  return labelsFor(profile, profile.id === 'museum-fixed', nouns)
}

/**
 * Vocabulary for a single object page.
 *
 * Resolved per object rather than per collection so a museum running two
 * profiles still labels each item in its own language.
 */
export function objectLabels(
  object: ProfileObjectLike,
  museum: ProfileMuseumLike & { plan?: string | null },
): PublicLabels {
  const profile = resolveObjectProfile(object, museum)
  const nouns = resolveAppNouns(museum)
  return labelsFor(profile, profile.id === 'museum-fixed', nouns)
}

export interface PublicCustomField {
  key: string
  label: string
  value: string
}

/**
 * The profile's Tier B detail fields that this object actually has values for,
 * in the order the profile declares them.
 *
 * Values are read against the resolved profile's definitions, so a key left
 * behind by a since-deactivated profile stays inert rather than rendering as a
 * raw namespaced key.
 */
export function publicCustomFields(
  object: ProfileObjectLike & { custom_fields?: unknown },
  museum: ProfileMuseumLike & { plan?: string | null },
): PublicCustomField[] {
  const profile = resolveObjectProfile(object, museum)
  const defs = profile.customFields ?? []
  if (defs.length === 0) return []

  const stored = object.custom_fields
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return []
  const values = stored as Record<string, unknown>

  const out: PublicCustomField[] = []
  for (const def of defs) {
    const raw = values[def.key]
    if (raw === null || raw === undefined || raw === '') continue

    let value: string
    if (def.type === 'boolean') {
      if (raw !== true) continue  // "No" is noise on a public page
      value = 'Yes'
    } else if (def.type === 'number' && def.unit) {
      value = `${raw} ${def.unit}`
    } else {
      value = String(raw)
    }

    out.push({ key: def.key, label: def.label, value })
  }
  return out
}

/** A graded item's certification, ready to render. Null when ungraded. */
export interface PublicCertification {
  /** Card heading, e.g. "Grading & Certification". */
  title: string
  authorityLabel: string
  gradeLabel: string
  numberLabel: string
  grade: string | null
  number: string | null
  /** Verified public lookup URL, or null when this grader has no template. */
  verifyUrl: string | null
}

/**
 * Certification resolved registry-wide rather than from the active profile, so
 * a slab still renders correctly after its profile is deactivated — same
 * reasoning as `certificationForAuthority`.
 */
export function publicCertification(object: {
  cert_authority?: string | null
  cert_grade?: string | null
  cert_number?: string | null
}): PublicCertification | null {
  if (!object.cert_authority) return null

  const config = certificationForAuthority(object.cert_authority)
  const authority = findAuthority(config, object.cert_authority)
  const grade = object.cert_grade?.trim() || null
  const number = object.cert_number?.trim() || null

  // An authority with neither a grade nor a number says nothing to a visitor.
  if (!grade && !number) return null

  return {
    title: config?.title ?? 'Certification',
    authorityLabel: authority?.label ?? object.cert_authority,
    gradeLabel: config?.labels?.grade ?? 'Grade',
    numberLabel: config?.labels?.number ?? 'Certificate Number',
    grade,
    number,
    verifyUrl: buildVerifyUrl(config, object.cert_authority, object.cert_number),
  }
}
