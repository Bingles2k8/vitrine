'use client'

import { useCallback, useRef, useState } from 'react'
import { CORE } from '../_gl/core'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** Daylit white cube: skylight, hemispheric bounce, no spotlight anywhere. */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 3.2, 0.0), vec3(7.0, 3.2, 7.0));
  if (room < res.x) res = vec2(room, 2.0);

  float plinth = sdBox(p - vec3(1.15, 0.50, 0.0), vec3(0.36, 0.50, 0.36));
  if (plinth < res.x) res = vec2(plinth, 3.0);

  vec3 q = p - vec3(1.15, 1.18, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.90);
  if (m < 1.5)      alb = vec3(0.80);
  else if (m < 2.5) alb = vec3(0.92);
  else if (m < 3.5) alb = vec3(0.95);
  else              alb = vec3(0.40, 0.42, 0.45);

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 5.0);
  float occ = ao(p, n);

  // Skylight above, cool bounce from the floor — no cone, no falloff.
  float hemi = 0.5 + 0.5 * n.y;
  vec3  amb  = mix(vec3(0.72, 0.74, 0.79), vec3(1.0, 1.0, 1.0), hemi);

  vec3 col = alb * amb * occ * 0.92;
  col += alb * vec3(1.0, 0.99, 0.95) * dif * sh * 0.5;

  vec3 h = normalize(ld - rd);
  col += vec3(1.0) * 0.06 * pow(clamp(dot(n, h), 0.0, 1.0), 40.0) * sh;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.5);

  vec2 hit = march(uCam, rd);
  vec3 col;
  if (hit.x > 36.0) {
    col = vec3(0.96);
  } else {
    vec3 p = uCam + rd * hit.x;
    col = shade(p, rd, hit.y);
    if (hit.y < 1.5) {                       // polished concrete, barely
      vec3 n = normal(p);
      vec3 r = reflect(rd, n);
      vec2 h2 = march(p + n * 0.02, r);
      vec3 rc = h2.x > 36.0 ? vec3(0.96) : shade(p + n * 0.02 + r * h2.x, r, h2.y);
      col = mix(col, rc, 0.10);
    }
  }

  col = 1.0 - exp(-col * 1.45);            // high key, no crushed blacks
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.10 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.012), 1.0);
}
`

const OBJECTS = ['Camera', 'Vase', 'Watch', 'Record']

export default function Cube() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [shape, setShape] = useState(1)

  const s = useRef({ mx: 0, my: 0, tx: 0, ty: 0, spin: 0 })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      st.mx += (st.tx - st.mx) * 0.05
      st.my += (st.ty - st.my) * 0.05
      if (!reduced) st.spin += 0.0035
      return {
        uTime: t,
        uCam: [0.15 + st.mx * 0.7, 1.72 + st.my * 0.22, 4.2],
        uTarget: [0.72, 0.92, 0],
        uLight: [1.6, 5.2, 2.2],
        uP: [shape, 0, st.spin, 0],
        uQ: [0, 1, 1, 0],
      }
    },
    [shape, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg,#f6f6f4 0%,#e6e6e2 100%)' }}
      />
    )
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onPointerMove={e => {
          const r = (e.target as HTMLElement).getBoundingClientRect()
          s.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
          s.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2
        }}
        aria-label="A daylit white gallery with an object on a plinth"
      />
      <div className="absolute bottom-8 right-6 z-20 flex gap-1.5 sm:right-10">
        {OBJECTS.map((o, i) => (
          <button
            key={o}
            onClick={() => setShape(i)}
            className={`type-grotesk border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              shape === i
                ? 'border-black bg-black text-white'
                : 'border-black/25 text-black/55 hover:border-black/60 hover:text-black'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  )
}
