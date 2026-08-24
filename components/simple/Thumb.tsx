'use client'

/**
 * An object's picture in a list.
 *
 * Falls back to the object's emoji, then to a neutral mark — the same
 * progression the loans page already uses. A missing photo must never look
 * like a broken one, because on Community only a single image per record is
 * allowed and most records will not have it yet.
 */

interface ThumbProps {
  src?: string | null
  emoji?: string | null
  alt?: string
  /** Rendered size in px. */
  size?: number
  className?: string
}

export default function Thumb({ src, emoji, alt = '', size = 44, className = '' }: ThumbProps) {
  const box = `rounded-md border border-stone-200 dark:border-stone-700 overflow-hidden flex-shrink-0 ${className}`
  const style = { width: size, height: size }

  if (src) {
    return <img src={src} alt={alt} className={`${box} object-cover`} style={style} />
  }

  return (
    <div
      className={`${box} bg-stone-100 dark:bg-stone-800 flex items-center justify-center`}
      style={style}
      aria-hidden={!alt || undefined}
    >
      <span style={{ fontSize: Math.round(size * 0.45), lineHeight: 1 }}>{emoji || '◯'}</span>
    </div>
  )
}
