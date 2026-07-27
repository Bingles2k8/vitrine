'use client'

import { useCallback, useRef, useState } from 'react'
import { PRELUDE } from '../_gl/scene'
import { FALLBACK_STYLE, useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

const FRAG = `${PRELUDE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);

  float walls = min(3.4 - abs(p.x), 4.6 - p.y);        // corridor + ceiling
  if (walls < res.x) res = vec2(walls, 2.0);

  vec3  q    = p;
  float cell = floor((p.z + 2.5) / 5.0);
  q.z = mod(p.z + 2.5, 5.0) - 2.5;

  float plinth = sdBox(q - vec3(0.0, 0.42, 0.0), vec3(0.42, 0.42, 0.42)) - 0.02;
  if (plinth < res.x) res = vec2(plinth, 3.0);

  vec3 o = q - vec3(0.0, 1.06, 0.0);
  o.xz = rot(uTime * 0.18 + cell) * o.xz;
  float obj = shapeAt(o, mod(cell, 4.0));
  if (obj < res.x) res = vec2(obj, 4.0);

  float cage = sdFrame(q - vec3(0.0, 1.10, 0.0), vec3(0.36, 0.31, 0.36), 0.008);
  if (cage < res.x) res = vec2(cage, 5.0);

  return res;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ta = uCam + vec3(uP.x * 0.9, -0.16, -3.0);
  vec3 rd = camRay(uCam, ta, uv, 1.45);
  gl_FragColor = vec4(render(uCam, rd, uv), 1.0);
}
`

const LABELS = ['Rangefinder camera', 'Redware vase', 'Wristwatch', 'Record, 7-inch']

export default function Walk() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [label, setLabel] = useState(LABELS[0])

  const s = useRef({ z: 3.5, steer: 0, tSteer: 0, x: 0, speed: 0.028, boost: false, lastCell: 99 })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!paused && !reduced) st.z -= st.speed * (st.boost ? 2.6 : 1)
      if (st.z < -60) st.z = 3.5

      st.steer += (st.tSteer - st.steer) * 0.05
      st.x += (st.steer * 1.5 - st.x) * 0.04

      // Which plinth are we alongside? Drives the caption.
      const cell = Math.round((st.z - 2.5) / 5)
      if (cell !== st.lastCell) {
        st.lastCell = cell
        const id = ((Math.abs(cell) % 4) + 4) % 4
        setLabel(LABELS[id])
      }

      const pz = cell * 5
      return {
        uTime: t,
        uCam: [st.x, 1.34, st.z],
        uTarget: [0, 1.0, pz],
        uLight: [0.85, 3.5, pz + 1.5],
        uP: [st.steer, 0, 0, 0],
        uQ: [0.28, 1.45, 1, 0],
      }
    },
    [paused, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) return <div className="absolute inset-0" style={FALLBACK_STYLE} />

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-none touch-none"
        onPointerMove={e => {
          const r = (e.target as HTMLElement).getBoundingClientRect()
          s.current.tSteer = ((e.clientX - r.left) / r.width - 0.5) * 2
        }}
        onPointerDown={() => { s.current.boost = true }}
        onPointerUp={() => { s.current.boost = false }}
        onPointerLeave={() => { s.current.boost = false; s.current.tSteer = 0 }}
        aria-label="Walking through a gallery; move the pointer to steer, hold to walk faster"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="type-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Passing</p>
            <p className="type-book mt-1 text-[18px] text-white/90">{label}</p>
          </div>
          <div className="type-mono flex items-center gap-5 text-[10px] uppercase tracking-[0.16em] text-white/40">
            <span>Move to steer</span>
            <span>Hold to walk faster</span>
            <button
              onClick={() => setPaused(p => !p)}
              className="pointer-events-auto text-[#e9b872] underline underline-offset-4 hover:text-white"
            >
              {paused ? 'Walk on' : 'Stop here'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
