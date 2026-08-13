import type { GradingScale, CanonicalConditionGrade } from './types'

/**
 * Shared grading scales, reused across profiles.
 * See docs/collection-profiles-plan.md §5.5.
 *
 * Every scale must satisfy, and is tested for:
 *   - `numeric` and `toCondition` have an entry for every grade in `grades`
 *   - `numeric` is strictly decreasing in `grades` order (grades are best-first)
 *   - every `toCondition` value is a canonical condition grade (invariant B)
 */

/** Builds toCondition from ordered bands, so the mapping can't have gaps. */
function bands(
  spec: [CanonicalConditionGrade, string[]][],
): Record<string, CanonicalConditionGrade> {
  const out: Record<string, CanonicalConditionGrade> = {}
  for (const [condition, grades] of spec) {
    for (const g of grades) out[g] = condition
  }
  return out
}

function numericFrom(grades: string[], values: number[]): Record<string, number> {
  return Object.fromEntries(grades.map((g, i) => [g, values[i]]))
}

// ── Ungraded ─────────────────────────────────────────────────────────────
// Present so "Raw / Ungraded" is a selectable authority that clears the grade
// fields and hands condition back to the user.

export const rawScale: GradingScale = {
  id: 'raw',
  grades: [],
  numeric: {},
  toCondition: {},
}

// ── 1–10 card scale (PSA, CGC Cards, SGC, TAG) ───────────────────────────

const PSA_GRADES = ['10', '9.5', '9', '8.5', '8', '7', '6', '5', '4', '3', '2', '1.5', '1', 'Authentic']

export const psa10Scale: GradingScale = {
  id: 'psa10',
  grades: PSA_GRADES,
  numeric: numericFrom(PSA_GRADES, [10, 9.5, 9, 8.5, 8, 7, 6, 5, 4, 3, 2, 1.5, 1, 0]),
  toCondition: bands([
    ['Excellent', ['10', '9.5', '9']],
    ['Good', ['8.5', '8', '7']],
    ['Fair', ['6', '5', '4', 'Authentic']],
    ['Poor', ['3', '2', '1.5']],
    ['Critical', ['1']],
  ]),
}

// ── Beckett, which adds a Black Label above a perfect 10 ─────────────────

const BGS_GRADES = ['Black Label 10', ...PSA_GRADES]

export const bgs10Scale: GradingScale = {
  id: 'bgs10',
  grades: BGS_GRADES,
  numeric: numericFrom(BGS_GRADES, [10.1, 10, 9.5, 9, 8.5, 8, 7, 6, 5, 4, 3, 2, 1.5, 1, 0]),
  toCondition: { 'Black Label 10': 'Excellent', ...psa10Scale.toCondition },
}

// ── Comics (CGC / CBCS) — same 0.5–10 ladder, finer at the top ───────────

const CGC_GRADES = [
  '10', '9.9', '9.8', '9.6', '9.4', '9.2', '9.0', '8.5', '8.0', '7.5', '7.0',
  '6.5', '6.0', '5.5', '5.0', '4.5', '4.0', '3.5', '3.0', '2.5', '2.0',
  '1.8', '1.5', '1.0', '0.5',
]

export const cgcComicScale: GradingScale = {
  id: 'cgc-comic',
  grades: CGC_GRADES,
  numeric: numericFrom(CGC_GRADES, [
    10, 9.9, 9.8, 9.6, 9.4, 9.2, 9.0, 8.5, 8.0, 7.5, 7.0,
    6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0,
    1.8, 1.5, 1.0, 0.5,
  ]),
  toCondition: bands([
    ['Excellent', ['10', '9.9', '9.8', '9.6', '9.4']],
    ['Good', ['9.2', '9.0', '8.5', '8.0', '7.5', '7.0']],
    ['Fair', ['6.5', '6.0', '5.5', '5.0', '4.5', '4.0']],
    ['Poor', ['3.5', '3.0', '2.5', '2.0']],
    ['Critical', ['1.8', '1.5', '1.0', '0.5']],
  ]),
}

// ── Coins: the Sheldon 70-point scale (PCGS, NGC, ANACS, ICG) ────────────

