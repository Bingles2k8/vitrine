/**
 * Wording shared across simple mode.
 *
 * Most of the plain-English rewrite lives inline on the page it belongs to,
 * which is where it is easiest to read next to the thing it labels. What sits
 * here is the wording used in more than one place.
 *
 * The rule the rewrite follows: a control says what it does. "Mark as
 * acquired" hid the fact that the button converts a wishlist entry into a
 * real record; "Got it — add to my records" says so. Nouns always come from
 * the collection profile, never a literal.
 */

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Must have',
  medium: 'Would like',
  low: 'One day',
}

/** A wishlist priority in the words a collector uses, not high/medium/low. */
export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority
}
