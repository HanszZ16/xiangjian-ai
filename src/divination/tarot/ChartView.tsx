import { motion } from 'motion/react'
import type { TarotChart } from './compute'
import type { Drawn } from './compute'

const SUIT_COLOR: Record<string, string> = {
  权杖: '#b2413a',
  圣杯: '#4a6d8c',
  宝剑: '#a9a294',
  星币: '#9a7b48',
}

/** 牌面。不用插图——一张手绘的牌背花纹配名字，比拙劣的塔罗图更耐看。 */
function Face({ d, i }: { d: Drawn; i: number }) {
  const color = d.card.suit ? SUIT_COLOR[d.card.suit] : 'var(--accent)'

  return (
    <motion.div
      className="shrink-0 w-[104px]"
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.9, delay: 0.25 + i * 0.16, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ transformPerspective: 800 }}
    >
      <div className="text-[10.5px] tracking-[0.2em] text-[var(--fg-faint)] text-center mb-2 h-8 leading-tight flex items-end justify-center">
        {d.position}
      </div>

      <div
        className="relative aspect-[5/8] flex flex-col items-center justify-center gap-2 px-2"
        style={{
          boxShadow: `inset 0 0 0 1px ${color}55`,
          background: 'var(--bg-raised)',
          transform: d.reversed ? 'rotate(180deg)' : undefined,
        }}
      >
        {/* 四角的小饰纹 */}
        {[
          'top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1',
        ].map((pos) => (
          <span
            key={pos}
            className={`absolute ${pos} w-1.5 h-1.5`}
            style={{ boxShadow: `inset 0 0 0 1px ${color}77` }}
          />
        ))}

        {d.card.arcana === 'major' ? (
          <span className="glyph text-[11px] text-[var(--fg-faint)] tabular-nums">
            {d.card.number}
          </span>
        ) : (
          <span className="glyph text-[13px]" style={{ color }}>
            {d.card.element}
          </span>
        )}

        <span
          className="glyph text-[16px] leading-[1.35] text-center"
          style={{ color: 'var(--fg)', writingMode: 'vertical-rl' }}
        >
          {d.card.name}
        </span>
      </div>

      <div className="mt-2 text-center">
        <div className="text-[11px]" style={{ color: d.reversed ? 'var(--seal)' : 'var(--fg-faint)' }}>
          {d.reversed ? '逆位' : '正位'}
        </div>
        <div className="text-[10px] text-[var(--fg-faint)] opacity-60 mt-0.5">{d.card.en}</div>
      </div>
    </motion.div>
  )
}

export function TarotChartView({ chart }: { chart: TarotChart }) {
  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
        {chart.drawn.map((d, i) => (
          <Face key={d.card.id} d={d} i={i} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-[12px] text-[var(--fg-faint)]">
        <span>牌阵 {chart.spreadName}</span>
        <span>时辰 {chart.shichen}</span>
        <span>大阿卡纳 {Math.round(chart.majorRatio * 100)}%</span>
        {Object.entries(chart.suits).map(([s, n]) => (
          <span key={s}>
            {s} {n}
          </span>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-[var(--fg-faint)] opacity-60 break-all">
        种子 {chart.seed}　—— 记下它，可以重现这一副牌
      </div>
    </div>
  )
}
