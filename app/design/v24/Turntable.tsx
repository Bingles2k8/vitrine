'use client'

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

  float plinth = sdBox(p - vec3(0.0, 0.40, 0.0), vec3(0.46, 0.40, 0.46)) - 0.02;
  if (plinth < res.x) res = vec2(plinth, 3.0);

  vec3 q = p - vec3(0.0, 1.05, 0.0);
  q.xz = rot(uP.z) * q.xz;
  q.yz = rot(uP.w * 0.5) * q.yz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);

  if (uP.y > 0.5) {
    float cage = sdFrame(p - vec3(0.0, 1.08, 0.0), vec3(0.40, 0.33, 0.40), 0.009);
    if (cage < res.x) res = vec2(cage, 5.0);
  }
  return res;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, vec3(0.30, 0.98, 0.0), uv, 1.6);
  gl_FragColor = vec4(render(uCam, rd, uv), 1.0);
}
`

const OBJECTS = [
  { label: 'Rangefinder camera', meta: 'Ernst Leitz · 1954 · Excellent' },
  { label: 'Redware vase', meta: 'Staffordshire · c.1820 · Good' },
  { label: 'Wristwatch', meta: 'Biel/Bienne · 1966 · Fair' },
  { label: 'Record, 7-inch', meta: 'Parlophone · 1963 · M−' },
]

export default function Turntable() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [shape, setShape] = useState(0)
  const [cased, setCased] = useState(true)
  const [warmth, setWarmth] = useState(1)
  const [brightness, setBrightness] = useState(1)

  const s = useRef({
    yaw: 0.4, pitch: 0, spin: 0.004,
    drag: null as null | { x: number; y: number; yaw: number; pitch: number },
    mx: 0, tmx: 0,
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!st.drag && !reduced) st.yaw += st.spin
      st.mx += (st.tmx - st.mx) * 0.06

      return {
        uTime: t,
        uCam: [0.30 + st.mx * 0.5, 1.30, 3.6],
        uTarget: [0, 1.0, 0.4],
        uLight: [1.0, 3.4, 1.6],
        uP: [shape, cased ? 1 : 0, st.yaw, st.pitch],
        uQ: [0.15, brightness, warmth, 0],
      }
    },
    [shape, cased, warmth, brightness, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) return <div className="absolute inset-0" style={FALLBACK_STYLE} />

  const current = OBJECTS[shape]

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={e => {
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          s.current.drag = { x: e.clientX, y: e.clientY, yaw: s.current.yaw, pitch: s.current.pitch }
        }}
        onPointerMove={e => {
          const r = (e.target as HTMLElement).getBoundingClientRect()
          s.current.tmx = ((e.clientX - r.left) / r.width - 0.5) * 2
          const d = s.current.drag
          if (!d) return
          s.current.yaw = d.yaw + (e.clientX - d.x) * 0.011
          s.current.pitch = Math.max(-0.7, Math.min(0.7, d.pitch + (e.clientY - d.y) * 0.006))
        }}
        onPointerUp={() => { s.current.drag = null }}
        onPointerCancel={() => { s.current.drag = null }}
        aria-label="A turntable: drag to rotate the object, and change the case and lighting"
      />

      {/* Wall label */}
      <div className="pointer-events-none absolute right-6 top-28 z-20 hidden max-w-[240px] border-l border-white/20 pl-5 sm:block">
        <p className="type-mono text-[10px] uppercase tracking-[0.2em] text-white/35">On the plinth</p>
        <p className="type-book mt-2 text-[19px] leading-snug text-white">{current.label}</p>
        <p className="type-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[#e9b872]/80">{current.meta}</p>
      </div>

      {/* Configurator */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/45 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {OBJECTS.map((o, i) => (
              <button
                key={o.label}
                onClick={() => setShape(i)}
                className={`type-mono border px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  shape === i
                    ? 'border-[#e9b872] bg-[#e9b872] text-black'
                    : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setCased(c => !c)}
              className={`type-mono border px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                cased ? 'border-[#e9b872]/60 text-[#e9b872]' : 'border-white/20 text-white/50 hover:text-white'
              }`}
            >
              Case {cased ? 'on' : 'off'}
            </button>

            <label className="flex items-center gap-3">
              <span className="type-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Warmth</span>
              <input
                type="range" min={0} max={1} step={0.01} value={warmth}
                onChange={e => setWarmth(Number(e.target.value))}
                className="w-24 accent-[#e9b872]" aria-label="Light warmth"
              />
            </label>

            <label className="flex items-center gap-3">
              <span className="type-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Lights</span>
              <input
                type="range" min={0.15} max={1.8} step={0.01} value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
                className="w-24 accent-[#e9b872]" aria-label="Light brightness"
              />
            </label>

            <span className="type-mono hidden text-[10px] uppercase tracking-[0.14em] text-white/30 xl:inline">
              Drag the object to turn it
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
