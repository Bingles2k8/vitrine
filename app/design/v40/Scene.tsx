'use client'

import { useCallback, useEffect, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * A dark room, one hard lamp, and an empty plinth. The object only exists once
 * the visitor asks for it — `uP.w` drives it up out of nothing.
 */
const FRAG = `${CORE}
float baseY(float id){
  if (id < 0.5) return 0.155;
  if (id < 1.5) return 0.205;
  if (id < 2.5) return 0.157;
  return 0.111;
}

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.7, -1.0), vec3(6.5, 2.7, 7.5));
  if (room < res.x) res = vec2(room, 2.0);

  float plinth = sdBox(p - vec3(0.0, 0.50, 0.0), vec3(0.40, 0.50, 0.40)) - 0.01;
  if (plinth < res.x) res = vec2(plinth, 3.0);

  float rev = uP.w;
  if (rev > 0.002) {
    float sc = 1.55 * rev;
    vec3 q = p - vec3(0.0, 1.005 + baseY(uP.x) * sc + (1.0 - rev) * 0.30, 0.0);
    q.xz = rot(uP.z) * q.xz;
    float obj = shapeAt(q / sc, uP.x) * sc;
    if (obj < res.x) res = vec2(obj, 4.0);
  }
  return res;
}

vec3 LAMP = vec3(1.00, 0.95, 0.86);
vec3 VOID = vec3(0.006, 0.007, 0.009);

/* How much of the lamp's cone reaches a point. The edge softens with distance
   below the lamp, which is what a real shade does. */
float spotAt(vec3 p){
  float axial = max(uLight.y - p.y, 0.001);
  float rad   = length(p.xz - uLight.xz);
  return 1.0 - smoothstep(0.30 + axial * 0.15, 0.56 + axial * 0.26, rad);
}

vec3 shade(vec3 p, vec3 n, vec3 rd, float m){
  vec3 alb; float rough; float f0;
  if (m < 1.5)      { alb = vec3(0.11, 0.11, 0.12); rough = 0.30; f0 = 0.05; }  // floor
  else if (m < 2.5) { alb = vec3(0.13, 0.14, 0.15); rough = 0.90; f0 = 0.03; }  // walls
  else if (m < 3.5) { alb = vec3(0.60, 0.60, 0.58); rough = 0.72; f0 = 0.04; }  // plinth
  else              { alb = vec3(0.70, 0.69, 0.66); rough = 0.22; f0 = 0.09; }  // the object

  vec3  lv  = uLight - p;
  float d2  = dot(lv, lv);
  float dl  = sqrt(d2);
  vec3  ld  = lv / dl;
  float att = 1.0 / max(d2, 0.30);
  float sh  = penumbra(p + n * 0.006, ld, 0.035, dl - 0.03);
  float occ = ao(p, n);
  float sp  = spotAt(p);

  vec3 col = alb * LAMP * (clamp(dot(n, ld), 0.0, 1.0) * sh * att * sp * 4.0);
  col += satinSpec(n, rd, ld, LAMP, rough, f0) * sh * att * sp * 11.0;

  // The room outside the cone is lit only by what bounces off the plinth.
  col += alb * vec3(0.016, 0.016, 0.018) * occ;
  col += envSheen(n, rd, vec3(0.045, 0.048, 0.055), vec3(0.012, 0.012, 0.014), f0)
         * mix(0.20, 0.80, 1.0 - rough) * occ;
  return col;
}

/* Dust in the beam. Sampled along the camera ray rather than traced properly —
   the cone is analytic, so this costs 26 cheap steps and no marching. */
float beam(vec3 ro, vec3 rd, float tmax){
  float acc = 0.0;
  // Jitter where each pixel takes its samples. Without it 26 fixed steps put a
  // visible slab of cubes through the beam; with it the same 26 steps read as
  // fine dust, which is what they are meant to be.
  float jit = hash2(gl_FragCoord.xy);
  for (int i = 0; i < 26; i++){
    float t = 0.30 + (float(i) + jit) * 0.185;
    if (t > tmax) break;
    vec3 sp = ro + rd * t;
    float axial = uLight.y - sp.y;
    if (axial > 0.02) {
      float rad  = length(sp.xz - uLight.xz);
      float cone = 1.0 - smoothstep(0.22 + axial * 0.14, 0.50 + axial * 0.26, rad);
      float mote = 0.82 + 0.36 * hash(floor(sp * 44.0 + vec3(0.0, uTime * 1.1, 0.0)));
      acc += cone * exp(-axial * 0.42) * mote;
    }
  }
  return acc * 0.020;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;
  vec2 suv = uv - vec2(wide ? 0.26 : 0.0, wide ? 0.04 : 0.24);
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.45 : 1.05);

  vec2 hit = march(uCam, rd);
  vec3 col = VOID;

  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y);

    if (hit.y < 1.5) {         // only the floor is polished enough to bounce
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      vec3 rc = h2.x > 12.0 ? VOID : shade(q, normal(q), rr, h2.y);
      col += rc * fresnel(n, rd, 0.05) * exp(-h2.x * 0.34);
    }
  }

  col += LAMP * beam(uCam, rd, min(hit.x, 36.0));

  col = gradeRT(col, 1.05, 1.16);
  col *= 1.0 - 0.14 * length(uv * vec2(0.72, 1.0));
  gl_FragColor = vec4(grain(col, 0.005), 1.0);
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

export default function Scene({ revealed }: { revealed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ rev: 0, from: 0, target: 0, since: 0, spin: 0.5, shape: null as number | null })

  // Mirrored into a ref so the render loop can read it without restarting.
  useEffect(() => {
    const st = s.current
    st.from = st.rev
    st.target = revealed ? 1 : 0
    st.since = performance.now()
  }, [revealed])

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (st.shape === null) st.shape = pickShape()
      // Timed, not per-frame: a frame-rate-dependent ease means the object
      // crawls into place on exactly the slow devices that can least afford it.
      const k = reduced ? 1 : Math.min((performance.now() - st.since) / 850, 1)
      st.rev = st.from + (st.target - st.from) * (k * k * (3 - 2 * k))
      if (!reduced) st.spin += 0.0022
      return {
        uTime: t,
        uCam: [0.0, 1.62, 3.7],
        uTarget: [0.0, 1.12, 0.0],
        uLight: [0.0, 2.55, 0.18],
        uP: [st.shape, 0, st.spin, st.rev],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 1.0)

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(30% 34% at 62% 56%, #4a4436 0%, #060607 72%)' }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="A dark room with a single lamp over an empty plinth"
    />
  )
}
