'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * A single object held still, lit like a condition photograph. The 3D does
 * almost nothing here on purpose — the record drawn over it is the concept.
 */
const FRAG = `${CORE}
float baseY(float id){
  if (id < 0.5) return 0.155;
  if (id < 1.5) return 0.205;
  if (id < 2.5) return 0.157;
  return 0.111;
}

const float S = 1.65;

vec2 map(vec3 p){
  float sweep = smin(p.y, p.z + 2.4, 1.5);
  vec2 res = vec2(sweep, 1.0);

  float plinth = sdBox(p - vec3(0.0, 0.225, 0.0), vec3(0.50, 0.225, 0.50)) - 0.012;
  if (plinth < res.x) res = vec2(plinth, 2.0);

  vec3 q = p - vec3(0.0, 0.45 + baseY(uP.x) * S, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q / S, uP.x) * S;
  if (obj < res.x) res = vec2(obj, 3.0);
  return res;
}

vec3 KEY = vec3(1.00, 0.99, 0.97);
vec3 SKY = vec3(0.80, 0.81, 0.80);

vec3 keyDir(){ return normalize(vec3(-0.50, 0.82, 0.58)); }

vec3 shade(vec3 p, vec3 n, vec3 rd, float m, float bounce){
  vec3 alb; float rough; float f0;
  if (m < 1.5)      { alb = vec3(0.60, 0.61, 0.60); rough = 0.60; f0 = 0.04; }  // sweep
  else if (m < 2.5) { alb = vec3(0.72, 0.72, 0.71); rough = 0.66; f0 = 0.04; }  // plinth
  else              { alb = vec3(0.34, 0.35, 0.36); rough = 0.20; f0 = 0.10; }  // the object

  vec3 k = keyDir();
  float sh  = bounce > 0.5 ? 1.0 : penumbra(p + n * 0.006, k, 0.16, 7.0);
  float occ = bounce > 0.5 ? 1.0 : ao(p, n);

  vec3 col = alb * KEY * clamp(dot(n, k), 0.0, 1.0) * sh * 0.86;
  col += satinSpec(n, rd, k, KEY, rough, f0) * sh * 1.5;

  float hemi = 0.5 + 0.5 * n.y;
  col += alb * mix(vec3(0.10, 0.11, 0.11), vec3(0.34, 0.36, 0.36), hemi) * occ;
  col += envSheen(n, rd, vec3(0.52, 0.54, 0.55), vec3(0.16, 0.16, 0.16), f0)
         * mix(0.15, 0.65, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;

  // The record is drawn over this in HTML, so the object has to land on a
  // known mark. Hero.tsx uses the same numbers to aim the leader lines.
  vec2 suv = uv - vec2(wide ? 0.30 : 0.0, wide ? 0.02 : 0.30);
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.45 : 0.92);

  vec2 hit = march(uCam, rd);
  vec3 col = SKY;

  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y, 0.0);

    if (hit.y > 2.5) {   // the object alone gets a bounce; the paper is matt
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      vec3 rc = h2.x > 11.0 ? SKY : shade(q, normal(q), rr, h2.y, 1.0);
      col += rc * 0.55 * fresnel(n, rd, 0.06) * exp(-h2.x * 0.40);
    }
  }

  col = gradeRT(col, 1.00, 1.16);
  col *= 1.0 - 0.07 * length(uv * vec2(0.72, 1.0));
  gl_FragColor = vec4(grain(col, 0.003), 1.0);
}
`

function pickShape() {
  try {
    const forced = new URLSearchParams(window.location.search).get('shape')
    if (forced !== null) {
      const n = Number(forced)
      if (Number.isFinite(n)) return ((n % SHAPE_COUNT) + SHAPE_COUNT) % SHAPE_COUNT
    }
  } catch {
    /* no window search params — fall through to random */
  }
  return Math.floor(Math.random() * SHAPE_COUNT)
}

export default function Scene({ onShape }: { onShape: (i: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ spin: 0.55, shape: null as number | null })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (st.shape === null) {
        st.shape = pickShape()
        // Told, not stored in state: the record is written straight into the
        // DOM so picking an object never re-renders the page.
        onShape(st.shape)
      }
      if (!reduced) st.spin += 0.0016
      return {
        uTime: t,
        uCam: [0, 1.05, 3.7],
        uTarget: [0, 0.82, 0],
        uLight: [0, 3, 2],
        uP: [st.shape, 0, st.spin, 0],
      }
    },
    [reduced, onShape]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 1.0)

  if (failed) {
    return (
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#cfd2cf,#a9aeab)' }} />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="A single object on a plinth, lit for a catalogue photograph"
    />
  )
}
