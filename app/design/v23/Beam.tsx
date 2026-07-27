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

  for (int i = 0; i < 4; i++){
    float fi = float(i) - 1.5;
    vec3  c  = vec3(fi * 1.55, 0.0, 0.0);

    float pl = sdBox(p - c - vec3(0.0, 0.40, 0.0), vec3(0.34, 0.40, 0.34)) - 0.02;
    if (pl < res.x) res = vec2(pl, 3.0);

    vec3 q = p - c - vec3(0.0, 1.00, 0.0);
    q.xz = rot(uTime * 0.16 + fi * 1.7) * q.xz;
    float ob = shapeAt(q, mod(float(i), 4.0));
    if (ob < res.x) res = vec2(ob, 4.0);
  }
  return res;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(0.0, 1.45, 4.6);
  vec3 rd = camRay(ro, vec3(0.0, 0.85, 0.0), uv, 1.45);
  gl_FragColor = vec4(render(ro, rd, uv), 1.0);
}
`

export default function Beam() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [locked, setLocked] = useState(false)
  const [width, setWidth] = useState(0.35)

  const s = useRef({ tx: 0, ty: 0, x: 0, y: 0 })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      const k = reduced ? 1 : 0.1
      st.x += (st.tx - st.x) * k
      st.y += (st.ty - st.y) * k

      // Aim point sweeps across the plinth row; the lamp sits above and behind.
      const aimX = st.x * 2.7
      const aimZ = st.y * 1.2
      return {
        uTime: t,
        uCam: [0, 1.45, 4.6],
        uTarget: [aimX, 0.95, aimZ],
        uLight: [aimX * 0.75, 3.4, aimZ + 2.0],
        uP: [0, 0, 0, 0],
        uQ: [width, 1.25, 1, 0],
      }
    },
    [width, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) return <div className="absolute inset-0" style={FALLBACK_STYLE} />

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ cursor: locked ? 'default' : 'crosshair' }}
        onPointerMove={e => {
          if (locked) return
          const r = (e.target as HTMLElement).getBoundingClientRect()
          s.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
          s.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2
        }}
        onClick={() => setLocked(v => !v)}
        onWheel={e => setWidth(w => Math.max(0, Math.min(1, w + e.deltaY * 0.0012)))}
        aria-label="A dark gallery lit by a spotlight you aim with the pointer"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-auto flex items-center gap-4">
            <label className="type-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              Beam
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
              className="w-40 accent-[#e9b872]"
              aria-label="Beam width"
            />
          </div>
          <div className="type-mono flex items-center gap-5 text-[10px] uppercase tracking-[0.16em] text-white/40">
            <span>Move to aim</span>
            <span className="hidden sm:inline">Scroll to widen</span>
            <button
              onClick={() => setLocked(v => !v)}
              className="pointer-events-auto text-[#e9b872] underline underline-offset-4 hover:text-white"
            >
              {locked ? 'Release the light' : 'Lock the light'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
