'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { learnDescriptions, type LearnEntry } from '@/lib/learn-descriptions'

export default function LearnTooltipOverlay() {
  const [entry, setEntry] = useState<LearnEntry | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; arrowLeft: number; above: boolean; placement: 'above' | 'below' | 'right' }>({ top: 0, left: 0, arrowLeft: 0, above: true, placement: 'above' })
  const [showTechnical, setShowTechnical] = useState(false)
  const [visible, setVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentTarget = useRef<HTMLElement | null>(null)

  const show = useCallback((el: HTMLElement, key: string) => {
    const desc = learnDescriptions[key]
    if (!desc) return

    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }

    const rect = el.getBoundingClientRect()
    const tooltipW = 288
    const tooltipH = 160 // estimate, will adjust
    const pad = 12

    const inSidebar = !!el.closest('[data-sidebar]')

    let left: number, top: number, arrowLeft: number, above: boolean
    let placement: 'above' | 'below' | 'right'

    if (inSidebar) {
      // Position to the right of the sidebar element
      placement = 'right'
      left = rect.right + pad
      top = Math.max(pad, Math.min(rect.top + rect.height / 2 - tooltipH / 2, window.innerHeight - tooltipH - pad))
      arrowLeft = 0 // unused for right placement
      above = false // unused for right placement
    } else {
      // Horizontal: center on element, clamp to viewport
      left = rect.left + rect.width / 2 - tooltipW / 2
      left = Math.max(pad, Math.min(left, window.innerWidth - tooltipW - pad))
      arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, tooltipW - 16))

      // Vertical: prefer above, fall back to below
      above = rect.top > tooltipH + pad
      top = above ? rect.top - pad : rect.bottom + pad
      placement = above ? 'above' : 'below'
    }

    setEntry(desc)
    setShowTechnical(false)
    setPos({ top, left, arrowLeft, above, placement })
    setVisible(true)
    currentTarget.current = el
  }, [])

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setEntry(null)
      currentTarget.current = null
    }, 500)
  }, [])

  useEffect(() => {
    function onEnter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (tooltipRef.current?.contains(target)) return
      const el = target.closest?.('[data-learn]') as HTMLElement | null
      if (!el) return
      const key = el.getAttribute('data-learn')
      if (key) show(el, key)
    }

    function onLeave(e: MouseEvent) {
      const target = e.target as HTMLElement
      const relatedTarget = e.relatedTarget as HTMLElement | null

      const leavingLearn = !!target.closest?.('[data-learn]')
      const leavingTooltip = !!target.closest?.('[data-learn-tooltip]')

      if (!leavingLearn && !leavingTooltip) return

      const enteringTooltip = !!relatedTarget?.closest?.('[data-learn-tooltip]')
      const enteringLearn = !!relatedTarget?.closest?.('[data-learn]')

      if (!enteringTooltip && !enteringLearn) {
        scheduleHide()
      }
    }

    document.body.addEventListener('mouseenter', onEnter, true)
    document.body.addEventListener('mouseleave', onLeave, true)

    return () => {
      document.body.removeEventListener('mouseenter', onEnter, true)
      document.body.removeEventListener('mouseleave', onLeave, true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [show, scheduleHide])

  // Keep tooltip alive when hovering the tooltip itself
  function onTooltipEnter() {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
  }
  function onTooltipLeave() {
    scheduleHide()
  }

  if (!visible || !entry) return null

  const tech = entry.technical

  return (
    <div
      ref={tooltipRef}
      data-learn-tooltip
      onMouseEnter={onTooltipEnter}
      onMouseLeave={onTooltipLeave}
      className="fixed z-[300] pointer-events-auto"
      style={{
        top: pos.placement === 'above' ? undefined : pos.top,
        bottom: pos.placement === 'above' ? `${window.innerHeight - pos.top}px` : undefined,
        left: pos.left,
        width: 288,
      }}
    >
      <div className="relative bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg shadow-xl px-4 py-3 text-xs font-mono leading-relaxed max-h-64 overflow-y-auto">
        {/* Arrow */}
        {pos.placement === 'right' ? (
          <div
            className="absolute w-2.5 h-2.5 bg-stone-900 dark:bg-white rotate-45 -left-1 top-1/2 -translate-y-1/2"
          />
        ) : (
          <div
            className={`absolute w-2.5 h-2.5 bg-stone-900 dark:bg-white rotate-45 ${pos.placement === 'above' ? '-bottom-1' : '-top-1'}`}
            style={{ left: pos.arrowLeft }}
          />
        )}

        {/* Label */}
        <div className="font-medium text-amber-400 dark:text-amber-600 mb-1">{entry.label}</div>

        {/* Description */}
        <p className="text-stone-300 dark:text-stone-600 leading-relaxed">{entry.description}</p>

        {/* Technical details expander */}
        {tech && (
          <div className="mt-2 border-t border-stone-700 dark:border-stone-200 pt-2">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="flex items-center gap-1 text-stone-400 dark:text-stone-500 hover:text-stone-200 dark:hover:text-stone-700 transition-colors"
            >
              <span className="text-[10px]">{showTechnical ? '▾' : '▸'}</span>
              Technical details
            </button>
            {showTechnical && (
              <div className="mt-1.5 space-y-0.5 text-stone-400 dark:text-stone-500 text-[11px]">
                {tech.column && <div><span className="text-stone-500 dark:text-stone-400">Column:</span> {tech.column}</div>}
                {tech.type && <div><span className="text-stone-500 dark:text-stone-400">Type:</span> {tech.type}</div>}
                {tech.table && <div><span className="text-stone-500 dark:text-stone-400">Table:</span> {tech.table}</div>}
                {tech.relationships && <div><span className="text-stone-500 dark:text-stone-400">Links:</span> {tech.relationships}</div>}
                {tech.spectrum && <div><span className="text-stone-500 dark:text-stone-400">Spectrum:</span> {tech.spectrum}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
