'use client'

import { useCallback, useEffect, useRef } from 'react'
import { CORE } from '../_gl/core'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * v38's aisle, regraded to the live Vitrine palette: stone-950 in the distance,
 * warm lamps rather than the cold ones, and stone-toned racking. Amber stays
 * where the site puts it — on the type, not in the render.
 */
const FRAG = `${CORE}
float baseY(float id){
  if (id < 0.5) return 0.155;
  if (id < 1.5) return 0.205;
  if (id < 2.5) return 0.157;
  return 0.111;
}

const float BAY = 2.4;

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);

  float bay = floor(p.z / BAY + 0.5);

  vec3 r = p;
  r.x = abs(r.x) - 2.35;
  r.z = p.z - bay * BAY;

  vec3 up = r; up.z = abs(up.z) - 1.16;
  float uprights = sdBox(up, vec3(0.055, 2.1, 0.055));
  vec3 shv = r; shv.y = mod(p.y + 0.55, 1.15) - 0.575;
  float shelves = sdBox(shv, vec3(0.62, 0.026, 1.16));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  // One object per bay: which shape, which side, which shelf, all from the bay
  // index. Deterministic, so nothing shimmers as the camera travels.
  float h    = hash2(vec2(bay, 1.0));
  float id   = floor(hash2(vec2(bay, 7.0)) * 3.999);
  float side = h < 0.5 ? -1.0 : 1.0;
  float lvl  = (fract(h * 4.0) < 0.5 ? 1.201 : 2.351) + baseY(id);

  vec3 q = p - vec3(side * 2.35, lvl, bay * BAY);
  q.xz = rot(hash2(vec2(bay, 3.0)) * 6.2831) * q.xz;
  float obj = shapeAt(q, id);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

/* Warm tungsten, the colour the site's amber implies without actually being
   amber — a #f59e0b light source would turn the whole aisle orange. */
vec3 LAMP = vec3(1.00, 0.895, 0.735);
/* stone-950 (#0c0a09) in linear, so the far end of the aisle fades into exactly
   the page background rather than into a neutral black. */
vec3 STONE950 = vec3(0.0033, 0.0027, 0.0024);

vec3 shade(vec3 p, vec3 n, vec3 rd, float m, float bounce){
  vec3 alb; float rough; float f0;
  if (m < 1.5)      { alb = vec3(0.105, 0.098, 0.090); rough = 0.28; f0 = 0.05; }  // aisle floor
  else if (m < 3.5) { alb = vec3(0.28,  0.265, 0.245); rough = 0.30; f0 = 0.10; }  // racking
  else              { alb = vec3(0.64,  0.62,  0.575); rough = 0.24; f0 = 0.09; }  // objects

  // Lamps every other bay, so the aisle runs pool, dark, pool, dark.
  vec3  lp  = vec3(0.0, 2.85, floor(p.z / (BAY * 2.0) + 0.5) * BAY * 2.0);
  vec3  lv  = lp - p;
  float d2  = dot(lv, lv);
  float dl  = sqrt(d2);
  vec3  ld  = lv / dl;
  float att = 1.0 / max(d2, 0.25);
  float sh  = bounce > 0.5 ? 1.0 : penumbra(p + n * 0.006, ld, 0.06, dl - 0.03);
  float occ = bounce > 0.5 ? 1.0 : ao(p, n);

  vec3 col = alb * LAMP * (clamp(dot(n, ld), 0.0, 1.0) * sh * att * 5.4);
  col += satinSpec(n, rd, ld, LAMP, rough, f0) * sh * att * 14.0;

  col += alb * vec3(0.017, 0.015, 0.013) * occ;
  col += envSheen(n, rd, vec3(0.060, 0.055, 0.048), vec3(0.015, 0.013, 0.011), f0)
         * mix(0.20, 0.85, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;

  // On a phone the copy owns the bottom third, so the vanishing point is lifted
  // clear of it and the lens opened up to keep both walls of racking in frame.
  vec2 suv = wide ? uv : uv - vec2(0.0, 0.13);
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.35 : 1.00);

  vec2 hit = march(uCam, rd);
  vec3 col = STONE950;

  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y, 0.0);

    if (hit.y < 1.5) {
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      vec3 rc = h2.x > 12.0 ? STONE950 : shade(q, normal(q), rr, h2.y, 1.0);
      col += rc * fresnel(n, rd, 0.05) * exp(-h2.x * 0.30);
    }

    // The aisle has to run out of light, not out of geometry — and it runs out
    // into the page colour, so the canvas edge never shows.
    col = mix(STONE950, col, exp(-hit.x * 0.085));
  }

  col = gradeRT(col, 1.22, 1.14);
  col *= 1.0 - 0.13 * length(uv * vec2(0.72, 1.0));
  gl_FragColor = vec4(grain(col, 0.004), 1.0);
}
`

const START_Z = 5.0
const TRAVEL = 46.0
/** Bay spacing in the shader — the counter has to agree with the geometry. */
const BAY = 2.4

export default function Scene({
  progressRef,
  counterRef,
}: {
  progressRef: React.RefObject<number>
  counterRef: React.RefObject<HTMLSpanElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ z: START_Z, shown: -1 })

  // Reduced motion still travels, it just does not ease toward the target.
  const ease = reduced ? 1 : 0.08

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      const want = START_Z - progressRef.current * TRAVEL
      st.z += (want - st.z) * ease

      // Counts the bays you have actually gone past — a scroll odometer, not a
      // claim about anybody's collection.
      const passed = Math.max(0, Math.round((START_Z - st.z) / BAY)) * 31 + 14
      if (passed !== st.shown && counterRef.current) {
        st.shown = passed
        counterRef.current.textContent = passed.toLocaleString('en-GB')
      }

      return {
        uTime: t,
        uCam: [0, 1.62, st.z],
        uTarget: [0, 1.34, st.z - 6.0],
        uLight: [0, 2.85, st.z],
        uP: [0, 0, 0, 0],
      }
    },
    [ease, progressRef, counterRef]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 0.92)

  useEffect(() => {
    if (counterRef.current) counterRef.current.textContent = '14'
  }, [counterRef])

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(46% 40% at 50% 34%, #3f382c 0%, #0c0a09 76%)' }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="An aisle of storage racking receding into the dark, an object in every bay"
    />
  )
}
