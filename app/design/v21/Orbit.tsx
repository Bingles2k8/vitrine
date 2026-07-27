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
  float plinth = sdBox(p - vec3(0.0, 0.42, 0.0), vec3(0.44, 0.42, 0.44)) - 0.02;
                                        if (plinth < res.x) res = vec2(plinth, 3.0);

  float lift = uP.y;
  vec3 q = p - vec3(0.0, 1.06 + lift * 0.36, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);         if (obj    < res.x) res = vec2(obj, 4.0);

  // the case lifts away like a bell jar while you inspect
  float cage = sdFrame(p - vec3(0.0, 1.10 + lift * 1.9, 0.0), vec3(0.38, 0.32, 0.38), 0.009);
                                        if (cage   < res.x) res = vec2(cage, 5.0);
  return res;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, vec3(0.0, 1.02, 0.0), uv, uP.w);
  gl_FragColor = vec4(render(uCam, rd, uv), 1.0);
}
`

const OBJECTS = ['Rangefinder camera', 'Redware vase', 'Wristwatch', 'Record, 7-inch']

export default function Orbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [lifted, setLifted] = useState(false)
  const [shape, setShape] = useState(0)

  const s = useRef({
    theta: 0.42, phi: 0.30, radius: 5.2,
    tTheta: 0.42, tPhi: 0.30, tRadius: 5.2,
    lift: 0, spin: 0,
    drag: null as null | { x: number; y: number; th: number; ph: number; moved: number },
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      const k = reduced ? 1 : 0.09
      st.theta += (st.tTheta - st.theta) * k
      st.phi += (st.tPhi - st.phi) * k
      st.radius += (st.tRadius - st.radius) * k
      const targetLift = lifted ? 1 : 0
      st.lift += (targetLift - st.lift) * (reduced ? 1 : 0.07)
      st.spin += reduced ? 0 : lifted ? 0.016 : 0.004

      const cy = 1.02 + Math.sin(st.phi) * st.radius * 0.42
      const r = Math.cos(st.phi) * st.radius

      // The lamp orbits with the camera, a little off to one side, so the
      // object stays lit from a flattering angle wherever you drag to.
      const la = st.theta + 0.75
      return {
        uTime: t,
        uCam: [Math.sin(st.theta) * r, cy, Math.cos(st.theta) * r],
        uTarget: [0, 1.0, 0],
        uLight: [Math.sin(la) * 2.1, 3.5, Math.cos(la) * 2.1],
        uP: [shape, st.lift, st.spin, 1.5],
        uQ: [0.12, 1.3, 1, 0],
      }
    },
    [lifted, shape, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) return <div className="absolute inset-0" style={FALLBACK_STYLE} />

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={e => {
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          s.current.drag = { x: e.clientX, y: e.clientY, th: s.current.tTheta, ph: s.current.tPhi, moved: 0 }
        }}
        onPointerMove={e => {
          const d = s.current.drag
          if (!d) return
          const dx = e.clientX - d.x
          const dy = e.clientY - d.y
          d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy))
          s.current.tTheta = d.th - dx * 0.006
          s.current.tPhi = Math.max(-0.15, Math.min(0.75, d.ph + dy * 0.004))
        }}
        onPointerUp={() => {
          const d = s.current.drag
          s.current.drag = null
          if (d && d.moved < 6) setLifted(v => !v)
        }}
        onPointerCancel={() => { s.current.drag = null }}
        onWheel={e => {
          s.current.tRadius = Math.max(2.9, Math.min(5.4, s.current.tRadius + e.deltaY * 0.004))
        }}
        aria-label="Interactive gallery: drag to orbit, click the object to lift the case"
      />

      {/* Controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-auto flex flex-wrap gap-1.5">
            {OBJECTS.map((o, i) => (
              <button
                key={o}
                onClick={() => setShape(i)}
                className={`type-mono border px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  shape === i
                    ? 'border-[#e9b872] bg-[#e9b872] text-black'
                    : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="type-mono flex items-center gap-5 text-[10px] uppercase tracking-[0.16em] text-white/40">
            <span>Drag to orbit</span>
            <span>Scroll to zoom</span>
            <button
              onClick={() => setLifted(v => !v)}
              className="pointer-events-auto text-[#e9b872] underline underline-offset-4 hover:text-white"
            >
              {lifted ? 'Lower the case' : 'Lift the case'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
