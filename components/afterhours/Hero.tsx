'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { RECORDS } from './records'

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

/* start fetching the three.js chunk as soon as this module runs in the browser, not after hydration */
const loadScene = () => import('./ShelfScene')
if (typeof window !== 'undefined') loadScene()
const ShelfScene = dynamic(loadScene, { ssr: false })

type Status = 'loading' | 'ok' | 'nogl'

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [sel, setSel] = useState(-1)
  const [status, setStatus] = useState<Status>('loading')
  const selRef = useRef(-1)
  const lastBtn = useRef<HTMLElement | null>(null)
  const pending = useRef<'trigger' | 'heading' | null>(null)

  const select = useCallback((i: number, how: 'trigger' | 'heading' | null) => {
    selRef.current = i
    pending.current = how
    setSel(i)
  }, [])

  useEffect(() => {
    const how = pending.current
    pending.current = null
    if (sel > -1 && how === 'heading') titleRef.current?.focus({ preventScroll: true })
    else if (sel === -1 && how === 'trigger') lastBtn.current?.focus({ preventScroll: true })
  }, [sel])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || selRef.current < 0) return
      const a = document.activeElement
      if (a && stageRef.current?.contains(a)) select(-1, 'trigger')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [select])

  const toggle = (i: number, el: HTMLElement) => {
    lastBtn.current = el
    select(selRef.current === i ? -1 : i, 'trigger')
  }
  const handlePick = useCallback((i: number, el: HTMLElement | null) => {
    if (i < 0) { if (selRef.current > -1) select(-1, null); return }
    lastBtn.current = el
    select(selRef.current === i ? -1 : i, 'heading')
  }, [select])
  const onStatus = useCallback((s: 'ok' | 'nogl') => setStatus(s), [])

  const o = sel > -1 ? RECORDS[sel] : null
  const cls = 'stage' + (status === 'ok' ? ' ok' : status === 'nogl' ? ' nogl' : '') + (o ? ' has-card' : '')

  return (
    <header className="hero" id="hero" ref={heroRef}>
      <div className={cls} id="stage" ref={stageRef}>
        <div className="fallback" aria-hidden="true">
          <div className="sh" style={{ top: '42%' }} /><div className="sh" style={{ top: '68%' }} /><div className="sh" style={{ top: '94%' }} />
          <div className="it" style={{ left: '52%', top: '26%', width: 52, height: '16%' }} />
          <div className="it" style={{ left: '62%', top: '30%', width: 40, height: '12%' }} />
          <div className="it" style={{ left: '74%', top: '22%', width: 64, height: '20%' }} />
          <div className="it" style={{ left: '58%', top: '52%', width: 70, height: '16%' }} />
          <div className="it" style={{ left: '80%', top: '56%', width: 44, height: '12%' }} />
        </div>
        <SceneBoundary onError={() => setStatus('nogl')}>
            <ShelfScene
              stageRef={stageRef}
              heroRef={heroRef}
              captionRef={captionRef}
              cardRef={cardRef}
              selected={sel}
              onToggle={toggle}
              onPick={handlePick}
              onStatus={onStatus}
            />
        </SceneBoundary>
        <div className="vig" />

        <div className="flist" role="group" aria-label="Objects on the shelf">
          <p className="lbl">Objects on the shelf</p>
          {RECORDS.map((r, i) => (
            <button
              key={r.no}
              type="button"
              aria-pressed={sel === i}
              onClick={e => toggle(i, e.currentTarget)}
            >
              {r.t}
            </button>
          ))}
        </div>

        <aside className="card" ref={cardRef} role="region" aria-label="Catalogue record" hidden={!o}>
          <div className="top">
            <span>{o ? 'Record' : ''}</span>
            <button className="x" type="button" onClick={() => select(-1, 'trigger')}>Close</button>
          </div>
          <h3 ref={titleRef} tabIndex={-1}>{o?.t}</h3>
          {o && (
            <>
              <dl>
                <dt>Object no.</dt><dd>{o.no}</dd>
                <dt>Date</dt><dd>{o.d}</dd>
                <dt>Material</dt><dd>{o.m}</dd>
                <dt>Location</dt><dd>{o.l}</dd>
                <dt>Condition</dt><dd>{o.c}</dd>
                <dt>Value</dt><dd className="val">{o.v}</dd>
              </dl>
              <p className="note">{o.n}</p>
            </>
          )}
        </aside>

        <div className="heroin"><div className="wrap"><div className="blk" ref={captionRef}>
          <h1>Every object, <em>in its place.</em></h1>
          <p className="sub">Collection management for museums and private collectors, with a public website built in.</p>
          <div className="ctas">
            <Link className="btn solid" href="/signup">Start free</Link>
            <a className="btn line" href="#pricing">See pricing</a>
          </div>
        </div></div></div>
      </div>
    </header>
  )
}
