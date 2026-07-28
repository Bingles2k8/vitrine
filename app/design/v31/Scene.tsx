'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** The dark store: racking, crates, one bulb on a flex. Geometry only. */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.6, 0.0), vec3(6.0, 2.6, 9.0));
  if (room < res.x) res = vec2(room, 2.0);

  // racking down both sides
  vec3 r = p;
  r.x = abs(r.x) - 2.5;
  r.z = mod(p.z + 1.6, 3.2) - 1.6;
  vec3 up = r; up.z = abs(up.z) - 1.45;
  float uprights = sdBox(up, vec3(0.05, 2.2, 0.05));
  vec3 shv = r; shv.y = mod(p.y + 0.35, 1.05) - 0.525;
  float shelves = sdBox(shv, vec3(0.55, 0.028, 1.45));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  // two crates stacked clear of the copy, with the object standing on top
  for (int i = 0; i < 2; i++){
    float crate = sdBox(p - vec3(1.05, 0.30 + float(i) * 0.60, 0.55), vec3(0.42, 0.30, 0.34)) - 0.012;
    if (crate < res.x) res = vec2(crate, 5.0);
  }
  // more crates further down the aisle, out of the way
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float crate = sdBox(p - vec3(-1.7 + fi * 1.0, 0.30, -1.5 - fi * 0.8), vec3(0.42, 0.30, 0.34)) - 0.012;
    if (crate < res.x) res = vec2(crate, 5.0);
  }

  vec3 q = p - vec3(1.05, 1.38, 0.55);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 BULB = vec3(1.0, 0.88, 0.66);

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.20);
  float spec = 0.05;
  if (m < 1.5)      { alb = vec3(0.15, 0.16, 0.15); spec = 0.20; }   // painted concrete
  else if (m < 2.5) { alb = vec3(0.21, 0.24, 0.21); spec = 0.02; }   // breeze block
  else if (m < 3.5) { alb = vec3(0.28, 0.31, 0.29); spec = 0.30; }   // galvanised steel
  else if (m < 4.5) { alb = vec3(0.70, 0.68, 0.64); spec = 0.60; }   // the object
  else              { alb = vec3(0.36, 0.28, 0.18); spec = 0.05; }   // plywood crates

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 10.0);
  float occ = ao(p, n);
  float att = 1.0 / (1.0 + 0.24 * dot(uLight - p, uLight - p));

  vec3 col = alb * BULB * (3.8 * dif * sh * att) * occ;
  col += alb * vec3(0.026, 0.032, 0.030) * occ;
  vec3 h = normalize(ld - rd);
  col += BULB * spec * pow(clamp(dot(n, h), 0.0, 1.0), 36.0) * sh * att * 1.4;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  // Lens shift: the camera stays aimed at the object, but the frame is offset
  // so the object sits in the right-hand third and the copy gets clear space.
  vec2 suv = uv - vec2(0.34, 0.02);
  vec3 rd = camRay(uCam, uTarget, suv, 1.45);

  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.009, 0.011, 0.010) : shade(uCam + rd * hit.x, rd, hit.y);

  vec3 toL = uLight - uCam;
  float along = clamp(dot(toL, rd), 0.0, 40.0);
  float d = length(toL - rd * along);
  if (along < hit.x) {
    col += BULB * 2.4 * smoothstep(0.085, 0.0, d);
    col += BULB * 0.26 * smoothstep(1.3, 0.0, d);
  }

  col = col / (col + 0.85);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.46 * length(uv * vec2(0.7, 1.0));

  // Hold the left third down so the headline always has something to sit on.
  float copy = smoothstep(0.10, -0.62, uv.x);
  col *= mix(1.0, 0.30, copy);

  gl_FragColor = vec4(grain(col, 0.026), 1.0);
}
`


/** Random per load, or pinned with ?shape=N so each model can be reviewed. */
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

export default function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({
    swing: 0.3, vel: 0, spin: 0,
    shape: null as number | null,
    drag: null as null | { x: number },
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      // Picked once, on the client, in the render loop — a different object each
      // page load without risking a server/client mismatch.
      if (st.shape === null) st.shape = pickShape()

      if (!reduced) {
        st.vel += -st.swing * 0.0042
        st.vel *= 0.995
        st.swing += st.vel
        st.spin += 0.002
      }
      const a = st.swing
      return {
        uTime: t,
        uCam: [0.10, 1.52, 3.15],
        uTarget: [1.05, 1.34, 0.55],
        uLight: [1.05 + Math.sin(a) * 0.85, 2.25 - Math.abs(Math.sin(a)) * 0.15, 0.85 + Math.cos(a) * 0.2],
        uP: [st.shape, 0, st.spin, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'radial-gradient(40% 36% at 46% 28%, #6b6350 0%, #0b0d0b 72%)' }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={e => {
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        s.current.drag = { x: e.clientX }
      }}
      onPointerMove={e => {
        const d = s.current.drag
        if (!d) return
        s.current.vel += (e.clientX - d.x) * 0.00022
        d.x = e.clientX
      }}
      onPointerUp={() => { s.current.drag = null }}
      onPointerCancel={() => { s.current.drag = null }}
      aria-label="A dark store room with racking and crates; drag to swing the light"
    />
  )
}
