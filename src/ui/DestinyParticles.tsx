import { useEffect, useRef } from 'react'
import { DestinyParticleField } from './destinyParticles/field'
import type { DestinyPattern } from './destinyParticles/patterns'

export type { DestinyPattern } from './destinyParticles/patterns'

export function DestinyParticles({ pattern }: { pattern: DestinyPattern }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const field = useRef<DestinyParticleField | null>(null)
  const initialPattern = useRef(pattern)

  useEffect(() => {
    const element = canvas.current
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    try {
      const next = new DestinyParticleField(element, initialPattern.current)
      field.current = next
      next.start()
      return () => {
        field.current = null
        next.dispose()
      }
    } catch {
      // WebGL / 浮点纹理不可用时保留原本的 SVG 罗盘，不让装饰影响主功能。
      return
    }
  }, [])

  useEffect(() => {
    field.current?.setPattern(pattern)
  }, [pattern])

  return (
    <canvas
      ref={canvas}
      data-pattern={pattern}
      className="destiny-particles absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
