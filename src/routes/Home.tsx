import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Luopan } from '../ui/Luopan'
import { InkReveal } from '../ui/InkReveal'
import { allModules } from '../divination/registry'
import type { DestinyPattern } from '../ui/DestinyParticles'

const ORDINAL = ['一', '二', '三', '四', '五', '六', '七', '八']
const DestinyParticles = lazy(() => import('../ui/DestinyParticles').then((module) => ({
  default: module.DestinyParticles,
})))

function patternFor(moduleId: string): DestinyPattern {
  if (moduleId === 'bazi') return 'bazi'
  if (moduleId === 'ziwei') return 'ziwei'
  if (moduleId === 'tarot') return 'tarot'
  return 'luopan'
}

export function Home() {
  const modules = allModules()
  const [pattern, setPattern] = useState<DestinyPattern>('luopan')

  return (
    // justify-content 用 safe center：内容一旦高过视口，普通的 center
    // 会把顶端顶到视口之外，怎么往上滚都见不到标题。
    <div className="relative isolate flex-1 flex flex-col items-center [justify-content:safe_center] overflow-x-hidden px-6 py-6 select-none">
      <Suspense fallback={null}>
        <DestinyParticles pattern={pattern} />
      </Suspense>

      {/* 盘在字后面缓缓地转 */}
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          className="absolute"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 0.42, scale: 1 }}
          transition={{ duration: 3.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Luopan size={350} spinning centerGlyph={false} className="max-w-[80vw] max-h-[80vw]" />
        </motion.div>

        <div className="relative text-center py-16">
          <InkReveal delay={0.6}>
            <h1 className="glyph text-[56px] sm:text-[72px] leading-none tracking-[0.18em] indent-[0.18em] text-[var(--fg)]">
              象见
            </h1>
          </InkReveal>
          <InkReveal delay={1.3}>
            <p className="mt-6 text-[13px] tracking-[0.5em] indent-[0.5em] text-[var(--fg-faint)]">
              观 象 见 微
            </p>
          </InkReveal>
        </div>
      </div>

      <InkReveal delay={2}>
        <p className="relative z-10 mt-2 mb-10 max-w-[30rem] text-center text-[15px] leading-[2.2] text-[var(--fg-dim)]">
          此处不预言吉凶，只把你出生那一刻的天地格局如实排出，
          <br className="hidden sm:block" />
          再请先生说一说它的意思。
        </p>
      </InkReveal>

      <nav className="relative z-10 w-full max-w-[30rem]">
        {modules.map((m, i) => (
          <InkReveal key={m.id} delay={2.4 + i * 0.22}>
            <Link
              to={`/cast/${m.id}`}
              onPointerEnter={() => setPattern(patternFor(m.id))}
              onPointerLeave={() => setPattern('luopan')}
              onFocus={() => setPattern(patternFor(m.id))}
              onBlur={() => setPattern('luopan')}
              className="group flex items-baseline gap-5 py-5 border-t border-[var(--line)] last:border-b
                         transition-colors duration-500 hover:border-[var(--accent)]"
            >
              <span className="glyph text-[12px] text-[var(--fg-faint)] w-4 shrink-0">
                {ORDINAL[i]}
              </span>
              <span className="flex-1">
                <span className="glyph block text-[19px] tracking-[0.25em] text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors duration-500">
                  {m.name}
                </span>
                <span className="block mt-1 text-[13px] text-[var(--fg-faint)]">{m.tagline}</span>
              </span>
              <span className="glyph text-[15px] text-[var(--fg-faint)] group-hover:text-[var(--seal)] transition-colors duration-500">
                {m.mark}
              </span>
            </Link>
          </InkReveal>
        ))}
      </nav>
    </div>
  )
}
