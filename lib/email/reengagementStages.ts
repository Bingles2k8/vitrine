/**
 * Stage selection for the orphan re-engagement track (Track C).
 *
 * Lives here rather than in the cron route because Next validates the exports
 * of a route file, so the logic cannot be exported from there to be tested —
 * and this is the part of an automated emailer that most needs testing. Get the
 * catch window wrong and a stage is skipped for everyone; get the "already
 * sent" test wrong and people are mailed twice.
 *
 * Track C recipients have no museum row, so unlike Tracks A and B there is no
 * per-stage flag column to write. The `account_emails` rows the send writes are
 * the record instead, which has the useful side effect that a nudge sent by
 * hand from /admin and the automated track can see each other.
 */

export const DAY = 86_400_000

/** Catch window in days, so a missed cron day still fires the stage. */
export const WINDOW = 2

/**
 * Days that must pass after ANY email to this person before a stage may fire.
 *
 * The stage flags only record stages, so without this an admin who sends a
 * nudge by hand on day 2 does not stop the cron sending c3 on day 3 — two
 * emails, two days, from a product that had sent them nothing at all.
 *
 * Two days is deliberate. The tightest legitimate gap between stages is c3
 * firing at the very end of its catch window (day 4.9) and c7 firing on time
 * (day 7), which is 2.1 days — so this can never suppress a stage that was
 * genuinely due, and only ever collapses a manual send and an automated one
 * that would have landed on top of each other.
 */
export const COOLDOWN = 2

export type OrphanStage = 'c3' | 'c7' | 'c30'

/** `account_emails.kind` written for each stage. */
export const ORPHAN_KIND: Record<OrphanStage, string> = {
  c3: 'reengage_c3',
  c7: 'reengage_c7',
  c30: 'reengage_c30',
}

/** Newest first, so a late run sends the stage due now, not the whole series. */
const THRESHOLDS: Array<[OrphanStage, number]> = [
  ['c30', 30],
  ['c7', 7],
  ['c3', 3],
]

export function inWindow(days: number, threshold: number): boolean {
  return days >= threshold && days < threshold + WINDOW
}

/**
 * Which Track C email is due today, or null.
 *
 * @param createdAt      signup date of the auth account
 * @param alreadySent    `account_emails.kind` values already recorded for them
 * @param lastEmailedAt  when they were last emailed successfully, ANY kind,
 *                       including a nudge sent by hand from /admin
 * @param now            injectable for tests
 */
export function dueOrphanStage(
  createdAt: string,
  alreadySent: Set<string>,
  lastEmailedAt: string | null = null,
  now: number = Date.now(),
): OrphanStage | null {
  const createdMs = Date.parse(createdAt)
  if (Number.isNaN(createdMs)) return null

  if (lastEmailedAt) {
    const lastMs = Date.parse(lastEmailedAt)
    if (!Number.isNaN(lastMs) && (now - lastMs) / DAY < COOLDOWN) return null
  }

  const age = (now - createdMs) / DAY
  for (const [stage, threshold] of THRESHOLDS) {
    if (inWindow(age, threshold) && !alreadySent.has(ORPHAN_KIND[stage])) return stage
  }
  return null
}
