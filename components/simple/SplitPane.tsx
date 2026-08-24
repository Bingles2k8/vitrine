'use client'

import type { ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

/**
 * A list beside a detail pane, which becomes push navigation on a phone.
 *
 * Above 768px both halves show and the pane sticks as the list scrolls. Below
 * it there is no room to split, so the caller renders the list until something
 * is selected and the detail replaces it — the standard master/detail collapse,
 * and what the dashboard already does when it pushes to an object page.
 *
 * The selection lives in the URL (`?record=…`) rather than component state, so
 * a deep link, a refresh and the back button all behave.
 */

interface SplitPaneProps {
  list: ReactNode
  detail: ReactNode
  /** True when something is selected — decides which half a phone shows. */
  hasSelection: boolean
  /** Width of the list column above the breakpoint. */
  listWidth?: number
  /** Sticky offset for the detail pane, matching the chrome above it. */
  stickyTop?: number
}

export default function SplitPane({
  list, detail, hasSelection, listWidth = 380, stickyTop = 0,
}: SplitPaneProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <div className="min-w-0">{hasSelection ? detail : list}</div>
  }

  return (
    <div className="flex gap-6 items-start min-w-0">
      <div
        className="flex-shrink-0 min-w-0 border-r border-stone-200 dark:border-stone-800 pr-5"
        style={{ width: listWidth }}
      >
        {list}
      </div>
      <div className="flex-1 min-w-0 sticky" style={{ top: stickyTop }}>
        {detail}
      </div>
    </div>
  )
}
