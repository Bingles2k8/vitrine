'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** After hours: cold security light, mirror floor, glowing case edges. */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 3.0, 0.0), vec3(6.0, 3.0, 6.0));
  if (room < res.x) res = vec2(room, 2.0);

  float plinth = sdBox(p - vec3(0.0, 0.36, 0.0), vec3(0.50, 0.36, 0.50));
  if (plinth < res.x) res = vec2(plinth, 3.0);

  vec3 q = p - vec3(0.0, 1.02, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);

  float cage = sdFrame(p - vec3(0.0, 1.06, 0.0), vec3(0.44, 0.40, 0.44), 0.006);
  if (cage < res.x) res = vec2(cage, 5.0);
  return res;
}

vec3 KEY  = vec3(0.55, 0.80, 1.00);
vec3 RIM  = vec3(0.20, 0.55, 0.95);

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  if (m > 4.5) return KEY * 2.4;            // case edges read as lit glass

  vec3 alb = vec3(0.05, 0.06, 0.09);
  float spec = 0.1;
  if (m < 1.5)      { alb = vec3(0.020, 0.025, 0.035); spec = 0.9; }
  else if (m < 2.5) { alb = vec3(0.045, 0.055, 0.080); spec = 0.03; }
  else if (m < 3.5) { alb = vec3(0.060, 0.072, 0.100); spec = 0.2; }
  else              { alb = vec3(0.58, 0.63, 0.70);    spec = 0.7; }

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 8.0);
  float occ = ao(p, n);

  vec3 rimDir = normalize(vec3(-1.6, 1.2, -2.4) - p);
  float rim = pow(clamp(dot(n, rimDir), 0.0, 1.0), 2.2);

  vec3 col = alb * KEY * (0.05 + 3.4 * dif * sh) * occ;
  col += alb * RIM * rim * 1.5;
  col += alb * vec3(0.03, 0.05, 0.09) * occ;

  vec3 h = normalize(ld - rd);
  col += KEY * spec * pow(clamp(dot(n, h), 0.0, 1.0), 60.0) * sh * 1.6;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.4);

  vec2 hit = march(uCam, rd);
  vec3 col;
  if (hit.x > 36.0) {
    col = vec3(0.008, 0.010, 0.016);
  } else {
    vec3 p = uCam + rd * hit.x;
    col = shade(p, rd, hit.y);
    if (hit.y < 1.5) {                       // wet-look mirror floor
      vec3 n = normal(p);
      vec3 r = reflect(rd, n);
      vec2 h2 = march(p + n * 0.02, r);
      vec3 rc = h2.x > 36.0 ? vec3(0.008, 0.010, 0.016) : shade(p + n * 0.02 + r * h2.x, r, h2.y);
      col = mix(col, rc, 0.72);
    }
  }

  // cold haze
  col += KEY * 0.020 * (1.0 - clamp(uv.y * 1.4 + 0.4, 0.0, 1.0));

  col = col / (col + 0.9);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.50 * length(uv * vec2(0.66, 1.0));
  gl_FragColor = vec4(grain(col, 0.020), 1.0);
}
`

export default function Night() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({
    yaw: 0.5,
    drag: null as null | { x: number; yaw: number },
    mx: 0, tmx: 0,
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!st.drag && !reduced) st.yaw += 0.0045
      st.mx += (st.tmx - st.mx) * 0.05
      return {
        uTime: t,
        uCam: [st.mx * 0.6, 0.78, 3.15],
        uTarget: [0, 0.95, 0],
        uLight: [0.9, 3.2, 1.4],
        uP: [0, 0, st.yaw, 0],
        uQ: [0, 1, 0, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame)

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(55% 50% at 50% 42%, #12305a 0%, #060a12 70%)' }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={e => {
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        s.current.drag = { x: e.clientX, yaw: s.current.yaw }
      }}
      onPointerMove={e => {
        const r = (e.target as HTMLElement).getBoundingClientRect()
        s.current.tmx = ((e.clientX - r.left) / r.width - 0.5) * 2
        const d = s.current.drag
        if (d) s.current.yaw = d.yaw + (e.clientX - d.x) * 0.012
      }}
      onPointerUp={() => { s.current.drag = null }}
      onPointerCancel={() => { s.current.drag = null }}
      aria-label="A gallery after hours, lit by cold security lighting"
    />
  )
}
