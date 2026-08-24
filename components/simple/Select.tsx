'use client'

/**
 * A dropdown that reads as a dropdown.
 *
 * Simple mode's selects were styled identically to its text inputs, so nothing
 * signalled that they opened a list. This gives them a tinted well and a
 * divided chevron; text inputs stay plain white. The distinction is the point,
 * so keep the two apart.
 */

interface SelectProps {
  value: string
  onChange: (next: string) => void
  options: readonly string[]
  /** Shown as the empty option. */
  placeholder?: string
  id?: string
  disabled?: boolean
  /** Render the stored value with a different display label. */
  labelFor?: (value: string) => string
  className?: string
}

export default function Select({
  value, onChange, options, placeholder = 'Choose one', id, disabled, labelFor, className = '',
}: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded pl-3 pr-11 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o}>{labelFor ? labelFor(o) : o}</option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-9 flex items-center justify-center border-l border-stone-200 dark:border-stone-700"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500 dark:text-stone-400">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
  )
}