const SHELDON_GRADES = [
  'MS-70', 'MS-69', 'MS-68', 'MS-67', 'MS-66', 'MS-65', 'MS-64', 'MS-63',
  'MS-62', 'MS-61', 'MS-60', 'AU-58', 'AU-55', 'AU-53', 'AU-50',
  'XF-45', 'XF-40', 'VF-35', 'VF-30', 'VF-25', 'VF-20',
  'F-15', 'F-12', 'VG-10', 'VG-8', 'G-6', 'G-4', 'AG-3', 'FA-2', 'PO-1',
]

export const sheldon70Scale: GradingScale = {
  id: 'sheldon70',
  grades: SHELDON_GRADES,
  numeric: numericFrom(SHELDON_GRADES, [
    70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 58, 55, 53, 50,
    45, 40, 35, 30, 25, 20, 15, 12, 10, 8, 6, 4, 3, 2, 1,
  ]),
  toCondition: bands([
    ['Excellent', ['MS-70', 'MS-69', 'MS-68', 'MS-67', 'MS-66', 'MS-65']],
    ['Good', ['MS-64', 'MS-63', 'MS-62', 'MS-61', 'MS-60', 'AU-58', 'AU-55', 'AU-53', 'AU-50']],
    ['Fair', ['XF-45', 'XF-40', 'VF-35', 'VF-30', 'VF-25', 'VF-20']],
    ['Poor', ['F-15', 'F-12', 'VG-10', 'VG-8', 'G-6', 'G-4']],
    ['Critical', ['AG-3', 'FA-2', 'PO-1']],
  ]),
}

// ── Banknotes: Sheldon-derived, with the paper-money labels ──────────────

const PMG_GRADES = [
  '70', '69', '68', '67', '66', '65', '64', '63', '62', '61', '60',
  '58', '55', '53', '50', '45', '40', '35', '30', '25', '20',
  '15', '12', '10', '8', '6', '4', '3', '2', '1',
]

export const pmg70Scale: GradingScale = {
  id: 'pmg70',
  grades: PMG_GRADES,
  numeric: numericFrom(PMG_GRADES, [
    70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60,
    58, 55, 53, 50, 45, 40, 35, 30, 25, 20,
    15, 12, 10, 8, 6, 4, 3, 2, 1,
  ]),
  toCondition: bands([
    ['Excellent', ['70', '69', '68', '67', '66', '65']],
    ['Good', ['64', '63', '62', '61', '60', '58', '55', '53', '50']],
    ['Fair', ['45', '40', '35', '30', '25', '20']],
    ['Poor', ['15', '12', '10', '8', '6', '4']],
    ['Critical', ['3', '2', '1']],
  ]),
}

// ── Sealed video games (WATA / VGA / CGC) ────────────────────────────────

const WATA_GRADES = [
  '10', '9.8', '9.6', '9.4', '9.2', '9.0', '8.5', '8.0', '7.5', '7.0',
  '6.5', '6.0', '5.5', '5.0', '4.0', '3.0', '2.0', '1.0',
]

export const wata10Scale: GradingScale = {
  id: 'wata10',
  grades: WATA_GRADES,
  numeric: numericFrom(WATA_GRADES, [
    10, 9.8, 9.6, 9.4, 9.2, 9.0, 8.5, 8.0, 7.5, 7.0,
    6.5, 6.0, 5.5, 5.0, 4.0, 3.0, 2.0, 1.0,
  ]),
  toCondition: bands([
    ['Excellent', ['10', '9.8', '9.6', '9.4']],
    ['Good', ['9.2', '9.0', '8.5', '8.0']],
    ['Fair', ['7.5', '7.0', '6.5', '6.0']],
    ['Poor', ['5.5', '5.0', '4.0']],
    ['Critical', ['3.0', '2.0', '1.0']],
  ]),
}

// ── Opinion-only scales (no numeric ladder to speak of) ──────────────────

const EXPERTISING_GRADES = [
  'Genuine', 'Genuine — with faults', 'Not as described', 'Forgery', 'No opinion',
]

/** Philatelic expertising: an opinion on authenticity, not a quality ladder. */
export const expertisingScale: GradingScale = {
  id: 'expertising',
  grades: EXPERTISING_GRADES,
  numeric: numericFrom(EXPERTISING_GRADES, [5, 4, 3, 2, 1]),
  toCondition: bands([
    ['Excellent', ['Genuine']],
    ['Fair', ['Genuine — with faults', 'No opinion']],
    ['Poor', ['Not as described']],
    ['Critical', ['Forgery']],
  ]),
}

