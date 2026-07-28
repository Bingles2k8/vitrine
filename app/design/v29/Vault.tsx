'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * Not the gallery — the store room behind it. Racking, crates, one bare bulb
 * on a flex that you can set swinging.
 */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.6, 0.0), vec3(7.0, 2.6, 9.0));
  if (room < res.x) res = vec2(room, 2.0);

  // racking: repeated bays down both sides
  vec3 r = p;
  r.x = abs(r.x) - 2.35;
  float bay = floor((p.z + 1.6) / 3.2);
  r.z = mod(p.z + 1.6, 3.2) - 1.6;

  vec3 up = r; up.z = abs(up.z) - 1.45;
  float uprights = sdBox(up, vec3(0.05, 2.2, 0.05));

  vec3 sh = r; sh.y = mod(p.y + 0.35, 1.05) - 0.525;
  float shelves = sdBox(sh, vec3(0.55, 0.028, 1.45));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  // crates on the shelves
  vec3 c = r;
  c.y = mod(p.y + 0.35, 1.05) - 0.525 - 0.22;
  c.z = mod(r.z + 0.72, 1.44) - 0.72;
  float crate = sdBox(c, vec3(0.32, 0.19, 0.42));
  if (crate < res.x) res = vec2(crate, 5.0);

  // one object, out of its box, on a trestle in the aisle
  float trestle = sdBox(p - vec3(0.0, 0.62, 0.6), vec3(0.55, 0.03, 0.35));
  if (trestle < res.x) res = vec2(trestle, 3.0);

  vec3 q = p - vec3(0.0, 0.86, 0.6);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);

  return res;
}

vec3 BULB = vec3(1.0, 0.90, 0.70);

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.20, 0.22, 0.20);
  float spec = 0.05;
  if (m < 1.5)      { alb = vec3(0.17, 0.18, 0.17); spec = 0.22; }  // painted concrete
  else if (m < 2.5) { alb = vec3(0.24, 0.27, 0.24); spec = 0.02; }  // breeze block
  else if (m < 3.5) { alb = vec3(0.30, 0.33, 0.31); spec = 0.30; }  // galvanised steel
  else if (m < 4.5) { alb = vec3(0.66, 0.64, 0.60); spec = 0.60; }  // the object
  else              { alb = vec3(0.42, 0.34, 0.22); spec = 0.04; }  // plywood crates

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 10.0);
  float occ = ao(p, n);
  float d2  = dot(uLight - p, uLight - p);
  float att = 1.0 / (1.0 + 0.22 * d2);      // bare bulb: hard inverse-square

  vec3 col = alb * BULB * (3.6 * dif * sh * att) * occ;
  col += alb * vec3(0.030, 0.038, 0.036) * occ;

  vec3 h = normalize(ld - rd);
  col += BULB * spec * pow(clamp(dot(n, h), 0.0, 1.0), 36.0) * sh * att * 1.4;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.42);

  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.010, 0.012, 0.011) : shade(uCam + rd * hit.x, rd, hit.y);

  // the bulb itself, and its glow
  vec3 toL = uLight - uCam;
  float along = clamp(dot(toL, rd), 0.0, 40.0);
  float dist = length(toL - rd * along);
  if (along < hit.x) {
    col += BULB * 2.6 * smoothstep(0.09, 0.0, dist);
    col += BULB * 0.30 * smoothstep(1.4, 0.0, dist);
  }

  col = col / (col + 0.85);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.46 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.026), 1.0);
}
`

export default function Vault() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ swing: 0.35, vel: 0, spin: 0, drag: null as null | { x: number } })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!reduced) {
        // pendulum on a flex, lightly damped
        st.vel += -st.swing * 0.0042
        st.vel *= 0.995
        st.swing += st.vel
        st.spin += 0.002
      }
      const a = st.swing
      return {
        uTime: t,
        uCam: [0, 1.5, 3.5],
        uTarget: [0, 0.85, 0.4],
        uLight: [Math.sin(a) * 1.5, 2.15 - Math.abs(Math.sin(a)) * 0.22, 0.6 + Math.cos(a) * 0.25],
        uP: [0, 0, st.spin, 0],
        uQ: [0, 1, 1, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(40% 38% at 50% 30%, #6b6350 0%, #0d0f0d 72%)' }}
      />
    )
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
      aria-label="A store room lit by a single bulb; drag to set it swinging"
    />
  )
}
