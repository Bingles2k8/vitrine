'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { PRELUDE } from '../_gl/scene'
import { FALLBACK_STYLE, useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

const FRAG = `${PRELUDE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  // enclosed room, so orbiting never reveals the edge of a floating wall
  float room = -sdBox(p - vec3(0.0, 3.0, 0.0), vec3(6.0, 3.0, 6.0));
  if (room < res.x) res = vec2(room, 2.0);

  float plinth = sdBox(p - vec3(0.0, 0.42 - uP.x, 0.0), vec3(0.44, 0.42, 0.44)) - 0.02;
  if (plinth < res.x) res = vec2(plinth, 3.0);

  vec3 q = p - vec3(0.0, 1.06 + uP.y, 0.0);
  q.xz = rot(uP.w) * q.xz;
  float obj = shapeAt(q, 0.0);
  if (obj < res.x) res = vec2(obj, 4.0);

  float cage = sdFrame(p - vec3(0.0, 1.10 + uP.z, 0.0), vec3(0.38, 0.32, 0.38), 0.009);
  if (cage < res.x) res = vec2(cage, 5.0);

  return res;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, vec3(0.42, 0.98, 0.0), uv, 1.5);
  gl_FragColor = vec4(render(uCam, rd, uv), 1.0);
}
`

const STAGES = [
  { k: 'Empty', t: 'An unlit room, and something you own in a box somewhere.' },
  { k: 'The plinth', t: 'Give it somewhere to stand.' },
  { k: 'The object', t: 'Photograph it, date it, price it, place it.' },
  { k: 'The case', t: 'Then put the glass on and let people look.' },
]

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const ease = (v: number) => 1 - Math.pow(1 - v, 3)

export default function Assemble() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [stage, setStage] = useState(0)

  const onFrame = useCallback(
    (t: number) => {
      const wrap = wrapRef.current
      let p = 0
      if (wrap) {
        const r = wrap.getBoundingClientRect()
        const total = r.height - window.innerHeight
        p = total > 0 ? clamp01(-r.top / total) : 0
      }
      if (reduced) p = 1

      const lights = 0.12 + 1.05 * ease(seg(p, 0.02, 0.28))
      const plinth = (1 - ease(seg(p, 0.2, 0.46))) * 1.05
      const object = (1 - ease(seg(p, 0.44, 0.72))) * 2.4
      const cage = (1 - ease(seg(p, 0.7, 0.96))) * 2.8
      const dolly = 5.4 - ease(seg(p, 0.0, 1.0)) * 1.5

      const next = p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.72 ? 2 : 3
      setStage(s => (s === next ? s : next))

      return {
        uTime: t,
        uCam: [0.1, 1.28, dolly],
        uTarget: [0, 1.0, 0.35],
        uLight: [1.05, 3.5, 1.55],
        uP: [plinth, object, cage, t * 0.22],
        uQ: [0.16, lights, 1, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  return (
    <div ref={wrapRef} style={{ height: reduced ? '100vh' : '420vh' }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {failed ? (
          <div className="absolute inset-0" style={FALLBACK_STYLE} />
        ) : (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
        )}

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-didone text-[22px] tracking-[0.04em] text-white">Vitrine</Link>
            <Link
              href="/signup"
              className="type-mono border border-[#e9b872]/50 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-[#e9b872] hover:bg-[#e9b872] hover:text-black"
            >
              Start free
            </Link>
          </header>

          <div className="flex flex-1 items-center px-6 sm:px-10">
            <div className="max-w-lg">
              <p className="type-mono mb-5 text-[11px] uppercase tracking-[0.3em] text-[#e9b872]">
                {STAGES[stage].k}
              </p>
              <h1
                className="type-didone text-[2.6rem] leading-[0.95] tracking-[-0.02em] sm:text-[4.2rem]"
                style={{ textShadow: '0 6px 44px rgba(0,0,0,0.9)' }}
              >
                {STAGES[stage].t}
              </h1>

              {stage >= 3 && (
                <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-5">
                  <Link
                    href="/signup"
                    className="type-mono bg-[#e9b872] px-9 py-4 text-[12px] uppercase tracking-[0.18em] text-[#0a0a0c] hover:bg-[#f5cd93]"
                  >
                    Catalogue your first object
                  </Link>
                  <Link
                    href="/discover"
                    className="type-mono text-[12px] uppercase tracking-[0.18em] text-white/55 underline underline-offset-[8px] hover:text-white"
                  >
                    See real collections
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-6 pb-8 sm:px-10">
            <div className="flex gap-1.5">
              {STAGES.map((st, i) => (
                <span key={st.k} className={`h-[3px] w-10 ${i <= stage ? 'bg-[#e9b872]' : 'bg-white/15'}`} />
              ))}
            </div>
            <p className="type-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
              {stage < 3 ? 'Keep scrolling ↓' : '100 objects free · no card'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