const AUTH_GRADES = ['Authentic', 'Likely genuine', 'Inconclusive', 'Not genuine']

/** Autograph / sneaker / general authentication: pass-fail with a middle. */
export const authenticationScale: GradingScale = {
  id: 'authentication',
  grades: AUTH_GRADES,
  numeric: numericFrom(AUTH_GRADES, [4, 3, 2, 1]),
  toCondition: bands([
    ['Excellent', ['Authentic']],
    ['Good', ['Likely genuine']],
    ['Fair', ['Inconclusive']],
    ['Critical', ['Not genuine']],
  ]),
}

/** Diamond clarity (GIA/IGI/AGS/HRD). Colour and cut live in custom fields. */
const CLARITY_GRADES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3']

export const diamondClarityScale: GradingScale = {
  id: 'diamond-clarity',
  grades: CLARITY_GRADES,
  numeric: numericFrom(CLARITY_GRADES, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]),
  toCondition: bands([
    ['Excellent', ['FL', 'IF', 'VVS1', 'VVS2']],
    ['Good', ['VS1', 'VS2']],
    ['Fair', ['SI1', 'SI2']],
    ['Poor', ['I1', 'I2']],
    ['Critical', ['I3']],
  ]),
}

/** Watches: completeness of box, papers and provenance, not a quality grade. */
const PAPERS_GRADES = [
  'Full set', 'Watch, box & papers', 'Watch & papers', 'Watch & box',
  'Watch only', 'Service papers only',
]

export const papersScale: GradingScale = {
  id: 'papers',
  grades: PAPERS_GRADES,
  numeric: numericFrom(PAPERS_GRADES, [6, 5, 4, 3, 2, 1]),
  toCondition: bands([
    ['Excellent', ['Full set', 'Watch, box & papers']],
    ['Good', ['Watch & papers', 'Watch & box']],
    ['Fair', ['Watch only', 'Service papers only']],
  ]),
}

/** Toys & models: sealed-box grading (AFA and similar). */
const SEALED_GRADES = ['95', '90', '85', '80', '75', '70', '60', '50']

export const sealedBoxScale: GradingScale = {
  id: 'sealed-box',
  grades: SEALED_GRADES,
  numeric: numericFrom(SEALED_GRADES, [95, 90, 85, 80, 75, 70, 60, 50]),
  toCondition: bands([
    ['Excellent', ['95', '90']],
    ['Good', ['85', '80']],
    ['Fair', ['75', '70']],
    ['Poor', ['60']],
    ['Critical', ['50']],
  ]),
}

/** Certificate of authenticity for artworks — a yes/no with provenance weight. */
const COA_GRADES = ['Authenticated', 'Attributed', 'Under review', 'Rejected']

export const coaScale: GradingScale = {
  id: 'coa',
  grades: COA_GRADES,
  numeric: numericFrom(COA_GRADES, [4, 3, 2, 1]),
  toCondition: bands([
    ['Excellent', ['Authenticated']],
    ['Good', ['Attributed']],
    ['Fair', ['Under review']],
    ['Critical', ['Rejected']],
  ]),
}

/** Militaria: proof / deactivation certification status. */
const PROOF_GRADES = [
  'Deactivated — EU spec', 'Deactivated — pre-2016 spec', 'Proofed', 'Inert / replica', 'Not certified',
]

export const proofScale: GradingScale = {
  id: 'proof',
  grades: PROOF_GRADES,
  numeric: numericFrom(PROOF_GRADES, [5, 4, 3, 2, 1]),
  toCondition: bands([
    ['Excellent', ['Deactivated — EU spec']],
    ['Good', ['Deactivated — pre-2016 spec', 'Proofed']],
    ['Fair', ['Inert / replica', 'Not certified']],
  ]),
}

export const SHARED_SCALES: GradingScale[] = [
  rawScale, psa10Scale, bgs10Scale, cgcComicScale, sheldon70Scale, pmg70Scale,
  wata10Scale, expertisingScale, authenticationScale, diamondClarityScale,
  papersScale, sealedBoxScale, coaScale, proofScale,
]
