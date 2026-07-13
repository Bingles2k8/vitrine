export interface WhatsNewEntry {
  /** Stable slug. Never reuse or change an existing id — the sidebar highlight keys off it. */
  id: string
  /** ISO date (yyyy-mm-dd) the feature shipped. */
  date: string
  emoji: string
  title: string
  body: string
  link?: { href: string; label: string }
}

/**
 * What's New changelog.
 *
 * Newest first — ADD NEW ENTRIES AT THE TOP. The first entry's id is treated as
 * the "latest" for the sidebar highlight: the badge shows until the user opens
 * the panel, and reappears automatically whenever a newer entry is added here.
 */
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: 'android-capture',
    date: '2026-07-13',
    emoji: '🤖',
    title: 'Vitrine Capture for Android',
    body: 'Catalogue on the move. The new Vitrine Capture app lets you photograph and add objects straight from your phone, then syncs to your collection automatically. Free on Google Play — an iOS version is on the way.',
    link: {
      href: 'https://play.google.com/store/apps/details?id=com.bingles.vitrinecapture',
      label: 'Get it on Google Play',
    },
  },
  {
    id: 'staff-admin',
    date: '2026-07-07',
    emoji: '◉',
    title: 'Admin staff management',
    body: "Admins can now edit teammates' roles and remove members directly, without needing the account owner.",
  },
  {
    id: 'messaging-inbox',
    date: '2026-07-06',
    emoji: '✉️',
    title: 'Messaging & Inbox',
    body: 'Collectors and institutions can now start conversations about your collection right from your public site. Manage every thread from the new Inbox in your sidebar, with unread badges so nothing slips by.',
  },
  {
    id: 'rights-reproduction',
    date: '2026-07-06',
    emoji: '§',
    title: 'Rights & Reproduction registers',
    body: 'Two new SPECTRUM registers for Professional collections: track copyright and licensing on the Rights Register, and manage image and reproduction requests end to end. Automated reminders keep overdue items on your radar.',
  },
  {
    id: 'free-tools',
    date: '2026-06-27',
    emoji: '🛠',
    title: 'Free collection tools',
    body: 'Two free tools, no account needed: an insurance inventory generator and a condition report builder. Handy for one-off documentation, or to share with fellow collectors.',
  },
  {
    id: 'onboarding-guide',
    date: '2026-06-21',
    emoji: '📖',
    title: 'Onboarding & user guide',
    body: 'A comprehensive guide covering all 21 SPECTRUM procedures, plus power tips — available in-app and as a downloadable PDF.',
  },
  {
    id: 'dark-mode-templates',
    date: '2026-04-11',
    emoji: '🌙',
    title: 'Dark mode & redesigned templates',
    body: 'Vitrine now follows your system theme, and the public site templates — Minimal, Dramatic, and Archival — have been rebuilt with new branding controls.',
  },
]

/** The id of the newest entry — used for the "unseen" highlight in the sidebar. */
export const latestWhatsNewId = WHATS_NEW[0]?.id ?? ''
