import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

export type ShelfOptions = {
  canvas: HTMLCanvasElement
  stage: HTMLElement
  hero: HTMLElement
  caption: HTMLElement | null
  card: HTMLElement | null
  tagEls: HTMLElement[]
  reduce: boolean
  coarse: boolean
  onPick: (index: number) => void
  onStatus: (status: 'ok' | 'nogl') => void
}

export type Shelf = {
  setSelected: (i: number) => void
  dispose: () => void
}

type Geo = THREE.BufferGeometry
type Mat = THREE.Material

/**
 * Port of the After Hours shelf scene. Imperative on purpose: it owns the
 * renderer and everything hanging off it, and tears all of it down in dispose().
 */
export function createShelf(opts: ShelfOptions): Shelf | null {
  const { canvas, stage, hero, tagEls, reduce, coarse } = opts
  const disposers: Array<() => void> = []
  let disposed = false

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, /* FXAA pass handles edges */
      alpha: false,
      powerPreference: 'default',
    })
  } catch (err) {
    console.warn('WebGL unavailable, using fallback', err)
    opts.onStatus('nogl')
    return null
  }

  let composer: EffectComposer | undefined
  try {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setClearColor(0x0c0a09, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 50)

  /* cheap image-based light, generated once (regenerated if the GL context is restored) */
  const makeEnv = () => {
    const pm = new THREE.PMREMGenerator(renderer)
    if (scene.environment) scene.environment.dispose()
    const room = new RoomEnvironment()
    scene.environment = pm.fromScene(room, 0.04).texture
    room.dispose?.()
    pm.dispose()
  }
  makeEnv()

  /* post: render -> soft bloom on brass and glaze highlights -> tone map + sRGB -> FXAA */
  const fx = new EffectComposer(renderer)
  composer = fx
  fx.addPass(new RenderPass(scene, cam))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.035, 0.2, 0.97)
  fx.addPass(bloom)
  fx.addPass(new OutputPass())
  const fxaa = new ShaderPass(FXAAShader)
  fx.addPass(fxaa)

  /* procedural surface detail, generated once on small canvases */
  const textures: THREE.Texture[] = []
  const hash = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()
  const canvasTex = (size: number, draw: (g: CanvasRenderingContext2D, n: number) => void, rx = 1, ry = 1) => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    draw(g, size)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rx, ry)
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    textures.push(t)
    return t
  }
  /* height field -> tangent-space normal map */
  const normalFrom = (size: number, height: (x: number, y: number) => number, strength: number, rx = 1, ry = 1) =>
    canvasTex(size, (g, n) => {
      const h = new Float32Array(n * n)
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) h[y * n + x] = height(x, y)
      const img = g.createImageData(n, n), d = img.data
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const l = h[y * n + ((x - 1 + n) % n)], r = h[y * n + ((x + 1) % n)]
        const u = h[((y - 1 + n) % n) * n + x], b = h[((y + 1) % n) * n + x]
        const dx = (l - r) * strength, dy = (u - b) * strength, len = Math.hypot(dx, dy, 1)
        const i = (y * n + x) * 4
        d[i] = (dx / len * 0.5 + 0.5) * 255; d[i + 1] = (dy / len * 0.5 + 0.5) * 255; d[i + 2] = (1 / len * 0.5 + 0.5) * 255; d[i + 3] = 255
      }
      g.putImageData(img, 0, 0)
    }, rx, ry)
  /* grey roughness/variation map: base level plus jitter, tileable value noise */
  const noiseField = (n: number, cells: number) => {
    const grid = new Float32Array(cells * cells).map(() => hash())
    const at = (i: number, j: number) => grid[((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells)]
    return (x: number, y: number) => {
      const fx2 = (x / n) * cells, fy = (y / n) * cells, i = Math.floor(fx2), j = Math.floor(fy)
      const tx = fx2 - i, ty = fy - j, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
      const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx, b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx
      return a + (b - a) * sy
    }
  }
  const greyMap = (size: number, v: (x: number, y: number) => number, rx = 1, ry = 1) =>
    canvasTex(size, (g, n) => {
      const img = g.createImageData(n, n), d = img.data
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const k = Math.max(0, Math.min(255, v(x, y) * 255)), i = (y * n + x) * 4
        d[i] = d[i + 1] = d[i + 2] = k; d[i + 3] = 255
      }
      g.putImageData(img, 0, 0)
    }, rx, ry)

  const N1 = noiseField(256, 8), N2 = noiseField(256, 32), N3 = noiseField(256, 64)
  /* throwing rings: lathe v runs up the profile, so horizontal bands in texture space wrap the pot */
  const ringsN = normalFrom(256, (x, y) => 0.6 * Math.sin(y * 0.55 + N1(x, y) * 3) + 0.25 * Math.sin(y * 1.9) + 0.5 * N2(x, y), 1.4)
  /* glaze pooling: roughness varies in soft patches plus fine speckle */
  const glazeR = greyMap(256, (x, y) => 0.55 + 0.35 * N1(x, y) + 0.15 * (N3(x, y) - 0.5))
  /* unglazed terracotta / matte: grit */
  const gritN = normalFrom(256, (x, y) => 0.7 * N3(x, y) + 0.3 * Math.sin(y * 0.55 + N1(x, y) * 3), 2.2)
  const gritR = greyMap(256, (x, y) => 0.75 + 0.3 * (N3(x, y) - 0.5) + 0.15 * (N1(x, y) - 0.5))
  /* wood: long grain along u, with slow wobble */
  const grainH = (x: number, y: number) => {
    const w = y + N1(x, y) * 18 + Math.sin(x * 0.05) * 4
    return 0.5 + 0.5 * Math.sin(w * 0.9) * (0.6 + 0.4 * N2(x, y)) + 0.2 * N3(x * 0.25, y)
  }
  const woodN = normalFrom(256, grainH, 1.2, 1, 1)
  const woodR = greyMap(256, (x, y) => 0.7 + 0.25 * (grainH(x, y) - 0.6))
  /* stone: speckle and pitting */
  const stoneN = normalFrom(256, (x, y) => N3(x, y) + 0.5 * N2(x, y) - (N3(x * 3 % 256, y * 3 % 256) > 0.82 ? 0.8 : 0), 2.4)
  const stoneR = greyMap(256, (x, y) => 0.85 + 0.25 * (N2(x, y) - 0.5))
  /* brass: brushed along u, a little tarnish in patches */
  const brassR = greyMap(256, (x, y) => 0.55 + 0.25 * N3(x * 0.08, y) + 0.3 * (N1(x, y) - 0.5))
  const brassN = normalFrom(256, (x, y) => N3(x * 0.06, y), 0.8)
  /* book cloth: a fine weave */
  const weaveN = normalFrom(128, (x, y) => 0.5 + 0.25 * Math.sin(x * 1.6) * Math.sign(Math.sin(y * 0.8)) + 0.25 * Math.sin(y * 1.6) * Math.sign(Math.sin(x * 0.8)) + 0.3 * N3(x * 2, y * 2), 1.2)
  /* plaster wall: very low frequency undulation */
  const wallN = normalFrom(256, (x, y) => N1(x, y) + 0.4 * N2(x, y), 1.6)

  /* shared materials (standard PBR, no shadow maps) */
  const S = (c: number, r: number, m = 0, e = 0.4) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, envMapIntensity: e })
  /* glazed ceramics: physical material with a clearcoat */
  const GL = (c: number, r: number) =>
    new THREE.MeshPhysicalMaterial({
      color: c, roughness: r, metalness: 0, envMapIntensity: 0.6, clearcoat: 1, clearcoatRoughness: 0.1,
    })
  const gcream = GL(0xe7e5e4, 0.3), gsand = GL(0xc9a36b, 0.4), gdark = GL(0x44403c, 0.3), gterra = GL(0xb45309, 0.45)
  const wood = S(0x3a2616, 0.6, 0, 0.3), wall = S(0x1c1917, 1, 0, 0.12), stone = S(0xa8a29e, 0.9, 0, 0.4),
    cream = S(0xe7e5e4, 0.35, 0, 0.45), terra = S(0xb45309, 0.8, 0, 0.4), brass = S(0xd9993a, 0.3, 0.85, 0.8),
    dark = S(0x44403c, 0.35, 0, 0.45), sand = S(0xc9a36b, 0.4, 0, 0.4), umber = S(0x7c3a0a, 0.45, 0.2, 0.45),
    globeM = S(0x78716c, 0.55, 0, 0.4), gem = S(0xb8431c, 0.15, 0, 0.7)
  /* surface definition: procedural normal + roughness maps (roughnessMap multiplies base roughness) */
  const tex = (m: THREE.MeshStandardMaterial, n: THREE.Texture | null, ns: number, r: THREE.Texture | null = null) => {
    if (n) { m.normalMap = n; m.normalScale.set(ns, ns) }
    if (r) m.roughnessMap = r
  }
  for (const g of [gcream, gsand, gdark, gterra]) {
    tex(g, ringsN, 0.35, glazeR)
    g.clearcoatNormalMap = ringsN; g.clearcoatNormalScale.set(0.15, 0.15)
  }
  for (const m of [cream, dark, sand]) { tex(m, gritN, 0.4, gritR); m.roughness = Math.min(1, m.roughness + 0.1) }
  tex(terra, gritN, 0.6, gritR); terra.roughness = 1
  tex(wood, woodN, 0.5, woodR); wood.roughness = 0.8
  tex(stone, stoneN, 0.6, stoneR); stone.roughness = 1
  tex(brass, brassN, 0.15, brassR); brass.roughness = 0.45
  tex(umber, gritN, 0.35)
  tex(globeM, gritN, 0.3)
  wallN.repeat.set(6, 2); tex(wall, wallN, 0.5)
  const BY = [0, 2.2, 4.4], Z = 0.75, TOP = 0.07

  /* lathe profiles: each segment is a run of control points smoothed with a spline; segments meet at corners (foot rings, rims) */
  const prof = (...segs: number[][][]) => {
    const out: THREE.Vector2[] = []
    segs.forEach(s => {
      const c = new THREE.SplineCurve(s.map(p => new THREE.Vector2(p[0], p[1])))
      c.getPoints(Math.max(2, s.length * 4)).forEach((p, k) => {
        if (k === 0 && out.length && out[out.length - 1].distanceTo(p) < 1e-4) return
        out.push(p)
      })
    })
    return out
  }
  const lathe = (pts: THREE.Vector2[]) => new THREE.LatheGeometry(pts, 48)

  const amphCurve = (sg: number) =>
    new THREE.CatmullRomCurve3(
      [[0.15, 1.64], [0.33, 1.74], [0.5, 1.62], [0.55, 1.38], [0.45, 1.19]].map(p => new THREE.Vector3(p[0] * sg, p[1], 0))
    )

  /* fluted shaft: cylinder with grooves pushed in by vertex displacement */
  const fluted = () => {
    const N = 20,
      g = new THREE.CylinderGeometry(0.27, 0.31, 0.9, N * 6, 6, true),
      p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), f = 1 - 0.07 * Math.abs(Math.sin((N * Math.atan2(z, x)) / 2))
      p.setX(i, x * f)
      p.setZ(i, z * f)
    }
    g.computeVertexNormals()
    /* the cylinder duplicates its first and last column of vertices; average their normals so no seam shows */
    const nm = g.attributes.normal, rs = N * 6
    for (let r = 0; r <= 6; r++) {
      const a = r * (rs + 1), b = a + rs
      const x = nm.getX(a) + nm.getX(b), y = nm.getY(a) + nm.getY(b), z = nm.getZ(a) + nm.getZ(b), l = Math.hypot(x, y, z) || 1
      nm.setXYZ(a, x / l, y / l, z / l)
      nm.setXYZ(b, x / l, y / l, z / l)
    }
    return g
  }

  /* shared geometries */
  const G = {
    amphBody: lathe(prof([[0, 0], [0.2, 0]],
      [[0.2, 0], [0.27, 0.012], [0.285, 0.06], [0.21, 0.11]],
      [[0.21, 0.11], [0.3, 0.18], [0.47, 0.45], [0.56, 0.85], [0.46, 1.2], [0.26, 1.42]],
      [[0.26, 1.42], [0.19, 1.52], [0.17, 1.56]],
      [[0.17, 1.56], [0.2, 1.58], [0.17, 1.6]],
      [[0.17, 1.6], [0.165, 1.7]],
      [[0.165, 1.7], [0.2, 1.74], [0.285, 1.78], [0.3, 1.83], [0.26, 1.87], [0.19, 1.86]],
      [[0.19, 1.86], [0.15, 1.8], [0.13, 1.6]],
      [[0.13, 1.6], [0, 1.55]])),
    handleR: new THREE.TubeGeometry(amphCurve(1), 32, 0.042, 10, false),
    handleL: new THREE.TubeGeometry(amphCurve(-1), 32, 0.042, 10, false),
    vase: lathe(prof([[0, 0], [0.27, 0]],
      [[0.27, 0], [0.31, 0.012], [0.32, 0.05], [0.28, 0.09]],
      [[0.28, 0.09], [0.38, 0.16], [0.52, 0.4], [0.56, 0.6], [0.5, 0.82], [0.35, 1.02]],
      [[0.35, 1.02], [0.25, 1.12], [0.2, 1.2]],
      [[0.2, 1.2], [0.235, 1.225], [0.2, 1.25]],
      [[0.2, 1.25], [0.2, 1.32]],
      [[0.2, 1.32], [0.24, 1.42], [0.33, 1.52], [0.36, 1.57], [0.33, 1.6], [0.3, 1.57]],
      [[0.3, 1.57], [0.22, 1.45], [0.15, 1.3]],
      [[0.15, 1.3], [0, 1.2]])),
    bottle: lathe(prof([[0, 0], [0.28, 0]],
      [[0.28, 0], [0.33, 0.015], [0.35, 0.07]],
      [[0.35, 0.07], [0.355, 0.5], [0.34, 0.85]],
      [[0.34, 0.85], [0.3, 1], [0.2, 1.15], [0.13, 1.27]],
      [[0.13, 1.27], [0.115, 1.38], [0.115, 1.46]],
      [[0.115, 1.46], [0.14, 1.48], [0.115, 1.5]],
      [[0.115, 1.5], [0.115, 1.62]],
      [[0.115, 1.62], [0.15, 1.66], [0.17, 1.7], [0.165, 1.76], [0.14, 1.78], [0.1, 1.77]],
      [[0.1, 1.77], [0.08, 1.6]],
      [[0.08, 1.6], [0, 1.5]])),
    bowl: lathe(prof([[0, 0], [0.22, 0]],
      [[0.22, 0], [0.3, 0.012], [0.31, 0.05], [0.27, 0.085]],
      [[0.27, 0.085], [0.36, 0.16], [0.55, 0.3], [0.72, 0.43], [0.8, 0.52]],
      [[0.8, 0.52], [0.82, 0.545], [0.79, 0.565], [0.75, 0.55]],
      [[0.75, 0.55], [0.6, 0.4], [0.35, 0.25], [0.1, 0.2]],
      [[0.1, 0.2], [0, 0.2]])),
    urn: lathe(prof([[0, 0], [0.32, 0]],
      [[0.32, 0], [0.4, 0.012], [0.41, 0.07], [0.34, 0.13]],
      [[0.34, 0.13], [0.3, 0.2], [0.32, 0.28]],
      [[0.32, 0.28], [0.5, 0.45], [0.62, 0.7], [0.6, 0.88]],
      [[0.6, 0.88], [0.64, 0.905], [0.6, 0.93]],
      [[0.6, 0.93], [0.52, 1.0], [0.46, 1.04]],
      [[0.46, 1.04], [0.36, 1.1], [0.34, 1.17]],
      [[0.34, 1.17], [0.4, 1.2], [0.43, 1.24], [0.4, 1.27], [0.35, 1.25]],
      [[0.35, 1.25], [0.3, 1.15], [0.22, 1.1]],
      [[0.22, 1.1], [0, 1.05]])),
    goblet: lathe(prof([[0, 0], [0.3, 0]],
      [[0.3, 0], [0.36, 0.015], [0.37, 0.05], [0.3, 0.09], [0.14, 0.14]],
      [[0.14, 0.14], [0.08, 0.2], [0.065, 0.28], [0.1, 0.36], [0.065, 0.44], [0.07, 0.58]],
      [[0.07, 0.58], [0.2, 0.66], [0.32, 0.82], [0.37, 1], [0.36, 1.1]],
      [[0.36, 1.1], [0.37, 1.13], [0.345, 1.14], [0.33, 1.12]],
      [[0.33, 1.12], [0.31, 0.95], [0.2, 0.78], [0.06, 0.72]],
      [[0.06, 0.72], [0, 0.72]])),
    board: (() => {
      const sh = new THREE.Shape()
      sh.moveTo(-0.8, -0.07); sh.lineTo(0.75, -0.07); sh.quadraticCurveTo(0.8, -0.07, 0.8, -0.03); sh.lineTo(0.8, 0.03)
      sh.quadraticCurveTo(0.8, 0.07, 0.75, 0.07); sh.lineTo(-0.8, 0.07); sh.closePath()
      const g = new THREE.ExtrudeGeometry(sh, { depth: 30, bevelEnabled: false, curveSegments: 6 })
      g.translate(0, 0, -15); g.rotateY(-Math.PI / 2); return g /* profile x becomes world z (front is +z), extrusion runs along world x */
    })(),
    post: new THREE.BoxGeometry(0.16, 4.6, 1.6),
    /* column */
    shaft: fluted(),
    torusBase: lathe(prof([[0, 0.08], [0.4, 0.08]], [[0.4, 0.08], [0.44, 0.1], [0.43, 0.13], [0.38, 0.15]], [[0.38, 0.15], [0.36, 0.16], [0.35, 0.17]], [[0.35, 0.17], [0.32, 0.19], [0.31, 0.2]], [[0.31, 0.2], [0, 0.2]])),
    capital: lathe(prof([[0, 1.08], [0.27, 1.08]], [[0.27, 1.08], [0.3, 1.09], [0.3, 1.12], [0.27, 1.13]], [[0.27, 1.13], [0.3, 1.17], [0.36, 1.22], [0.4, 1.26]], [[0.4, 1.26], [0, 1.26]])),
    /* globe */
    sph: new THREE.SphereGeometry(0.62, 48, 32),
    mer: new THREE.TorusGeometry(0.7, 0.03, 8, 64),
    arc: new THREE.TorusGeometry(0.76, 0.03, 8, 48, Math.PI),
    latRing: new THREE.TorusGeometry(1, 0.016, 6, 64),
    rod: new THREE.CylinderGeometry(0.012, 0.012, 1.6, 8),
    stem: new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12),
    gbase: lathe(prof([[0, 0], [0.4, 0]], [[0.4, 0], [0.46, 0.015], [0.47, 0.05], [0.4, 0.08], [0.28, 0.1], [0.17, 0.14], [0.1, 0.19]], [[0.1, 0.19], [0, 0.21]])),
    /* ring */
    ring: new THREE.TorusGeometry(0.5, 0.085, 16, 48),
    bez: new THREE.CylinderGeometry(0.2, 0.17, 0.1, 24),
    gem: new THREE.SphereGeometry(0.14, 24, 12),
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
  }

  /* soft gradient textures: fake contact shadows and light pools */
  const grad = (rgb: string, a: number) => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, `rgba(${rgb},${a})`)
    r.addColorStop(1, `rgba(${rgb},0)`)
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    textures.push(t)
    return t
  }
  const shadowMat = new THREE.MeshBasicMaterial({ map: grad('0,0,0', 0.75), transparent: true, depthWrite: false, toneMapped: false })
  const poolMat = new THREE.MeshBasicMaterial({ map: grad('245,158,11', 0.22), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  const markMat = new THREE.MeshBasicMaterial({ map: grad('245,158,11', 0.9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, toneMapped: false })

  const add = <T extends THREE.Object3D>(o: T): T => { scene.add(o); return o }
  const mesh = (g: Geo, m: Mat, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(g, m)
    o.position.set(x, y, z)
    return o
  }

  /* composite objects, built from shared geometry */
  const amph = (m: Mat) => {
    const g = new THREE.Group()
    g.add(mesh(G.amphBody, m, 0, 0, 0), mesh(G.handleR, m, 0, 0, 0), mesh(G.handleL, m, 0, 0, 0))
    return g
  }
  const deed = (m: Mat, w: number, h: number, d: number) => {
    const g = new THREE.Group(), lh = Math.min(0.07, h * 0.2)
    const b = mesh(G.box, m, 0, (h - lh) / 2, 0); b.scale.set(w, h - lh, d); g.add(b)
    const l = mesh(G.box, m, 0, h - lh / 2, 0); l.scale.set(w * 1.04, lh, d * 1.06); g.add(l)
    const cl = mesh(G.box, brass, 0, h - lh - 0.02, d / 2 + 0.014); cl.scale.set(Math.min(0.12, w * 0.14), 0.1, 0.03); g.add(cl)
    const lt = mesh(G.box, brass, 0, h - lh / 2, d * 0.53 + 0.006); lt.scale.set(Math.min(0.07, w * 0.08), lh * 0.7, 0.016); g.add(lt)
    return g
  }
  const column = () => {
    const g = new THREE.Group()
    const pl = mesh(G.box, stone, 0, 0.04, 0); pl.scale.set(0.8, 0.08, 0.8); g.add(pl)
    g.add(mesh(G.torusBase, stone, 0, 0, 0))
    g.add(mesh(G.shaft, stone, 0, 0.65, 0))
    g.add(mesh(G.capital, stone, 0, 0, 0))
    const ab = mesh(G.box, stone, 0, 1.295, 0); ab.scale.set(0.88, 0.07, 0.88); g.add(ab)
    return g
  }
  const globe = () => {
    const g = new THREE.Group()
    const t = new THREE.Group(); t.position.set(0, 1.05, 0); t.rotation.z = 0.4; g.add(t) /* axial tilt */
    t.add(mesh(G.sph, globeM, 0, 0, 0))
    const m = mesh(G.mer, brass, 0, 0, 0); m.rotation.y = Math.PI / 2; t.add(m);
    [-0.6, 0, 0.6].forEach(p => {
      const r = mesh(G.latRing, brass, 0, 0.625 * Math.sin(p), 0)
      r.rotation.x = Math.PI / 2
      r.scale.setScalar(0.628 * Math.cos(p))
      t.add(r)
    })
    t.add(mesh(G.rod, brass, 0, 0, 0))
    const a = mesh(G.arc, brass, 0, 1.05, 0); a.rotation.z = Math.PI; g.add(a) /* half-meridian arc stand */
    g.add(mesh(G.stem, brass, 0, 0.3, 0)); g.add(mesh(G.gbase, brass, 0, 0, 0))
    return g
  }
  const signet = () => {
    const g = new THREE.Group()
    g.add(mesh(G.ring, brass, 0, 0, 0))
    g.add(mesh(G.bez, brass, 0, 0.6, 0))
    const s = mesh(G.gem, gem, 0, 0.65, 0); s.scale.set(1.2, 0.4, 0.9); g.add(s)
    return g
  }

  /* wall and shelving */
  const back = add(mesh(G.plane, wall, 0, 2.5, 0)); back.scale.set(44, 14, 1)
  BY.forEach(y => add(mesh(G.board, wood, 0, y, Z + 0.05)))
  for (let x = -14; x <= 14; x += 7) add(mesh(G.post, wood, x, 2.3, Z + 0.05))

  const flat = (x: number, row: number, w: number, k = 2.6) => {
    const s = mesh(G.plane, shadowMat, x, BY[row] + TOP + 0.005, Z)
    s.rotation.x = -Math.PI / 2
    s.scale.set(w * k, w * k, 1)
    add(s)
  }
  /* g is a geometry or a factory returning a group; either way the returned object is the pick root */
  type Maker = Geo | ((m: Mat) => THREE.Object3D)
  const lat = (g: Maker, m: Mat, s: number, x: number, row: number, r: number) => {
    const o = typeof g === 'function' ? g(m) : mesh(g, m, 0, 0, 0)
    o.position.set(x, BY[row] + TOP, Z)
    o.scale.setScalar(s)
    add(o)
    flat(x, row, r * s)
    return o
  }

  /* ten catalogue objects, same order as the record data */
  const roots: THREE.Object3D[] = []
  const marks: Array<{ x: number; y: number; r: number }> = []
  const reg = (o: THREE.Object3D, x: number, row: number, r: number) => {
    o.userData.i = roots.length
    roots.push(o)
    marks.push({ x, y: BY[row] + TOP + 0.012, r })
  }
  reg(lat(amph, terra, 0.82, -6.2, 0, 0.56), -6.2, 0, 0.56)
  reg(lat(G.vase, gcream, 0.85, -4.2, 0, 0.55), -4.2, 0, 0.55)
  { const g = globe(); g.position.set(-2.1, BY[0] + TOP, Z); add(g); flat(-2.1, 0, 0.45); reg(g, -2.1, 0, 0.45) }
  reg(lat(G.goblet, brass, 0.9, 0, 0, 0.38), 0, 0, 0.38)
  reg(lat(G.urn, gsand, 0.95, 1.9, 0, 0.62), 1.9, 0, 0.62)
  { const c = column(); c.position.set(3.8, BY[0] + TOP, Z); add(c); flat(3.8, 0, 0.42); reg(c, 3.8, 0, 0.42) }
  reg(lat(G.bottle, gdark, 0.8, -5.2, 1, 0.34), -5.2, 1, 0.34)
  reg(lat(G.bowl, gcream, 0.9, -2.6, 1, 0.78), -2.6, 1, 0.78)
  {
    const g = new THREE.Group(); g.position.set(0.4, BY[1] + TOP, Z)
    g.add(deed(umber, 1, 0.5, 0.8))
    const b = deed(dark, 0.7, 0.35, 0.6); b.position.set(0.05, 0.5, 0); b.rotation.y = 0.3; g.add(b)
    add(g); flat(0.4, 1, 0.5); reg(g, 0.4, 1, 0.5)
  }
  { const r = signet(); r.position.set(3.2, BY[1] + TOP + 0.6, Z + 0.1); r.rotation.y = 0.4; add(r); flat(3.2, 1, 0.5); reg(r, 3.2, 1, 0.5) }

  /* background fillers, not clickable */
  const fillers: Array<[Maker, Mat, number, number, number, number]> = [
    [amph, dark, 0.85, -11.7, 0, 0.56], [G.vase, gterra, 0.85, -8.4, 0, 0.55], [G.bottle, gsand, 0.8, -10, 0, 0.34],
    [G.vase, gdark, 0.8, 5.8, 0, 0.55], [amph, cream, 0.85, 7.6, 0, 0.56], [G.urn, gterra, 0.9, 9.4, 0, 0.62], [G.bowl, brass, 0.8, 11.2, 0, 0.78],
    [amph, sand, 0.85, -8.6, 1, 0.56], [G.vase, gcream, 0.8, 6.2, 1, 0.55], [G.goblet, brass, 0.85, 8, 1, 0.38],
    [G.vase, gcream, 0.7, -7.1, 2, 0.55], [G.bowl, gterra, 0.8, 1.6, 2, 0.78],
  ]
  fillers.forEach(a => lat(...a))

  /* books: one instanced mesh. Per-instance scale and colour; spine bands are extra thin instances in the same mesh */
  type Book = { x: number; row: number; w: number; h: number; d: number; lean: number; c: number; v: number; bands: number; bc: number }
  const bk: Book[] = []
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()
  const pal = [0x7c3a0a, 0x44403c, 0xb45309, 0x78716c, 0xe7e5e4, 0x1c1917, 0xc9a36b, 0xa8a29e, 0x5a2b09, 0x2a2420, 0x9a7b4f].map(c => new THREE.Color(c))
  const bpal = [0xc9a36b, 0xd9993a, 0xe7e5e4].map(c => new THREE.Color(c))
  const run = (x0: number, row: number, n: number) => {
    let x = x0
    for (let i = 0; i < n; i++) {
      const thick = rnd() < 0.14, w = thick ? 0.28 + rnd() * 0.14 : 0.12 + rnd() * 0.14, h = rnd() < 0.18 ? 0.95 + rnd() * 0.25 : 1.15 + rnd() * 0.6, d = 0.62 + rnd() * 0.3
      bk.push({ x: x + w / 2, row, w, h, d, lean: 0, c: Math.floor(rnd() * pal.length), v: 0.75 + rnd() * 0.4, bands: rnd() < 0.7 ? (rnd() < 0.5 ? 1 : 2) : 0, bc: Math.floor(rnd() * bpal.length) })
      x += w + 0.008 + (rnd() < 0.06 ? 0.12 : 0)
    }
    return x
  }
  const e1 = run(-12.6, 1, 12)
  bk.push({ x: e1 + 0.5, row: 1, w: 0.2, h: 1.3, d: 0.8, lean: -0.22, c: 0, v: 1, bands: 1, bc: 0 })
  run(9.2, 1, 14)
  run(-12.5, 2, 18); run(-6.5, 2, 15); run(-1.2, 2, 8); run(2.2, 2, 20); run(8.2, 2, 15)
  const nBands = bk.reduce((n, b) => n + b.bands, 0)
  const bookM = S(0xffffff, 0.75, 0, 0.35); tex(bookM, weaveN, 0.4)
  const bm = new THREE.InstancedMesh(G.box, bookM, bk.length + nBands)
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), eu = new THREE.Euler(), bp = new THREE.Vector3(), col = new THREE.Color()
  let ii = 0
  bk.forEach(b => {
    q.setFromEuler(eu.set(0, 0, b.lean)); pp.set(b.x, BY[b.row] + TOP + b.h / 2, Z - 0.1); ss.set(b.w, b.h, b.d); mt.compose(pp, q, ss)
    bm.setMatrixAt(ii, mt); bm.setColorAt(ii++, col.copy(pal[b.c]).multiplyScalar(b.v))
    for (let k = 0; k < b.bands; k++) {
      const off = (b.bands === 1 ? 0.24 : (k ? -0.2 : 0.28)) * b.h
      bp.set(0, off, 0).applyQuaternion(q).add(pp)
      ss.set(b.w * 1.03, 0.035 + 0.012 * k, b.d * 1.03); mt.compose(bp, q, ss)
      bm.setMatrixAt(ii, mt); bm.setColorAt(ii++, col.copy(bpal[b.bc]).multiplyScalar(0.7))
    }
  })
  add(bm)

  /* selection / hover marker */
  const marker = mesh(G.plane, markMat, 0, 0, Z); marker.rotation.x = -Math.PI / 2; marker.visible = false; add(marker)

  /* lights: ambient plus two spots that travel with the camera, light pools on the wall */
  scene.add(new THREE.AmbientLight(0xffe2b8, 1.1))
  const off = [-3.2, 3.4], aimY = [2.6, 3.2]
  const spots = off.map(() => { const s = new THREE.SpotLight(0xffb04a, 5, 0, 0.55, 0.9, 0); scene.add(s, s.target); return s })
  /* cool, subtle rim light from behind and to the side; follows the camera like the spots */
  const rim = new THREE.DirectionalLight(0x9db4d6, 0.5); scene.add(rim, rim.target)
  const pools = off.map(() => { const p = mesh(G.plane, poolMat, 0, 0, 0.03); p.scale.set(8, 6, 1); return add(p) })

  /* "read record" icons: one HTML button per root, anchored just above the object's bounding box */
  const tops = roots.map(r => {
    const b = new THREE.Box3().setFromObject(r)
    return new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + 0.22, (b.min.z + b.max.z) / 2)
  })
  const tv = new THREE.Vector3(), tc = new THREE.Vector3()
  let sw = stage.clientWidth, sh = stage.clientHeight
  const placeTags = () => {
    /* narrow screens: keep tags clear of the caption (record card when open, else the hero text block) */
    let maxY = Infinity
    if (innerWidth < 480) {
      const c = opts.card && !opts.card.hidden ? opts.card : opts.caption
      if (c) {
        const sr = stage.getBoundingClientRect(), cr = c.getBoundingClientRect()
        if (cr.height > 0 && cr.top < sr.bottom) maxY = Math.max(0, cr.top - sr.top - 24)
      }
    }
    for (let i = 0; i < tagEls.length && i < tops.length; i++) {
      const el = tagEls[i]
      tc.copy(tops[i]).applyMatrix4(cam.matrixWorldInverse)
      tv.copy(tops[i]).project(cam)
      const x = (tv.x * 0.5 + 0.5) * sw, y = (-tv.y * 0.5 + 0.5) * sh
      const out = tc.z >= -cam.near || x < -12 || x > sw + 12 || y < -12 || y > sh + 12
      el.style.visibility = out ? 'hidden' : 'visible'
      el.tabIndex = out ? -1 : 0
      if (out) el.setAttribute('aria-hidden', 'true')
      else el.removeAttribute('aria-hidden')
      if (!out) el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y > maxY ? maxY : y).toFixed(1) + 'px)'
    }
  }

  /* camera state: a = world x the camera sits at, sh = how far the scene is shifted right to clear the text */
  /* d = camera distance, y = camera height, ly = look-at height; these change when an object is focused */
  const KEYS = ['a', 'sh', 'd', 'y', 'ly'] as const
  const cur = { a: -6, sh: 2.6, d: 10.5, y: 2.9, ly: 2.5 }, tgt = { ...cur }
  const ctrs = roots.map(r => new THREE.Box3().setFromObject(r).getCenter(new THREE.Vector3()))
  let sel = -1, hov = -1, visible = true, raf = 0, portrait = false, dist = 10.5, staticX = 0
  /* how far the stage rises before normal scrolling resumes (0 with reduced motion: hero is height:auto then) */
  /* the stage's own height (100svh), not innerHeight: on phones innerHeight jumps as the URL bar shows and hides */
  const VH = () => sh || innerHeight
  const REVEAL = () => (reduce ? 0 : VH() * 0.22)
  /* 0..1 through the hero: the pinned span plus the reveal distance */
  const heroP = () => {
    const r = hero.getBoundingClientRect()
    const span = Math.max(1, r.height - VH() + REVEAL())
    return Math.min(1, Math.max(0, -r.top / span))
  }
  const scrollA = () => -6 + heroP() * 12
  const setTargets = () => {
    if (sel >= 0) {
      const c = ctrs[sel]
      tgt.a = c.x; tgt.sh = 0; tgt.d = portrait ? 7.5 : 6; tgt.ly = c.y; tgt.y = c.y + 0.6
    } else {
      tgt.a = reduce ? staticX : scrollA(); tgt.sh = portrait || reduce ? 0 : 2.6
      tgt.d = dist; tgt.y = 2.9; tgt.ly = portrait ? 1.6 : 2.5
    }
    if (reduce) { snap(); render() }
  }
  const snap = () => { for (const k of KEYS) cur[k] = tgt[k] }
  const place = () => {
    const a = cur.a
    cam.position.set(a, cur.y, cur.d); cam.lookAt(a - cur.sh, cur.ly, 0)
    rim.position.set(a - cur.sh + 7, 5.5, -1.5); rim.target.position.set(a - cur.sh, 1.8, Z); rim.target.updateMatrixWorld()
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i], sx = a - cur.sh + off[i]
      s.position.set(sx, 6.2, 6.6); s.target.position.set(sx + 0.4, aimY[i], Z); s.target.updateMatrixWorld()
      pools[i].position.set(sx + 0.4, aimY[i] + 0.3, 0.03)
    }
  }
  const showMark = () => {
    const i = sel >= 0 ? sel : hov
    if (i < 0) { marker.visible = false; return }
    const m = marks[i]; marker.visible = true; marker.position.set(m.x, m.y, Z)
    const w = m.r * 3.4 + 0.6; marker.scale.set(w, w, 1)
    markMat.opacity = sel >= 0 ? 0.95 : 0.5
  }
  function render() {
    if (disposed) return
    showMark(); place(); fx.render(); placeTags()
  }
  const frame = () => {
    raf = 0
    if (!visible || document.hidden || disposed) return
    let moving = false
    const ease = sel >= 0 ? 0.06 : 0.035
    for (let j = 0; j < KEYS.length; j++) {
      const k = KEYS[j], d = tgt[k] - cur[k]
      if (Math.abs(d) > 0.002) { cur[k] += d * ease; moving = true } else cur[k] = tgt[k]
    }
    render()
    if (moving) raf = requestAnimationFrame(frame)
  }
  const req = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame) }

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight
    if (!w || !h) return
    sw = w; sh = h
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    const pr = Math.min(devicePixelRatio, 1.5); fx.setPixelRatio(pr); fx.setSize(w, h)
    fxaa.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr))
    portrait = w < h * 0.9; cam.aspect = w / h; cam.fov = portrait ? 52 : 38
    dist = portrait ? 12 : 10.5
    if (reduce) { /* static wide shot so most of the shelf is in view */
      const need = 15 / (2 * Math.tan((cam.fov * Math.PI) / 360) * cam.aspect)
      dist = Math.min(15, Math.max(dist, need)); staticX = 0
    }
    cam.updateProjectionMatrix(); setTargets()
    snap()
    render()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(stage)
  disposers.push(() => ro.disconnect())
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { setTargets(); req() } })
  io.observe(canvas)
  disposers.push(() => io.disconnect())
  const onVis = () => { if (!document.hidden) { setTargets(); req() } }
  document.addEventListener('visibilitychange', onVis)
  disposers.push(() => document.removeEventListener('visibilitychange', onVis))
  if (!reduce) {
    /* gentle reveal: while the shelf pans, the pinned stage also creeps up (its sticky top goes negative), so the
       page eases down at a fraction of scroll speed and starts to show the next section. When the stage has risen
       REVEAL px the hero ends and scrolling is fully native. The pan spans the same distance, so both finish together. */
    const onScroll = () => {
      stage.style.top = (-REVEAL() * heroP()).toFixed(1) + 'px'
      if (sel < 0 && visible) { setTargets(); req() }
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    disposers.push(() => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      stage.style.top = ''
    })
  }

  /* picking: only on pointer events, against the ten object roots */
  const ray = new THREE.Raycaster(), nd = new THREE.Vector2()
  const pick = (ev: MouseEvent) => {
    const r = canvas.getBoundingClientRect()
    nd.set(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1))
    ray.setFromCamera(nd, cam)
    const hit = ray.intersectObjects(roots, true)[0]
    if (!hit) return -1
    let o: THREE.Object3D | null = hit.object
    while (o && o.userData.i === undefined) o = o.parent
    return o ? (o.userData.i as number) : -1
  }
  let pend = 0
  let lastEv: PointerEvent | null = null
  if (!coarse) {
    const onMove = (ev: PointerEvent) => {
      lastEv = ev
      if (pend) return
      pend = requestAnimationFrame(() => {
        pend = 0
        if (!lastEv || disposed) return
        const i = pick(lastEv)
        canvas.style.cursor = i >= 0 ? 'pointer' : ''
        if (i !== hov) { hov = i; if (visible && !raf) render() }
      })
    }
    canvas.addEventListener('pointermove', onMove)
    disposers.push(() => canvas.removeEventListener('pointermove', onMove))
  }
  const onLeave = () => { if (hov !== -1) { hov = -1; canvas.style.cursor = ''; render() } }
  canvas.addEventListener('pointerleave', onLeave)
  const onClick = (ev: MouseEvent) => opts.onPick(pick(ev))
  canvas.addEventListener('click', onClick)
  const onLost = (e: Event) => { e.preventDefault(); opts.onStatus('nogl') }
  const onRestored = () => { makeEnv(); opts.onStatus('ok'); render() }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)
  disposers.push(() => {
    canvas.removeEventListener('pointerleave', onLeave)
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
  })

  setTargets(); resize()
  opts.onStatus('ok')
  /* paint again once layout, fonts and the page load have settled, so the shelf shows on arrival without a scroll */
  const warm = () => { if (disposed) return; resize(); setTargets(); req(); if (!raf) render() }
  const warmRaf = requestAnimationFrame(() => requestAnimationFrame(warm))
  const warmT = setTimeout(warm, 400)
  document.fonts?.ready.then(warm)
  if (document.readyState !== 'complete') addEventListener('load', warm, { once: true })
  disposers.push(() => { cancelAnimationFrame(warmRaf); clearTimeout(warmT); removeEventListener('load', warm) })

  return {
    setSelected(i: number) {
      sel = i
      setTargets(); req(); if (!raf) render()
    },
    dispose() {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      if (pend) cancelAnimationFrame(pend)
      raf = pend = 0
      disposers.forEach(d => d())
      const geos = new Set<Geo>(Object.values(G))
      const mats = new Set<Mat>()
      scene.traverse(o => {
        const m = o as THREE.Mesh
        if (m.geometry) geos.add(m.geometry)
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => mats.add(x))
      })
      bm.dispose()
      geos.forEach(g => g.dispose())
      mats.forEach(m => m.dispose())
      textures.forEach(t => t.dispose())
      spots.forEach(s => s.dispose())
      rim.dispose()
      scene.environment?.dispose()
      scene.environment = null
      bloom.dispose(); fxaa.dispose(); fx.dispose()
      renderer.forceContextLoss()
      renderer.dispose()
    },
  }
  } catch (err) {
    disposed = true
    disposers.forEach(d => { try { d() } catch { /* keep tearing down */ } })
    composer?.dispose()
    renderer.forceContextLoss()
    renderer.dispose()
    throw err
  }
}
