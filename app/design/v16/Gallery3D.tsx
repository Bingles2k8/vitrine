'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../_motion'

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

// A raymarched gallery: floor, back wall, plinth, a brass vitrine frame and the
// object inside it, lit by a single moving spotlight with a volumetric cone.
const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdFrame(vec3 p, vec3 b, float t){
  vec3 q = abs(p);
  float x = sdBox(vec3(q.x, q.y - b.y, q.z - b.z), vec3(b.x, t, t));
  float y = sdBox(vec3(q.x - b.x, q.y, q.z - b.z), vec3(t, b.y, t));
  float z = sdBox(vec3(q.x - b.x, q.y - b.y, q.z), vec3(t, t, b.z));
  return min(x, min(y, z));
}

// returns (distance, material)
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);                     // floor

  float wall = p.z + 6.0;                        // back wall
  if (wall < res.x) res = vec2(wall, 2.0);

  float plinth = sdBox(p - vec3(0.0, 0.42, 0.0), vec3(0.44, 0.42, 0.44)) - 0.02;
  if (plinth < res.x) res = vec2(plinth, 3.0);

  vec3 q = p - vec3(0.0, 1.08, 0.0);
  q.xz = rot(uTime * 0.28) * q.xz;

  float body = sdBox(q, vec3(0.20, 0.125, 0.075)) - 0.03;    // camera body
  float lens = length((q - vec3(0.0, -0.01, 0.115)) * vec3(1.0, 1.0, 0.55)) - 0.075;
  float knob = length(q - vec3(0.13, 0.14, 0.0)) - 0.04;
  float obj  = min(body, min(lens, knob));
  if (obj < res.x) res = vec2(obj, 4.0);

  float cage = sdFrame(p - vec3(0.0, 1.10, 0.0), vec3(0.38, 0.32, 0.38), 0.009);
  if (cage < res.x) res = vec2(cage, 5.0);

  return res;
}

