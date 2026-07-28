'use client'

import { useCallback, useRef, useState } from 'react'
import { CORE } from '../_gl/core'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * A product studio, not a museum: seamless cyclorama sweep, two big softboxes,
 * and the object floating in colour. High key, no plinth, no glass.
 */
const FRAG = `${CORE}
vec2 map(vec3 p){
  // cyclorama — floor curving up into the back wall
  float floorP = p.y;
  float backP  = p.z + 3.4;
  vec2 res = vec2(smin(floorP, backP, 1.5), 1.0);

  vec3 q = p - vec3(0.0, 1.12, 0.0);
  q.xz = rot(uP.z) * q.xz;
  q.yz = rot(uP.w) * q.yz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 KEY  = vec3(1.0, 0.99, 0.97);
vec3 FILL = vec3(0.86, 0.90, 1.0);

/* Big soft sources: a wide diffuse term plus a broad, low-power highlight. */
vec3 softLight(vec3 n, vec3 rd, vec3 lp, vec3 tint, float power, float size){
  vec3 ld = normalize(lp - n * 0.0 - vec3(0.0));
  ld = normalize(lp);
  float dif = clamp(dot(n, ld) * 0.5 + 0.5, 0.0, 1.0);
  vec3 h = normalize(ld - rd);
  float sp = pow(clamp(dot(n, h), 0.0, 1.0), size);
  return tint * (dif * power) + tint * sp * 0.5;
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.92);
  float gloss = 26.0;
  if (m > 3.5) {
    alb = vec3(uQ.x, uQ.y, uQ.z);            // the object carries the colour
    gloss = 90.0;
  }

  float occ = ao(p, n);
  float sh  = softShadow(p + n * 0.008, normalize(uLight), 3.0);

  vec3 col = alb * softLight(n, rd, uLight, KEY, 0.95, gloss) * mix(0.55, 1.0, sh);
  col += alb * softLight(n, rd, vec3(-2.2, 1.4, 2.0), FILL, 0.38, gloss * 0.6);
  col *= mix(0.72, 1.0, occ);

  // contact shadow so the object sits in the space
  if (m < 1.5) {
    float d = length(p.xz) ;
    col *= mix(0.55, 1.0, clamp((d - 0.28) * 1.5, 0.0, 1.0));
  }
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.75);

  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.97) : shade(uCam + rd * hit.x, rd, hit.y);

  col = 1.0 - exp(-col * 1.7);
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(grain(col, 0.008), 1.0);
}
`

const SWATCHES: [string, [number, number, number]][] = [
  ['Vermilion', [0.86, 0.22, 0.10]],
  ['Cobalt', [0.16, 0.30, 0.80]],
  ['Chrome', [0.72, 0.74, 0.78]],
  ['Moss', [0.24, 0.42, 0.26]],
]

const SHAPES = ['Camera', 'Vase', 'Watch', 'Record']

export default function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [colour, setColour] = useState(0)
  const [shape, setShape] = useState(1)

  const s = useRef({
    yaw: 0.5, pitch: 0.1,
    drag: null as null | { x: number; y: number; yaw: number; pitch: number },
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!st.drag && !reduced) st.yaw += 0.005
      const c = SWATCHES[colour][1]
      return {
        uTime: t,
        uCam: [0, 1.22, 2.8],
        uTarget: [0, 1.05, 0],
        uLight: [1.5, 2.2, 1.8],
        uP: [shape, 0, st.yaw, st.pitch],
        uQ: [c[0], c[1], c[2], 0],
      }
    },
    [colour, shape, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#fff,#e9e9e6)' }} />
  }

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
          const d = s.current.drag
          if (!d) return
          s.current.yaw = d.yaw + (e.clientX - d.x) * 0.012
          s.current.pitch = Math.max(-0.6, Math.min(0.6, d.pitch + (e.clientY - d.y) * 0.007))
        }}
        onPointerUp={() => { s.current.drag = null }}
        onPointerCancel={() => { s.current.drag = null }}
        aria-label="A product studio; drag to turn the object"
      />

      <div className="absolute bottom-6 left-6 z-20 flex flex-col items-start gap-2.5 sm:left-10">
        <div className="flex gap-1.5">
          {SHAPES.map((o, i) => (
            <button
              key={o}
              onClick={() => setShape(i)}
              className={`type-grotesk px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
                shape === i ? 'bg-black text-white' : 'bg-black/[0.06] text-black/50 hover:bg-black/10'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {SWATCHES.map(([name, c], i) => (
            <button
              key={name}
              onClick={() => setColour(i)}
              aria-label={name}
              className={`h-6 w-6 rounded-full transition-transform ${colour === i ? 'scale-110 ring-2 ring-black ring-offset-2' : 'hover:scale-105'}`}
              style={{ background: `rgb(${c.map(v => Math.round(v * 255)).join(',')})` }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
