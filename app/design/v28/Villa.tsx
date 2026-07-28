'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * Late afternoon in a warm room: sunlight through a tall window, raking across
 * terracotta walls. No spotlight — one hard sun and a lot of bounce.
 */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 3.0, 0.0), vec3(5.5, 3.0, 5.5));
  if (room < res.x) res = vec2(room, 2.0);

  // a plain wooden table rather than a museum plinth
  float top  = sdBox(p - vec3(0.0, 0.78, 0.0), vec3(0.95, 0.035, 0.55));
  vec3  lq   = p; lq.xz = abs(lq.xz) - vec2(0.82, 0.42);
  float legs = sdBox(lq, vec3(0.035, 0.39, 0.035));
  float table = min(top, legs);
  if (table < res.x) res = vec2(table, 3.0);

  vec3 q = p - vec3(0.0, 1.02, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 SUN = vec3(1.0, 0.80, 0.52);

/* Window on the left wall: a bright rectangle the sun comes through. */
float windowMask(vec3 p){
  float inWall = smoothstep(0.06, 0.0, abs(p.x + 5.5));
  float pane = step(abs(p.z - 0.4), 1.15) * step(abs(p.y - 1.75), 1.15);
  return inWall * pane;
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.62, 0.34, 0.24);
  float spec = 0.04;
  if (m < 1.5)      { alb = vec3(0.50, 0.36, 0.26); spec = 0.20; }   // terracotta floor
  else if (m < 2.5) { alb = vec3(0.72, 0.45, 0.33); spec = 0.02; }   // limewashed walls
  else if (m < 3.5) { alb = vec3(0.42, 0.26, 0.15); spec = 0.10; }   // walnut table
  else              { alb = vec3(0.74, 0.72, 0.68); spec = 0.55; }   // object

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 12.0);
  float occ = ao(p, n);

  // bounce: warm from the floor, sky-cool from above
  float hemi = 0.5 + 0.5 * n.y;
  vec3  amb  = mix(vec3(0.42, 0.24, 0.16), vec3(0.34, 0.36, 0.44), hemi);

  vec3 col = alb * amb * occ * 0.85;
  col += alb * SUN * dif * sh * 2.5;

  vec3 h = normalize(ld - rd);
  col += SUN * spec * pow(clamp(dot(n, h), 0.0, 1.0), 48.0) * sh * 1.2;

  col += SUN * windowMask(p) * 6.0;          // the window itself blows out
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.5);

  vec2 hit = march(uCam, rd);
  vec3 col;
  if (hit.x > 36.0) {
    col = vec3(0.10, 0.06, 0.05);
  } else {
    vec3 p = uCam + rd * hit.x;
    col = shade(p, rd, hit.y);
  }

  // the shaft: dust in the sunlight coming through the window
  float maxT = min(hit.x, 12.0);
  for (int i = 0; i < 22; i++){
    float fi = float(i);
    float st = (fi + hash(vec3(gl_FragCoord.xy, fi))) / 22.0 * maxT;
    vec3  sp = uCam + rd * st;
    vec3  ld = normalize(uLight - sp);
    float blocked = softShadow(sp, ld, 14.0);
    float band = step(abs(sp.z - 0.4), 1.4) * step(abs(sp.y - 1.6), 1.6);
    float dust = 0.7 + 2.0 * step(0.9975, hash(floor(sp * 40.0)));
    col += SUN * blocked * band * dust * 0.020;
  }

  col = 1.0 - exp(-col * 1.25);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.30 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.016), 1.0);
}
`

export default function Villa() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ sun: 0.5, tSun: 0.5, spin: 0 })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      st.sun += (st.tSun - st.sun) * 0.05
      if (!reduced) st.spin += 0.0025

      // Pointer walks the sun along the window, so the shaft sweeps the room.
      const z = -0.6 + st.sun * 2.2
      return {
        uTime: t,
        uCam: [1.75, 1.58, 4.35],
        uTarget: [-0.15, 0.86, -0.2],
        uLight: [-7.5, 2.6 + st.sun * 0.9, z],
        uP: [1, 0, st.spin, 0],
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
        style={{ background: 'linear-gradient(120deg,#f0c08a 0%,#b56a45 45%,#3a1d14 100%)' }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={e => {
        const r = (e.target as HTMLElement).getBoundingClientRect()
        s.current.tSun = (e.clientX - r.left) / r.width
      }}
      aria-label="A warm room with sunlight through a window; move the pointer to move the sun"
    />
  )
}
