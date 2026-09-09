import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import type { DestinyPattern } from './patterns'
import { writePattern } from './patterns'
import { positionFragment, renderFragment, renderVertex, velocityFragment } from './shaders'

const WORLD_HEIGHT = 10

function deviceTextureSize(width: number) {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const constrained = width < 720 || navigator.hardwareConcurrency <= 4 || (nav.deviceMemory ?? 8) <= 4
  return constrained ? 128 : 256
}

function initialScatter(index: number, salt: number) {
  const value = Math.sin((index + 1) * 17.173 + salt * 37.719) * 15731.743
  return value - Math.floor(value)
}

export class DestinyParticleField {
  private readonly canvas: HTMLCanvasElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.OrthographicCamera(-5, 5, 5, -5, -10, 10)
  private readonly gpu: GPUComputationRenderer
  private readonly positionVariable: ReturnType<GPUComputationRenderer['addVariable']>
  private readonly velocityVariable: ReturnType<GPUComputationRenderer['addVariable']>
  private readonly restTexture: THREE.DataTexture
  private readonly geometry: THREE.BufferGeometry
  private readonly material: THREE.ShaderMaterial
  private readonly points: THREE.Points
  private readonly pointer = new THREE.Vector3(999, 999, 0)
  private readonly pointerTarget = new THREE.Vector3(999, 999, 0)
  private readonly pointerRest = new THREE.Vector3(999, 999, 0)
  private readonly offset = new THREE.Vector3()
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly resizeObserver: ResizeObserver
  private readonly intersectionObserver: IntersectionObserver
  private readonly themeObserver: MutationObserver
  private pattern: DestinyPattern
  private textureSize: number
  private halfExtent = 3.7
  private pointerInside = false
  private pointerPressed = false
  private intersecting = true
  private frameId = 0
  private lastFrame = 0
  private disposed = false

