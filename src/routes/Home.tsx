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
  if (moduleId === 'bazi' || moduleId === 'yinyuan') return 'bazi'
  if (moduleId === 'ziwei') return 'ziwei'
  if (moduleId === 'tarot') return 'tarot'
  return 'luopan'
}

export function Home() {
  const modules = allModules()
  const [pattern, setPattern] = useState<DestinyPattern>('luopan')

  return (
    <div className="relative isolate flex-1 flex flex-col items-center overflow-x-hidden px-5 sm:px-8 py-5 sm:py-8 select-none">
      <Suspense fallback={null}>
        <DestinyParticles pattern={pattern} />
      </Suspense>

      <div className="relative z-10 flex min-h-[250px] items-center justify-center">
        <motion.div
          className="absolute"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 0.34, scale: 1 }}
          transition={{ duration: 3.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Luopan size={286} spinning centerGlyph={false} className="max-w-[72vw] max-h-[72vw]" />
        </motion.div>

        <div className="relative text-center py-12">
          <InkReveal delay={0.6}>
            <h1 className="glyph text-[54px] sm:text-[68px] leading-none tracking-[0.18em] indent-[0.18em] text-[var(--fg)]">
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
        <p className="relative z-10 -mt-1 mb-9 max-w-[34rem] text-center text-[15px] leading-[2.1] text-[var(--fg-dim)]">
          此处不替你预言吉凶，只把术数中能算清的格局如实排出，
          <br className="hidden sm:block" />
          再请先生说一说，它与你此刻的问题有什么关系。
        </p>
      </InkReveal>

      <nav className="relative z-10 grid w-full max-w-[62rem] grid-cols-1 gap-3 sm:grid-cols-2">
        {modules.map((m, i) => (
          <InkReveal key={m.id} delay={2.4 + i * 0.22}>
            <Link
              to={`/cast/${m.id}`}
              onPointerEnter={() => setPattern(patternFor(m.id))}
              onPointerLeave={() => setPattern('luopan')}
              onFocus={() => setPattern(patternFor(m.id))}
              onBlur={() => setPattern('luopan')}
              className="module-card group relative flex min-h-[138px] h-full flex-col justify-between overflow-hidden p-5 sm:p-6"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-8 glyph text-[104px] leading-none text-[var(--fg)] opacity-[0.025] transition-all duration-700 group-hover:-translate-y-2 group-hover:opacity-[0.055]">
                {m.mark}
              </span>
              <span className="flex items-center justify-between text-[11px] tracking-[0.25em] text-[var(--fg-faint)]">
                <span>{ORDINAL[i]} · {m.category ?? '观象'}</span>
                <span className="text-[var(--accent)] opacity-0 transition-all duration-500 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100">入卷</span>
              </span>
              <span className="relative mt-5 flex items-end gap-4">
                <span className="flex-1">
                <span className="glyph block text-[20px] tracking-[0.22em] text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors duration-500">
                  {m.name}
                </span>
                <span className="block mt-2 text-[13px] leading-relaxed text-[var(--fg-faint)]">{m.tagline}</span>
                </span>
                <span className="glyph grid h-9 w-9 shrink-0 place-items-center border border-[var(--line)] text-[14px] text-[var(--fg-faint)] transition-colors duration-500 group-hover:border-[var(--seal)] group-hover:text-[var(--seal)]">
                  {m.mark}
                </span>
              </span>
            </Link>
          </InkReveal>
        ))}
      </nav>
    </div>
  )
}
