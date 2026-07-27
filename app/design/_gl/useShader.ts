'use client'

import { useEffect, useRef, useState } from 'react'

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

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
  onFrame: (timeSeconds: number) => Uniforms,
  quality = 0.72
) {
  const [failed, setFailed] = useState(false)
  const frameRef = useRef(onFrame)

  // Keep the render loop pointed at the latest callback without restarting it.
  useEffect(() => {
    frameRef.current = onFrame
  })

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

    const scale = Math.min(window.devicePixelRatio || 1, 1.4) * quality
    const resize = () => {
      const w = Math.min(canvas.clientWidth, 1700)
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * scale))
      canvas.height = Math.max(1, Math.floor(h * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let visible = true
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting }, { threshold: 0.01 })
    io.observe(canvas)

    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return

      const uniforms = frameRef.current((performance.now() - t0) / 1000)
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

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef, frag, quality])

  return failed
}

/** Shared fallback when WebGL is unavailable — a lit room, painted in CSS. */
export const FALLBACK_STYLE: React.CSSProperties = {
  background:
    'radial-gradient(58% 52% at 62% 40%, rgba(255,214,150,0.22), transparent 70%), linear-gradient(180deg, #0a0a0c 0%, #141317 58%, #0a0a0c 100%)',
}