  constructor(canvas: HTMLCanvasElement, pattern: DestinyPattern) {
    this.canvas = canvas
    this.pattern = pattern
    const rect = canvas.getBoundingClientRect()
    this.textureSize = deviceTextureSize(rect.width)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.camera.position.z = 4
    this.resizeRenderer()

    this.gpu = new GPUComputationRenderer(this.textureSize, this.textureSize, this.renderer)
    const positionTexture = this.gpu.createTexture()
    const velocityTexture = this.gpu.createTexture()
    this.restTexture = this.gpu.createTexture()

    const positions = positionTexture.image.data as unknown as Float32Array
    const velocities = velocityTexture.image.data as unknown as Float32Array
    const resting = this.restTexture.image.data as unknown as Float32Array
    writePattern(pattern, resting, this.halfExtent)
    for (let i = 0; i < resting.length / 4; i += 1) {
      const j = i * 4
      const angle = initialScatter(i, 1) * Math.PI * 2
      const distance = initialScatter(i, 2) * 0.28
      positions[j] = resting[j] + this.offset.x + Math.cos(angle) * distance
      positions[j + 1] = resting[j + 1] + this.offset.y + Math.sin(angle) * distance
      positions[j + 2] = resting[j + 2]
      positions[j + 3] = 1
      velocities[j] = 0
      velocities[j + 1] = 0
      velocities[j + 2] = 0
      velocities[j + 3] = 1
    }

    this.velocityVariable = this.gpu.addVariable('textureVelocity', velocityFragment, velocityTexture)
    this.positionVariable = this.gpu.addVariable('texturePosition', positionFragment, positionTexture)
    this.gpu.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable])
    this.gpu.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable])

    Object.assign(this.velocityVariable.material.uniforms, {
      uDelta: { value: 0.016 },
      uTime: { value: 0 },
      uRadius: { value: 1.3 },
      uStrength: { value: 0 },
      uPressed: { value: 0 },
      uRest: { value: this.restTexture },
      uPointer: { value: this.pointer },
      uOffset: { value: this.offset },
    })
    this.positionVariable.material.uniforms.uDelta = { value: 0.016 }

    const error = this.gpu.init()
    if (error) {
      this.gpu.dispose()
      this.renderer.dispose()
      throw new Error(error)
    }

    const count = this.textureSize * this.textureSize
    const references = new Float32Array(count * 2)
    const scales = new Float32Array(count)
    const randoms = new Float32Array(count)
    const dummyPositions = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      references[i * 2] = (i % this.textureSize) / this.textureSize
      references[i * 2 + 1] = Math.floor(i / this.textureSize) / this.textureSize
      scales[i] = 0.35 + initialScatter(i, 7) * 0.85
      randoms[i] = initialScatter(i, 13)
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3))
    this.geometry.setAttribute('aReference', new THREE.BufferAttribute(references, 2))
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uPosition: { value: null },
        uVelocity: { value: null },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color() },
        uSeal: { value: new THREE.Color() },
        uFaint: { value: new THREE.Color() },
      },
      vertexShader: renderVertex,
      fragmentShader: renderFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    })
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
    this.scene.add(this.points)
    this.applyTheme()

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.intersecting = entry?.isIntersecting ?? true
      this.syncLoop()
    })
    this.intersectionObserver.observe(canvas)
    this.themeObserver = new MutationObserver(() => this.applyTheme())
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] })

    window.addEventListener('pointermove', this.handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', this.handlePointerDown, { passive: true })
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true })
    window.addEventListener('pointercancel', this.handlePointerUp, { passive: true })
    window.addEventListener('blur', this.handlePointerLeave)
    document.addEventListener('visibilitychange', this.syncLoop)
    this.reducedMotion.addEventListener('change', this.syncLoop)
  }

  start() {
    this.syncLoop()
  }

  setPattern(pattern: DestinyPattern) {
    if (this.pattern === pattern || this.disposed) return
    this.pattern = pattern
    this.updateRestTexture()
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
    this.pointerInside = inside
    if (!inside) return

    const ndcX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
    const ndcY = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1)
    const aspect = rect.width / Math.max(rect.height, 1)
    this.pointerTarget.set(ndcX * (WORLD_HEIGHT / 2) * aspect, ndcY * (WORLD_HEIGHT / 2), 0)
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    this.handlePointerMove(event)
    if (this.pointerInside) this.pointerPressed = true
  }

  private readonly handlePointerUp = () => {
    this.pointerPressed = false
  }

  private readonly handlePointerLeave = () => {
    this.pointerInside = false
    this.pointerPressed = false
  }

  private handleResize() {
    const before = this.halfExtent
    this.resizeRenderer()
    this.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio()
    if (Math.abs(before - this.halfExtent) > 0.01) this.updateRestTexture()
  }

  private resizeRenderer() {
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))
    const aspect = width / height
    this.camera.left = -(WORLD_HEIGHT / 2) * aspect
    this.camera.right = (WORLD_HEIGHT / 2) * aspect
    this.camera.top = WORLD_HEIGHT / 2
    this.camera.bottom = -WORLD_HEIGHT / 2
    this.camera.updateProjectionMatrix()

    this.halfExtent = Math.min(3.7, 4.2 * aspect)
    this.offset.set(0, Math.max(0.45, Math.min(1.8, 4.65 - this.halfExtent)), 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 720 ? 1.25 : 1.6))
    this.renderer.setSize(width, height, false)
  }

  private updateRestTexture() {
    const target = this.restTexture.image.data as unknown as Float32Array
    writePattern(this.pattern, target, this.halfExtent)
    this.restTexture.needsUpdate = true
  }

  private applyTheme() {
    const style = getComputedStyle(document.documentElement)
    const set = (uniform: THREE.IUniform, token: string, fallback: string) => {
      uniform.value.set(style.getPropertyValue(token).trim() || fallback)
    }
    set(this.material.uniforms.uAccent, '--accent', '#c8a96a')
    set(this.material.uniforms.uSeal, '--seal', '#b2413a')
    set(this.material.uniforms.uFaint, '--fg-faint', '#5d594f')
  }

  private readonly syncLoop = () => {
    if (this.disposed) return
    const shouldRun = !document.hidden && this.intersecting && !this.reducedMotion.matches
    if (shouldRun && !this.frameId) {
      this.lastFrame = performance.now()
      this.frameId = requestAnimationFrame(this.render)
    } else if (!shouldRun && this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = 0
    }
  }

  private readonly render = (now: number) => {
    this.frameId = 0
    if (this.disposed) return
    const delta = Math.min(Math.max((now - this.lastFrame) / 1000, 0.001), 1 / 30)
    this.lastFrame = now
    const smoothing = 1 - Math.exp(-delta * 12)
    this.pointer.lerp(this.pointerInside ? this.pointerTarget : this.pointerRest, smoothing)

    const velocityUniforms = this.velocityVariable.material.uniforms
    velocityUniforms.uDelta.value = delta
    velocityUniforms.uTime.value = now / 1000
    velocityUniforms.uStrength.value = this.pointerInside ? 0.82 : 0
    velocityUniforms.uPressed.value = this.pointerPressed ? 1 : 0
    this.positionVariable.material.uniforms.uDelta.value = delta

    this.gpu.compute()
    this.material.uniforms.uPosition.value = this.gpu.getCurrentRenderTarget(this.positionVariable).texture
    this.material.uniforms.uVelocity.value = this.gpu.getCurrentRenderTarget(this.velocityVariable).texture
    this.material.uniforms.uTime.value = now / 1000
    this.renderer.render(this.scene, this.camera)
    this.frameId = requestAnimationFrame(this.render)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.intersectionObserver.disconnect()
    this.themeObserver.disconnect()
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointercancel', this.handlePointerUp)
    window.removeEventListener('blur', this.handlePointerLeave)
    document.removeEventListener('visibilitychange', this.syncLoop)
    this.reducedMotion.removeEventListener('change', this.syncLoop)
    this.scene.remove(this.points)
    this.geometry.dispose()
    this.material.dispose()
    this.restTexture.dispose()
    this.gpu.dispose()
    this.renderer.dispose()
  }
}
