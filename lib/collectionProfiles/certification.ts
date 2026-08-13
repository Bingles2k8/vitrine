import type {
  CertificationConfig, GradingAuthority, GradingScale, CanonicalConditionGrade,
} from './types'

/**
 * Certification helpers — the single implementation of grade parsing and
 * condition derivation. See docs/collection-profiles-plan.md §5.5.
 *
 * Both the object form and the CSV importer call these. VitrineCapture must
 * NOT reimplement them on-device: it sends cert_authority + cert_grade and
 * lets the server derive the rest (§12).
 */

export function findAuthority(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
): GradingAuthority | null {
  if (!config || !authorityId) return null
  return config.authorities.find(a => a.id === authorityId) ?? null
}

export function findScale(
  config: CertificationConfig | undefined,
  scaleId: string | null | undefined,
): GradingScale | null {
  if (!config || !scaleId) return null
  return config.scales.find(s => s.id === scaleId) ?? null
}

/** The scale an authority grades on, or null if either is unknown. */
export function scaleForAuthority(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
): GradingScale | null {
  const authority = findAuthority(config, authorityId)
  if (!authority) return null
  return findScale(config, authority.scale)
}

/** The grades selectable for an authority. Empty for ungraded/raw. */
export function gradesForAuthority(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
): string[] {
  return scaleForAuthority(config, authorityId)?.grades ?? []
}

/**
 * Numeric value of a grade, for sorting and analytics.
 * Derived on write into objects.cert_grade_numeric — never user-entered.
 * Returns null for an unknown authority or grade rather than throwing.
 */
export function parseGradeNumeric(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
  grade: string | null | undefined,
): number | null {
  if (!grade) return null
  const scale = scaleForAuthority(config, authorityId)
  if (!scale) return null
  const value = scale.numeric[grade]
  return typeof value === 'number' ? value : null
}

/**
 * The canonical condition_grade implied by a certification grade.
 * Returns null (never throws) for an unknown authority/grade pair, in which
 * case the caller leaves condition_grade alone.
 *
 * Invariant B: the return value is always one of the canonical five, so
 * CONDITION_STYLES and every existing query stay correct.
 */
export function conditionFromGrade(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
  grade: string | null | undefined,
): CanonicalConditionGrade | null {
  if (!config?.derivesCondition || !grade) return null
  const scale = scaleForAuthority(config, authorityId)
  if (!scale) return null
  return scale.toCondition[grade] ?? null
}

/**
 * Public cert-lookup URL, or null when this authority has no verified
 * template. Never returns a URL containing an unsubstituted {cert}.
 */
export function buildVerifyUrl(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
  certNumber: string | null | undefined,
): string | null {
  const authority = findAuthority(config, authorityId)
  if (!authority?.verifyUrl) return null
  const cert = (certNumber ?? '').trim()
  if (!cert) return null
  const url = authority.verifyUrl.replace('{cert}', encodeURIComponent(cert))
  return url.includes('{cert}') ? null : url
}

/**
 * Everything a write path needs to derive from the certification inputs.
 * Used identically by the object form, the API, and the CSV importer so
 * there is exactly one implementation of the mapping.
 */
export interface DerivedCertification {
  cert_grade_numeric: number | null
  cert_grade_scale: string | null
  condition_grade: CanonicalConditionGrade | null
}

export function deriveCertificationFields(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
  grade: string | null | undefined,
): DerivedCertification {
  const scale = scaleForAuthority(config, authorityId)
  return {
    cert_grade_numeric: parseGradeNumeric(config, authorityId, grade),
    cert_grade_scale: scale?.id ?? null,
    condition_grade: conditionFromGrade(config, authorityId, grade),
  }
}

/** True when the condition control should render read-only and derived. */
export function conditionIsDerived(
  config: CertificationConfig | undefined,
  authorityId: string | null | undefined,
  grade: string | null | undefined,
): boolean {
  return conditionFromGrade(config, authorityId, grade) !== null
}
