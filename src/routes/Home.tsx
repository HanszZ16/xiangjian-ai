import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
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
    <div className="home-page">
      <div className="home-atmosphere" aria-hidden="true">
        <Suspense fallback={null}>
          <DestinyParticles pattern={pattern} />
        </Suspense>
      </div>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-marginal hero-marginal-left" aria-hidden="true">
          <span className="vertical">万物有象</span><span className="marginal-line" />
        </div>
        <div className="hero-luopan" aria-hidden="true">
          <Luopan size={324} spinning centerGlyph={false} />
        </div>
        <div className="hero-copy">
          <InkReveal>
            <p className="hero-eyebrow">观 象 见 微</p>
            <div className="hero-title-row">
              <h1 id="home-title" className="glyph hero-title">象见</h1>
              <span className="hero-seal" aria-hidden="true">观<br />象</span>
            </div>
          </InkReveal>
          <InkReveal delay={0.12}>
            <p className="hero-description">不预言吉凶，只为看清此刻。</p>
          </InkReveal>
        </div>
        <div className="hero-marginal hero-marginal-right" aria-hidden="true">
          <span className="marginal-line" /><span className="vertical">静中见微</span>
        </div>
      </section>

      <section className="home-collection" aria-labelledby="collection-title">
        <InkReveal delay={0.18}>
          <div className="collection-heading">
            <h2 id="collection-title">择一门 · 观一象</h2>
            <span className="collection-rule" />
            <span className="collection-note">起盘有据，解读有引</span>
          </div>
        </InkReveal>
        <nav className="module-grid" aria-label="术数门类">
          {modules.map((m, i) => (
            <InkReveal key={m.id} delay={0.22 + i * 0.06}>
              <Link
                to={`/cast/${m.id}`}
                onPointerEnter={() => setPattern(patternFor(m.id))}
                onPointerLeave={() => setPattern('luopan')}
                onFocus={() => setPattern(patternFor(m.id))}
                onBlur={() => setPattern('luopan')}
                className="module-card"
              >
                <span className="module-meta">
                  <span>{m.category ?? '观象'}</span>
                  <span className="module-ordinal" aria-hidden="true">{ORDINAL[i] ?? i + 1}</span>
                </span>
                <span className="module-content">
                  <span className="module-mark glyph" aria-hidden="true">{m.mark}</span>
                  <span className="module-name glyph">{m.name}</span>
                  <span className="module-tagline">{m.tagline}</span>
                </span>
                <span className="module-enter" aria-hidden="true">
                  <span>入卷</span>
                  <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                    <path d="M1 6H26M21 1L26 6L21 11" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </span>
              </Link>
            </InkReveal>
          ))}
        </nav>
        <InkReveal delay={0.5}>
          <p className="collection-postscript">以本地排盘为本，请你选择的模型，为此刻的所问作解。</p>
        </InkReveal>
      </section>
    </div>
  )
}
