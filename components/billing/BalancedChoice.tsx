'use client'

/**
 * A pair of buttons that cannot become visually unequal.
 *
 * The DMCCA rules require that keeping and cancelling a subscription are
 * presented with equal weight — one must not be a filled primary button next to
 * a muted text link. That was previously two hand-written <button> elements with
 * the same long className, guarded by a test that compared the two strings and
 * failed if they drifted apart.
 *
 * Comparing two strings catches drift after it happens. Writing the className
 * once, here, means the two buttons cannot drift in the first place: there is
 * only one style, applied to both, and no prop to override it. Restyling one
 * choice now requires restyling both, which is the point.
 *
 * The only asymmetry the component allows is `data-testid`, which is invisible.
 */

const CHOICE_CLASS =
  'flex-1 text-sm py-2.5 rounded border border-stone-300 dark:border-stone-600 ' +
  'text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 ' +
  'transition-colors disabled:opacity-50'

export interface Choice {
  label: string
  onClick: () => void
  testId?: string
}

interface BalancedChoiceProps {
  /** The option that keeps things as they are. Rendered first. */
  keep: Choice
  /** The option that makes the change. Rendered second, styled identically. */
  proceed: Choice
  disabled?: boolean
}

export default function BalancedChoice({ keep, proceed, disabled }: BalancedChoiceProps) {
  return (
    <div className="flex gap-2 mt-6">
      <button
        type="button"
        onClick={keep.onClick}
        disabled={disabled}
        data-testid={keep.testId}
        className={CHOICE_CLASS}
      >
        {keep.label}
      </button>
      <button
        type="button"
        onClick={proceed.onClick}
        disabled={disabled}
        data-testid={proceed.testId}
        className={CHOICE_CLASS}
      >
        {proceed.label}
      </button>
    </div>
  )
}
