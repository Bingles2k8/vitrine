'use client'

import { useEffect, useRef, useState } from 'react'

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

/** How long without any input before the scene stops drawing. */
const IDLE_MS = 5000
/** How long the scene takes to come back up to full motion once woken. */
const WAKE_MS = 1000
/* The render scale chases a 60fps budget rather than the display's own rate.
   These were absolute milliseconds before too, but the one for climbing back up
   was 12ms — below anything this scene reaches on either kind of panel. Vsync
   caps a 60Hz frame at ~16.7ms, and on a 120Hz panel the aisle costs about 15ms
   at its *lowest* scale. So the scale could only ever ratchet down, all the way
   to the floor, on hardware with room to spare. */
/** Average frame over this and the scale steps down: under ~43fps. */
const SLOW_MS = 23
/** Average frame under this and it steps back up, if it has not already
 *  learned that the scale above is too slow. Above a 60Hz vsync cap, so a
 *  scene that is comfortably holding the display can actually reach it. */
const FAST_MS = 18.4
/**
 * Sustained frame time that means even the lowest render scale is too much for
 * this device — roughly 30fps. Below the floor there is nothing left to give
 * up, so the scene stops and the caller shows the static hero instead of
 * grinding for the rest of the visit.
 */
const BAIL_MS = 34
/** Consecutive sampling windows over BAIL_MS before giving up on the scene. */
const BAIL_WINDOWS = 3

export type Uniforms = Record<string, number | number[]>

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('shader compile failed:', gl.getShaderInfoLog(s))
    }
    gl.deleteShader(s)
    return null
  }
  return s
}

/**
 * Runs a fullscreen fragment shader. `onFrame` is called once per animation
 * frame and returns the uniforms for that frame, so interaction state lives in
 * the caller and never triggers a React re-render.
 *
 * Returns `failed` when WebGL or the shader is unavailable, so callers can
 * render a static fallback instead.
 */
