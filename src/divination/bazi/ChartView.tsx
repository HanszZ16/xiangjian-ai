import type { BaziChart } from './compute'

const ELEMENT_COLOR: Record<string, string> = {
  木: '#5b8b6a',
  火: '#b2413a',
  土: '#9a7b48',
  金: '#a9a294',
  水: '#4a6d8c',
}

function Cell({
  label,
  children,
  minH,
}: {
  label: string
  children: React.ReactNode
  /** 各柱藏干条数不同，给个下限好让四列的行横向对齐 */
  minH?: number
}) {
  return (
    <div className="py-2 border-t border-[var(--line)] first:border-t-0">
      <div className="text-[11px] tracking-[0.2em] text-[var(--fg-faint)] mb-0.5">{label}</div>
      <div
        className="text-[14px] text-[var(--fg-dim)] leading-relaxed"
        style={minH ? { minHeight: minH } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

export function BaziChartView({ chart }: { chart: BaziChart }) {
  const maxEl = Math.max(...Object.values(chart.elements), 1)

  return (
    <div className="w-full">
      {/* ── 四柱 ── */}
      <div className="grid grid-cols-4 gap-x-3 sm:gap-x-6">
        {['年', '月', '日', '时'].map((pos) => {
          const p = chart.pillars.find((x) => x.position === pos)
          return (
            <div key={pos} className="text-center">
              <div className="text-[11px] tracking-[0.3em] text-[var(--fg-faint)] pb-2">
                {pos}柱
              </div>

              <div className="h-5 text-[12px] text-[var(--fg-dim)]">
                {p ? (p.stemStar === '日主' ? '　' : p.stemStar) : ''}
              </div>

              {p ? (
                <div className="py-2">
                  <div
                    className="glyph text-[38px] sm:text-[46px] leading-[1.15]"
                    style={{ color: ELEMENT_COLOR[p.stemElement] }}
                  >
                    {p.stem}
                  </div>
                  <div
                    className="glyph text-[38px] sm:text-[46px] leading-[1.15]"
                    style={{ color: ELEMENT_COLOR[p.branchElement] }}
                  >
                    {p.branch}
                  </div>
                </div>
              ) : (
                <div className="py-2 glyph text-[30px] leading-[1.6] text-[var(--fg-faint)]">
                  ？<br />？
                </div>
              )}

              <div className="mt-3 text-left">
                <Cell label="藏干" minH={78}>
                  {p ? (
                    p.hidden.map((h) => (
                      <div key={h.stem} className="whitespace-nowrap">
                        <span className="glyph">{h.stem}</span>
                        <span className="text-[var(--fg-faint)] ml-1">{h.star}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[var(--fg-faint)]">时辰不详</span>
                  )}
                </Cell>
                <Cell label="纳音">{p?.sound ?? '—'}</Cell>
                <Cell label="长生">{p?.terrain ?? '—'}</Cell>
                <Cell label="旬空">{p?.empty ?? '—'}</Cell>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 五行 ── */}
      <div className="mt-10">
        <div className="text-[11px] tracking-[0.3em] text-[var(--fg-faint)] mb-3">五行力量</div>
        <div className="space-y-1.5">
          {Object.entries(chart.elements).map(([el, v]) => (
            <div key={el} className="flex items-center gap-3">
              <span className="glyph w-5 text-[15px]" style={{ color: ELEMENT_COLOR[el] }}>
                {el}
              </span>
              <span className="flex-1 h-px bg-[var(--line)] relative">
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px]"
                  style={{ width: `${(v / maxEl) * 100}%`, background: ELEMENT_COLOR[el], opacity: 0.75 }}
                />
              </span>
              <span className="w-8 text-right text-[12px] text-[var(--fg-faint)] tabular-nums">
                {v}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[12px] text-[var(--fg-faint)] leading-relaxed">
          日主 <span className="glyph text-[var(--fg-dim)]">{chart.dayMaster}</span>
          {chart.dayMasterElement}　胎元 <span className="glyph">{chart.fetalOrigin}</span>
          　命宫 <span className="glyph">{chart.ownSign}</span>
          　身宫 <span className="glyph">{chart.bodySign}</span>
        </div>
      </div>

      {/* ── 大运 ── */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[11px] tracking-[0.3em] text-[var(--fg-faint)]">
            大运 · {chart.forward ? '顺排' : '逆排'}
          </span>
          <span className="text-[11px] text-[var(--fg-faint)]">起运 {chart.startAge}</span>
        </div>
        <div className="flex gap-px overflow-x-auto pb-1">
          {chart.decades.map((d, i) => (
            <div
              key={d.startAge}
              className="flex-1 min-w-[52px] text-center py-2 border-t"
              style={{
                borderColor: i === chart.currentDecade ? 'var(--seal)' : 'var(--line)',
              }}
            >
              <div className="text-[10px] text-[var(--fg-faint)] tabular-nums">
                {d.startAge}–{d.endAge}
              </div>
              <div
                className="glyph text-[17px] leading-tight mt-1"
                style={{ color: i === chart.currentDecade ? 'var(--seal)' : 'var(--fg-dim)' }}
              >
                {d.ganzhi[0]}
                <br />
                {d.ganzhi[1]}
              </div>
              <div className="text-[10px] text-[var(--fg-faint)] mt-1">{d.stemStar}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 流年 ── */}
      <div className="mt-8">
        <div className="text-[11px] tracking-[0.3em] text-[var(--fg-faint)] mb-3">流年</div>
        <div className="flex gap-4 overflow-x-auto text-[12px] pb-1">
          {chart.annuals.map((a) => (
            <div key={a.year} className="text-center shrink-0">
              <div className="text-[var(--fg-faint)] tabular-nums">{a.year}</div>
              <div className="glyph text-[15px] text-[var(--fg-dim)] my-0.5">{a.ganzhi}</div>
              <div className="text-[var(--fg-faint)]">{a.stemStar}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 排盘提醒 ── */}
      {chart.warnings.length > 0 && (
        <div className="mt-10 pt-5 border-t border-[var(--line)]">
          <div className="text-[11px] tracking-[0.3em] text-[var(--seal)] mb-2 opacity-80">
            排盘提醒
          </div>
          <ul className="space-y-1.5">
            {chart.warnings.map((w) => (
              <li key={w} className="text-[12.5px] leading-relaxed text-[var(--fg-faint)] flex gap-2">
                <span className="text-[var(--seal)] opacity-70 shrink-0">·</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
