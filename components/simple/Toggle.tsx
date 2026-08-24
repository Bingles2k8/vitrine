'use client'

/**
 * The amber switch used across simple mode.
 *
 * This shape was hand-rolled in seven places — Sidebar, OverviewTab,
 * CustomFieldsCard, AcceptMessagesToggle, the dashboard, the wishlist and the
 * site builder — each with slightly different sizes and colours. One component
 * so they stop drifting.
 */

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Read by screen readers; also the visible label when `label` is set. */
  label: string
  /** Show the label beside the switch. Off for a bare control in a table cell. */
  showLabel?: boolean
  hint?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function Toggle({
  checked, onChange, label, showLabel = true, hint, disabled, size = 'md',
}: ToggleProps) {
  const w = size === 'sm' ? 'w-8' : 'w-9'
  const h = size === 'sm' ? 'h-4' : 'h-5'
  const knob = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const shift = size === 'sm' ? 'left-[1.125rem]' : 'left-[1.125rem]'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 rounded"
    >
      <span
        className={`relative inline-block ${w} ${h} rounded-full flex-shrink-0 transition-colors ${
          checked ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-600'
        }`}
      >
        <span
          className={`absolute top-0.5 ${knob} rounded-full bg-white transition-all ${
            checked ? shift : 'left-0.5'
          }`}
        />
      </span>
      {showLabel && (
        <span className="min-w-0">
          <span className="block text-sm text-stone-900 dark:text-stone-100">{label}</span>
          {hint && (
            <span className="block text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{hint}</span>
          )}
        </span>
      )}
    </button>
  )
}