vec3 normal(vec3 p){
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

vec2 march(vec3 ro, vec3 rd){
  float t = 0.0;
  float m = 0.0;
  for (int i = 0; i < 96; i++){
    vec3 p = ro + rd * t;
    vec2 h = map(p);
    if (h.x < 0.0015 * t || t > 24.0) { m = h.y; break; }
    t += h.x * 0.85;
    m = h.y;
  }
  return vec2(t, m);
}

float shadow(vec3 ro, vec3 rd){
  float res = 1.0;
  float t = 0.06;
  for (int i = 0; i < 34; i++){
    float h = map(ro + rd * t).x;
    if (h < 0.0018) return 0.0;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.02, 0.34);
    if (t > 9.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

vec3 lightPos(){
  return vec3(1.05 + 0.28 * sin(uTime * 0.22), 3.5, 1.55);
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n  = normal(p);
  vec3 lp = lightPos();
  vec3 ld = normalize(lp - p);

  vec3 albedo = vec3(0.06);
  float spec  = 0.05;
  if (m < 1.5)      { albedo = vec3(0.045, 0.043, 0.040); spec = 0.35; }  // floor
  else if (m < 2.5) { albedo = vec3(0.075, 0.070, 0.064); spec = 0.02; }  // wall
  else if (m < 3.5) { albedo = vec3(0.105, 0.098, 0.088); spec = 0.05; }  // plinth
  else if (m < 4.5) { albedo = vec3(0.62, 0.60, 0.57);    spec = 0.75; }  // object
  else              { albedo = vec3(0.78, 0.56, 0.24);    spec = 0.9;  }  // brass

  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = shadow(p + n * 0.006, ld);

  // spotlight cone
  vec3  sdir = normalize(vec3(0.0, 1.5, 0.35) - lp);
  float cone = clamp((dot(-ld, sdir) - 0.80) / 0.20, 0.0, 1.0);
  cone = pow(cone, 1.6);

  float atten = 1.0 / (1.0 + 0.10 * dot(lp - p, lp - p));
  vec3  warm  = vec3(1.0, 0.84, 0.62);

  vec3 col = albedo * (0.018 + 6.2 * dif * sh * cone * atten) * warm;

  vec3 h = normalize(ld - rd);
  col += warm * spec * pow(clamp(dot(n, h), 0.0, 1.0), 52.0) * sh * cone * 2.0;

  // faint cool fill so shadows read as a room, not a void
  col += albedo * vec3(0.045, 0.055, 0.085) * (0.25 + 0.5 * clamp(n.y, 0.0, 1.0));

  return col;
}

float hash(vec3 p){
  return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  // Camera sits back and looks slightly left, so the case lands right of centre
  // and the headline has clear space to live in.
  vec3 ro = vec3(uMouse.x * 0.45, 1.18 + uMouse.y * 0.16, 5.20);
  vec3 ta = vec3(0.58, 0.98, 0.0);
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(uv.x * rt + uv.y * up + 1.50 * fw);

  vec2  hit = march(ro, rd);
  float t   = hit.x;

  vec3 col;
  if (t > 24.0) {
    col = vec3(0.012, 0.013, 0.016);
  } else {
    vec3 p = ro + rd * t;
    col = shade(p, rd, hit.y);

    // one reflection bounce off the floor
    if (hit.y < 1.5) {
      vec3 n  = normal(p);
      vec3 r  = reflect(rd, n);
      vec2 h2 = march(p + n * 0.02, r);
      vec3 rc = h2.x > 24.0 ? vec3(0.012, 0.013, 0.016) : shade(p + n * 0.02 + r * h2.x, r, h2.y);
      col = mix(col, rc, 0.46);
    }
  }

  // volumetric spotlight cone + dust
  vec3  lp    = lightPos();
  vec3  sdir  = normalize(vec3(0.0, 1.5, 0.35) - lp);
  float steps = 26.0;
  float maxT  = min(t, 12.0);
  for (int i = 0; i < 26; i++){
    float fi = float(i);
    float st = (fi + hash(vec3(gl_FragCoord.xy, fi))) / steps * maxT;
    vec3  sp = ro + rd * st;
    vec3  ld = normalize(lp - sp);
    float cone = clamp((dot(-ld, sdir) - 0.90) / 0.10, 0.0, 1.0);
    cone = pow(cone, 4.0);
    float at = 1.0 / (1.0 + 0.20 * dot(lp - sp, lp - sp));
    float dust = 0.8 + 1.6 * step(0.9982, hash(floor(sp * 46.0)));
    col += vec3(1.0, 0.85, 0.63) * cone * at * dust * 0.016;
  }

  // vignette, tone, grain
  col *= 1.0 - 0.42 * length(uv * vec2(0.72, 1.0));
  col = col / (col + 0.85);
  col = pow(col, vec3(0.4545));
  col += (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) * 0.022;

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

/** The fold is a lit room, not a screenshot of one. */
export default function Gallery3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      setFailed(true)
      return
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true)
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')

    // Render below device resolution — this is a heavy per-pixel shader.
    const scale = Math.min(window.devicePixelRatio || 1, 1.4)
    const resize = () => {
      const w = Math.min(canvas.clientWidth, 1700)
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * scale * 0.72))
      canvas.height = Math.max(1, Math.floor(h * scale * 0.72))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let mx = 0
    let my = 0
    let tx = 0
    let ty = 0
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const t0 = performance.now()
    let visible = true
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting }, { threshold: 0.01 })
    io.observe(canvas)

    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      mx += (tx - mx) * 0.05
      my += (ty - my) * 0.05
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, reduced ? 8.0 : (performance.now() - t0) / 1000)
      gl.uniform2f(uMouse, mx, -my)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 34%, rgba(255,214,150,0.20), transparent 70%), linear-gradient(180deg, #0a0a0c 0%, #131215 60%, #0a0a0c 100%)',
        }}
      />
    )
  }

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
}