export function useShader(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  frag: string,
  /**
   * `wake` ramps 0 → 1 over a second after the scene comes back from idle.
   * Scale any motion by it and the scene eases back into life instead of
   * snapping. Callers that ignore it simply resume at full speed.
   */
  onFrame: (timeSeconds: number, wake: number) => Uniforms,
  quality = 0.72,
  /**
   * Optional image atlas, uploaded to `uTex` the first frame it appears.
   * It is a ref because the photographs load asynchronously, well after the
   * GL context is set up — this way the render loop never restarts.
   */
  atlasRef?: React.RefObject<HTMLCanvasElement | null>
) {
  const [failed, setFailed] = useState(false)
  const frameRef = useRef(onFrame)

  // Keep the render loop pointed at the latest callback without restarting it.
  useEffect(() => {
    frameRef.current = onFrame
  })

  useEffect(() => {
    const canvas = canvasRef.current
    // An empty source means the caller does not know which scene it wants yet.
    // Compiling now would mean building a program only to throw it away.
    if (!canvas || !frag) return

    const gl = (canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, frag)
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
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const locs = new Map<string, WebGLUniformLocation | null>()
    const loc = (name: string) => {
      if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name))
      return locs.get(name)!
    }

    // Per-pixel raymarching costs the same whether a device can afford it or
    // not, so the render scale is measured rather than guessed: start
    // conservative on a touch device, then climb or fall to whatever holds a
    // frame budget. `quality` stays the ceiling each scene asks for.
    const base = Math.min(window.devicePixelRatio || 1, 1.4) * quality
    const coarse =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    let dynamic = coarse ? 0.7 : 1.0

    const resize = () => {
      const w = Math.min(canvas.clientWidth, 1700)
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * base * dynamic))
      canvas.height = Math.max(1, Math.floor(h * base * dynamic))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    // A resize reallocates the drawing buffer, which throws away the held
    // frame — so it has to wake the loop, not just change the size.
    const onResize = () => {
      resize()
      wake()
    }
    window.addEventListener('resize', onResize)

    let visible = true
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting }, { threshold: 0.01 })
    io.observe(canvas)

    let tex: WebGLTexture | null = null
    let uploaded = false
    const uploadAtlas = () => {
      const src = atlasRef?.current
      if (!src || uploaded) return
      uploaded = true
      tex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const l = loc('uTex')
      if (l) gl.uniform1i(l, 0)
    }

    let raf = 0
    /* The scene's own clock, advanced by hand rather than read off
       performance.now(). It only runs while the scene is drawing, and for the
       first second after waking it runs slow — which is what makes motion ease
       back in. Ramping the *amplitude* instead would snap the camera to centre
       at the moment of waking and then swing it back out. */
    let animMs = 0

    /* ── Sleep ────────────────────────────────────────────────────────
       A raymarcher that nobody is looking at is the most expensive way in
       the world to render a still image. The loop stops entirely when the
       tab is hidden or after five seconds without input; the canvas keeps
       showing its last composited frame, so the hero holds rather than
       going blank.

       The animation clock stops with it and resumes where it left off, so
       coming back is not a jump-cut into wherever the drift would have
       drifted to — it picks up mid-breath and eases back to full over a
       second. */
    let awake = true
    let wokeAt = performance.now() - WAKE_MS   // full motion on first load
    let idleTimer = 0

    /* Set once the scene has given up for good. The loop must not come back:
       every activity listener still fires, and the caller keeps the fallback. */
    let bailed = false

    const sleep = () => {
      if (!awake) return
      awake = false
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const armIdle = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(sleep, IDLE_MS)
    }

    const wake = () => {
      if (bailed) return
      if (document.visibilityState === 'hidden') return
      if (!awake) {
        awake = true
        wokeAt = performance.now()
        // The frame-time sampler must not read the gap as a slow frame and
        // drop the render scale for it.
        resumed = true
        last = performance.now()
        if (!raf) raf = requestAnimationFrame(tick)
      }
      armIdle()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sleep()
      else wake()
    }

    const ACTIVITY = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart'] as const

    // Rolling frame time, with a wide dead band between the two thresholds so
    // the scale cannot oscillate. The window closes after 45 frames or ~900ms,
    // whichever comes first: a device running at 12fps has to be rescued in
    // about a second, and waiting for a frame count would take eight.
    let last = performance.now()
    let acc = 0
    let samples = 0
    let resumed = true
    /* Consecutive windows spent below BAIL_MS while already at the scale floor. */
    let starved = 0
    /* The lowest scale this device has already proved it cannot hold. Climbing
       is only allowed strictly below it, so the measurement converges instead
       of pacing between two scales — a resolution that flickers once a second
       is worse to look at than one that is simply lower. */
    let ceiling = Infinity

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = now - last
      last = now
      if (!visible || !awake) {
        resumed = true
        return
      }
      uploadAtlas()

      // Drop the first frame after the canvas comes back into view — its dt
      // spans however long the tab was hidden. Everything else counts, however
      // slow: a 200ms frame is the strongest possible signal to turn the scale
      // down, and an earlier version of this threw exactly those away.
      if (resumed) {
        resumed = false
      } else {
        acc += dt
        samples++
        if (samples >= 6 && (samples >= 45 || acc >= 900)) {
          const avg = acc / samples
          acc = 0
          samples = 0
          if (avg > SLOW_MS && dynamic > 0.5) {
            ceiling = dynamic
            dynamic = Math.max(0.5, dynamic - 0.15)
            resize()
          } else if (avg < FAST_MS && dynamic + 0.15 < ceiling && dynamic < 1) {
            dynamic = Math.min(1, dynamic + 0.15)
            resize()
          }

          // Nothing left to give up: already at the floor and still far short
          // of a usable frame rate. Give the visitor the static hero instead.
          if (dynamic <= 0.5 && avg > BAIL_MS) {
            if (++starved >= BAIL_WINDOWS) {
              bailed = true
              sleep()
              setFailed(true)
              return
            }
          } else {
            starved = 0
          }
        }
      }

      // Ease-in-out on the ramp, so motion does not start with a jerk at the
      // moment the pointer moves and does not arrive at full speed with a step.
      const k = Math.min(1, (now - wokeAt) / WAKE_MS)
      const wakeRamp = k * k * (3 - 2 * k)
      animMs += Math.min(dt, 100) * wakeRamp

      const uniforms = frameRef.current(animMs / 1000, wakeRamp)
      gl.uniform2f(loc('uRes'), canvas.width, canvas.height)
      for (const [name, value] of Object.entries(uniforms)) {
        const l = loc(name)
        if (!l) continue
        if (typeof value === 'number') gl.uniform1f(l, value)
        else if (value.length === 2) gl.uniform2f(l, value[0], value[1])
        else if (value.length === 3) gl.uniform3f(l, value[0], value[1], value[2])
        else if (value.length === 4) gl.uniform4f(l, value[0], value[1], value[2], value[3])
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    tick()
    armIdle()

    for (const ev of ACTIVITY) window.addEventListener(ev, wake, { passive: true })
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('focus', wake)
    window.addEventListener('blur', sleep)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(idleTimer)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      for (const ev of ACTIVITY) window.removeEventListener(ev, wake)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('focus', wake)
      window.removeEventListener('blur', sleep)
      document.removeEventListener('visibilitychange', onVisibility)
      if (tex) gl.deleteTexture(tex)
      // The band re-checks itself every five minutes, so at dusk this teardown
      // runs on a live page. Without it each change leaves its program behind.
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [canvasRef, frag, quality, atlasRef])

  return failed
}

/** Shared fallback when WebGL is unavailable — a lit room, painted in CSS. */
export const FALLBACK_STYLE: React.CSSProperties = {
  background:
    'radial-gradient(58% 52% at 62% 40%, rgba(255,214,150,0.22), transparent 70%), linear-gradient(180deg, #0a0a0c 0%, #141317 58%, #0a0a0c 100%)',
}
