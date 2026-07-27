'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../_motion'

const WORDS = ['records', 'cameras', 'watches', 'fossils', 'coins', 'militaria', 'ceramics', 'guitars']

const RECORD: [string, string][] = [
  ['Object', 'Leica M3 rangefinder, chrome'],
  ['Maker', 'Ernst Leitz GmbH, Wetzlar'],
  ['Year', '1954'],
  ['Acquired', '11 Mar 2019 · lot 212 · £620'],
  ['Valuation', '£1,200 · reviewed Jan 2026'],
  ['Condition', 'Excellent · serviced 2024'],
  ['Location', 'Cabinet 2, shelf B'],
  ['Documents', 'Receipt.pdf · Service report.pdf'],
]

/** The noun in the headline changes; the sentence stays true either way. */
export function RotatingWord() {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  const [out, setOut] = useState(false)

  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => {
      setOut(true)
      setTimeout(() => {
        setI(n => (n + 1) % WORDS.length)
        setOut(false)
      }, 320)
    }, 2400)
    return () => clearInterval(t)
  }, [reduced])

  return (
    <span className="relative inline-block align-baseline text-[#d4321a]">
      <span
        className="inline-block transition-all duration-300 ease-out"
        style={{
          transform: out ? 'translateY(-0.32em) rotate(-2deg)' : 'translateY(0) rotate(0deg)',
          opacity: out ? 0 : 1,
          filter: out ? 'blur(6px)' : 'blur(0)',
        }}
      >
        {WORDS[i]}
      </span>
      <span
        aria-hidden
        className="absolute bottom-[0.06em] left-0 h-[0.06em] bg-[#d4321a]/35 transition-all duration-300"
        style={{ width: out ? '0%' : '100%' }}
      />
    </span>
  )
}

/** The record fills itself in, field by field, then starts again. */
export function TypingRecord() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const [complete, setComplete] = useState(false)

  // With reduced motion the record is simply shown filled in.
  const n = reduced ? RECORD.length : step
  const done = reduced ? true : complete

  useEffect(() => {
    if (reduced) return
    let i = 0
    let timer: ReturnType<typeof setTimeout>

    const run = () => {
      if (i <= RECORD.length) {
        setStep(i)
        setComplete(i === RECORD.length)
        i += 1
        timer = setTimeout(run, i === 1 ? 700 : 460)
      } else {
        timer = setTimeout(() => {
          i = 0
          setComplete(false)
          run()
        }, 3200)
      }
    }

    run()
    return () => clearTimeout(timer)
  }, [reduced])

  return (
    <div className="border border-black/15 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]">
      <div className="type-mono flex items-center justify-between border-b border-black/10 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[#8a8378]">
        <span>New object</span>
        <span className={done ? 'text-[#1c7a4a]' : 'text-[#d4321a]'}>
          {done ? 'Saved · published' : 'Cataloguing…'}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border border-black/10 bg-[#f4f2ec] text-2xl">
            📷
          </div>
          <div>
            <div className="type-book text-[19px] leading-tight text-[#111]">
              {n >= 1 ? 'Leica M3 rangefinder' : <span className="text-[#c9c3b7]">Untitled object</span>}
            </div>
            <div className="type-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8378]">
              Object {String(n).padStart(2, '0')} of {RECORD.length} fields
            </div>
          </div>
        </div>

        <dl className="min-h-[268px]">
          {RECORD.map(([k, v], idx) => {
            const shown = idx < n
            return (
              <div
                key={k}
                className="grid grid-cols-3 gap-3 border-t border-black/[0.08] py-2.5 transition-all duration-300"
                style={{
                  opacity: shown ? 1 : 0.25,
                  transform: shown ? 'translateX(0)' : 'translateX(-6px)',
                }}
              >
                <dt className="type-mono text-[9.5px] uppercase tracking-[0.1em] text-[#a09889]">{k}</dt>
                <dd className="col-span-2 text-[13px] leading-relaxed text-[#2a2820]">
                  {shown ? (
                    v
                  ) : (
                    <span className="inline-block h-[0.85em] w-[62%] bg-black/[0.06]" />
                  )}
                  {idx === n - 1 && !done && (
                    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-[#d4321a] motion-safe:animate-pulse" />
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}

/** Counts up once, when it comes into view. */
export function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const [counted, setCounted] = useState(0)
  const v = reduced ? to : counted

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    let raf = 0
    let started = false

    const io = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting || started) return
        started = true
        const t0 = performance.now()
        const dur = 1300
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur)
          const eased = 1 - Math.pow(1 - p, 3)
          setCounted(Math.round(to * eased))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 }
    )

    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, reduced])

  return (
    <span ref={ref}>
      {prefix}
      {v.toLocaleString()}
      {suffix}
    </span>
  )
}
