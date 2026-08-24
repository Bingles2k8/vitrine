import type { ProfileNouns } from '@/lib/collectionProfiles'

/**
 * Plain-English wording for simple mode, in one place.
 *
 * Two rules hold this together:
 *
 *   1. Nouns always come from the profile. A vinyl collection says "record",
 *      a card collection says "card". Never hardcode one — that is how the
 *      dashboard ended up with a "Total Objects" card above a table headed
 *      "Record".
 *   2. A control says what it does. "Mark as acquired" hid the fact that the
 *      button converts a wishlist entry into a real record; "Got it — add to
 *      my records" says so. Same for "Revoke" → "Turn it off".
 *
 * Full mode keeps the museum vocabulary and does not read this file.
 */

export function simpleCopy(nouns: ProfileNouns) {
  const item = nouns.item.toLowerCase()
  const items = nouns.itemPlural.toLowerCase()

  return {
    // ── Collection ──────────────────────────────────────────────────────
    yourItems: `Your ${items}`,
    addItem: nouns.addItem,
    searchItems: `Search your ${items}…`,
    noItemsYet: `You haven't added any ${items} yet`,

    /** "Forty-eight records. Twelve are on your public page, one is lent out." */
    summary(total: number, onSite: number, lent: number) {
      const parts = [`${total} ${total === 1 ? item : items}`]
      if (onSite > 0) parts.push(`${onSite} on your public page`)
      if (lent > 0) parts.push(`${lent} lent out`)
      return parts.join(' · ')
    },

    // ── Visibility ──────────────────────────────────────────────────────
    visibleOnPage: 'Visible on your public page',
    hiddenFromPage: 'Hidden from your public page',
    onYourPage: 'On your page',
    private: 'Private',

    // ── Record actions ──────────────────────────────────────────────────
    editItem: `Edit this ${item}`,
    duplicate: 'Duplicate',
    moveToBin: 'Move to bin',
    saveItem: `Save ${item}`,
    startAnother: 'Start another one straight after',

    // ── Add form ────────────────────────────────────────────────────────
    whatIsIt: 'What is it?',
    whoIsItBy: 'Who’s it by?',
    moreDetails: 'More details',
    moreDetailsHint: 'every one of these is optional',
    autoFilled: `Saved ${items} get today's date and a reference number automatically, and stay private until you choose to show them.`,
    scanPrompt: 'Got a barcode? Scan it and we’ll fill the rest in',
    scanHint: 'Works for most records, books and games with a barcode on the back',

    // ── Wishlist ────────────────────────────────────────────────────────
    /** Names the consequence: this creates a real record. */
    markAcquired: 'Got it — add to my records',
    priorities: { high: 'Must have', medium: 'Would like', low: 'One day' } as Record<string, string>,

    // ── Lending ─────────────────────────────────────────────────────────
    markReturned: 'It’s back',
    lentStillYours: `Anything lent out still counts as yours and still shows on your public page — it is just marked as being elsewhere.`,

    // ── Private links ───────────────────────────────────────────────────
    turnLinkOff: 'Turn it off',
    copyLink: 'Copy link',

    // ── Sets ────────────────────────────────────────────────────────────
    setAuto: 'Keeps itself updated',
    setManual: (n: number) => `${n} ${n === 1 ? item : items} you picked`,
    setDraft: 'Not published',
  }
}

export type SimpleCopy = ReturnType<typeof simpleCopy>

/** Wishlist priority in the collector's words, falling back to the stored value. */
export function priorityLabel(priority: string): string {
  return ({ high: 'Must have', medium: 'Would like', low: 'One day' } as Record<string, string>)[priority] ?? priority
}
