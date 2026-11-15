'use client'

import { useEffect, useRef } from 'react'
import { createShelf, type Shelf } from './shelf'
import { RECORDS } from './records'

const ICON = (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 1.5h5.5L13 5v9.5H4z" />
    <path d="M9.5 1.5V5H13M6.3 8h4.4M6.3 10.2h4.4M6.3 12.4h2.6" />
  </svg>
)

type Props = {
  stageRef: React.RefObject<HTMLDivElement | null>
  heroRef: React.RefObject<HTMLElement | null>
  captionRef: React.RefObject<HTMLDivElement | null>
  cardRef: React.RefObject<HTMLElement | null>
  selected: number
  onToggle: (index: number, trigger: HTMLElement) => void
  onPick: (index: number, trigger: HTMLElement | null) => void
  onStatus: (s: 'ok' | 'nogl') => void
}

export default function ShelfScene({ stageRef, heroRef, captionRef, cardRef, selected, onToggle, onPick, onStatus }: Props) {
  const tagsRef = useRef<HTMLDivElement>(null)
  const shelfRef = useRef<Shelf | null>(null)
  const selRef = useRef(selected)
  const cbRef = useRef({ onPick, onStatus })

  useEffect(() => {
    cbRef.current = { onPick, onStatus }
    selRef.current = selected
  })

  useEffect(() => {
    shelfRef.current?.setSelected(selected)
  }, [selected])

  useEffect(() => {
    const stage = stageRef.current, hero = heroRef.current, tagsHost = tagsRef.current
    if (!stage || !hero || !tagsHost) return
    /* each mount owns its own canvas so a disposed WebGL context is never reused (StrictMode double mount) */
    const canvas = document.createElement('canvas')
    canvas.className = 'gl'
    canvas.setAttribute('aria-hidden', 'true')
    stage.insertBefore(canvas, stage.querySelector('.vig') ?? tagsHost)
    const tagEls = Array.from(tagsHost.querySelectorAll<HTMLElement>('.tag'))
    let shelf: Shelf | null = null
    try {
      shelf = createShelf({
        canvas, stage, hero, tagEls,
        caption: captionRef.current,
        card: cardRef.current,
        reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
        coarse: matchMedia('(pointer: coarse)').matches,
        onPick: i => cbRef.current.onPick(i, i >= 0 ? tagEls[i] ?? null : null),
        onStatus: s => cbRef.current.onStatus(s),
      })
    } catch (err) {
      console.warn('shelf scene failed, using fallback', err)
      cbRef.current.onStatus('nogl')
    }
    if (!shelf) { canvas.remove(); return }
    shelfRef.current = shelf
    shelf.setSelected(selRef.current)
    return () => {
      shelf?.dispose()
      shelfRef.current = null
      canvas.remove()
    }
  }, [stageRef, heroRef, captionRef, cardRef])

  return (
    <>
      <div className="tags" ref={tagsRef}>
        {RECORDS.map((o, i) => (
          <button
            key={o.no}
            type="button"
            className="tag"
            aria-pressed={selected === i}
            aria-label={`Read record: ${o.t}`}
            title={`Read record: ${o.t}`}
            onClick={e => onToggle(i, e.currentTarget)}
          >
            <span className="ic">{ICON}</span>
          </button>
        ))}
      </div>
    </>
  )
}
