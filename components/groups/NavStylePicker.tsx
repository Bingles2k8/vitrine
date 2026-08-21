'use client'

import { SET_NAV_STYLE_META, type SetNavStyleMeta } from '@/lib/collectionGroups/presentation'
import type { SetNavStyle } from '@/lib/collectionGroups/types'

/**
 * How visitors move through this set's items.
 *
 * Each option carries a small diagram rather than a text label alone — "Cover
 * Flow" and "Filmstrip" mean nothing until you can see the shape of them.
 */

function Swatch({ icon }: { icon: SetNavStyleMeta['icon'] }) {
  const fill = 'currentColor'
  const common = { fill, opacity: 0.85 }

  return (
    <svg viewBox="0 0 64 36" className="w-full h-9" aria-hidden>
      {icon === 'grid' && (
        <>
          {[0, 1, 2, 3].map(c => [0, 1].map(r => (
            <rect key={`${c}-${r}`} x={6 + c * 14} y={6 + r * 13} width="11" height="10" rx="1.5" {...common} />
          )))}
        </>
      )}

      {icon === 'coverflow' && (
        <>
          <rect x="6" y="12" width="9" height="13" rx="1.5" fill={fill} opacity="0.25" transform="skewY(10)" />
          <rect x="17" y="9" width="11" height="17" rx="1.5" fill={fill} opacity="0.45" transform="skewY(6)" />
          <rect x="25" y="5" width="15" height="25" rx="2" {...common} />
          <rect x="38" y="9" width="11" height="17" rx="1.5" fill={fill} opacity="0.45" transform="skewY(-6)" />
          <rect x="50" y="12" width="9" height="13" rx="1.5" fill={fill} opacity="0.25" transform="skewY(-10)" />
        </>
      )}

      {icon === 'carousel' && (
        <>
          <path d="M8 18l4-4M8 18l4 4" stroke={fill} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <rect x="18" y="7" width="28" height="22" rx="2" {...common} />
          <path d="M56 18l-4-4M56 18l-4 4" stroke={fill} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )}

      {icon === 'filmstrip' && (
        <>
          <rect x="10" y="4" width="44" height="18" rx="2" {...common} />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={10 + i * 9} y="26" width="7" height="7" rx="1" fill={fill} opacity={i === 1 ? 0.9 : 0.35} />
          ))}
        </>
      )}

      {icon === 'shelf' && (
        <>
          {[0, 1].map(r => (
            <g key={r}>
              {[0, 1, 2, 3].map(c => (
                <rect key={c} x={9 + c * 12} y={4 + r * 16} width="8" height="9" rx="1" {...common} />
              ))}
              <rect x="6" y={14 + r * 16} width="52" height="2" rx="1" fill={fill} opacity="0.45" />
            </g>
          ))}
        </>
      )}

      {icon === 'sheet' && (
        <>
          <rect x="4" y="3" width="56" height="30" rx="2" fill={fill} opacity="0.15" />
          {[0, 1, 2, 3, 4].map(c => [0, 1].map(r => (
            <rect key={`${c}-${r}`} x={7 + c * 11} y={6 + r * 13} width="9" height="10" rx="0.5" {...common} />
          )))}
        </>
      )}

      {icon === 'timeline' && (
        <>
          <line x1="4" y1="26" x2="60" y2="26" stroke={fill} strokeWidth="1" opacity="0.4" />
          {[0, 1, 2, 3].map(i => (
            <g key={i}>
              <rect x={8 + i * 14} y={6 + (i % 2) * 3} width="9" height="13" rx="1" {...common} />
              <circle cx={12.5 + i * 14} cy="26" r="2" fill={fill} />
            </g>
          ))}
        </>
      )}

      {icon === 'reel' && (
        <>
          <rect x="20" y="2" width="24" height="14" rx="2" fill={fill} opacity="0.3" />
          <rect x="20" y="18" width="24" height="16" rx="2" {...common} />
          <path d="M32 30l0 4M30 32l2 2 2-2" stroke={fill} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </>
      )}
    </svg>
  )
}

interface Props {
  value: SetNavStyle
  onChange: (value: SetNavStyle) => void
  /** Members currently resolved, so unusable choices can be flagged. */
  itemCount: number
  datedCount: number
  disabled?: boolean
}

export default function NavStylePicker({ value, onChange, itemCount, datedCount, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {SET_NAV_STYLE_META.map(style => {
        const active = value === style.id
        const tooFew = itemCount > 0 && itemCount < style.minItems
        const undated = style.id === 'timeline' && itemCount > 0 && datedCount < 2

        // Never blocked — an owner may be mid-build with two items and twelve
        // to come. The renderer falls back on its own; this just says so.
        const warning = tooFew
          ? `Needs ${style.minItems}+ items — shows as a grid until then`
          : undated
            ? 'Needs dates on at least two items — shows as a grid until then'
            : null

        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(style.id)}
            title={style.blurb}
            className={`text-left p-3 rounded-lg border transition-all disabled:opacity-50 ${
              active
                ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                : 'border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-400 dark:hover:border-stone-500'
            }`}
          >
            <Swatch icon={style.icon} />
            <div className={`text-xs font-mono mt-2 ${active ? '' : 'text-stone-600 dark:text-stone-400'}`}>
              {style.label}
            </div>
            <div className="text-[10px] leading-snug mt-1 text-stone-400 dark:text-stone-500 line-clamp-2">
              {style.blurb}
            </div>
            {warning && active && (
              <div className="text-[10px] leading-snug mt-1.5 text-amber-600 dark:text-amber-400">
                {warning}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
