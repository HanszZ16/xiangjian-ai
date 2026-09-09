import type { Palace, Star, ZiweiChart } from './compute'

/* 传统盘的地支方位是固定的：巳午未申在上，寅丑子亥在下，辰卯居左，酉戌居右。
   命宫落在哪个地支，盘就从哪里读起——所以格子不能按宫名排，只能按地支排。 */
const LAYOUT: Array<[string, string]> = [
  ['巳', '1 / 1'], ['午', '2 / 1'], ['未', '3 / 1'], ['申', '4 / 1'],
  ['辰', '1 / 2'], ['酉', '4 / 2'],
  ['卯', '1 / 3'], ['戌', '4 / 3'],
  ['寅', '1 / 4'], ['丑', '2 / 4'], ['子', '3 / 4'], ['亥', '4 / 4'],
]

const MUTAGEN_COLOR: Record<string, string> = {
  禄: '#5b8b6a',
  权: '#9a7b48',
  科: '#4a6d8c',
  忌: '#b2413a',
}

function StarText({ s, major }: { s: Star; major?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span
        className="glyph"
        style={{
          color: major ? 'var(--fg)' : 'var(--fg-dim)',
          fontSize: major ? 13 : 11.5,
        }}
      >
        {s.name}
      </span>
      {s.brightness && (
        <span className="text-[9.5px] text-[var(--fg-faint)] ml-px">{s.brightness}</span>
      )}
      {s.mutagen && (
        <span
          className="text-[9.5px] ml-px"
          style={{ color: MUTAGEN_COLOR[s.mutagen] ?? 'var(--accent)' }}
        >
          {s.mutagen}
        </span>
      )}
    </span>
  )
}

function Cell({ p, area, current }: { p: Palace | undefined; area: string; current: boolean }) {
  if (!p) return <div style={{ gridArea: area }} />

  return (
    <div
      className="relative p-1.5 sm:p-2 flex flex-col min-h-[132px] transition-colors duration-500"
      style={{
        gridArea: area,
        boxShadow: `inset 0 0 0 1px ${current ? 'var(--seal)' : 'var(--line)'}`,
      }}
    >
      {/* 星曜从上往下堆，宫名压在底角 */}
      <div className="flex-1 flex flex-col gap-px leading-tight">
        {p.majorStars.length ? (
          p.majorStars.map((s) => <StarText key={s.name} s={s} major />)
        ) : (
          <span className="text-[11px] text-[var(--fg-faint)] opacity-50">空宫</span>
        )}
        {p.minorStars.map((s) => (
          <StarText key={s.name} s={s} />
        ))}
      </div>

      <div className="mt-1.5 text-[9px] text-[var(--fg-faint)] opacity-55 leading-tight line-clamp-2">
        {p.adjectiveStars.map((s) => s.name).join(' ')}
      </div>

      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="whitespace-nowrap text-[10px] text-[var(--fg-faint)] tabular-nums">
          {p.decadal ? `${p.decadal[0]}–${p.decadal[1]}` : ''}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
          <span
            className="glyph whitespace-nowrap text-[12px]"
            style={{ color: p.name === '命宫' ? 'var(--accent)' : 'var(--fg-dim)' }}
          >
            {p.name}
            {p.isBody && <span className="text-[9px] text-[var(--seal)]">身</span>}
          </span>
          <span className="glyph whitespace-nowrap text-[10px] text-[var(--fg-faint)]">
            {p.stem}
            {p.branch}
          </span>
        </span>
      </div>
    </div>
  )
}

export function ZiweiChartView({ chart }: { chart: ZiweiChart }) {
  const byBranch = new Map(chart.palaces.map((p) => [p.branch, p]))
  const currentBranch = chart.now
    ? chart.palaces.find((p) => p.name === chart.now!.decadalPalace)?.branch
    : undefined

  return (
    <div className="w-full">
      <div
        className="grid gap-px text-left"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, minmax(0, auto))',
        }}
      >
        {LAYOUT.map(([branch, area]) => (
          <Cell
            key={branch}
            p={byBranch.get(branch)}
            area={area}
            current={branch === currentBranch}
          />
        ))}

        {/* 中宫 */}
        <div
          className="p-2.5 sm:p-4 flex flex-col justify-center gap-2 text-[12px] leading-relaxed"
          style={{
            gridArea: '2 / 2 / 4 / 4',
            boxShadow: 'inset 0 0 0 1px var(--line)',
          }}
        >
          <div className="text-[var(--fg-dim)]">
            {chart.gender}命　{chart.fiveElements}
          </div>
          <div className="text-[var(--fg-faint)]">
            命主 <span className="glyph text-[var(--fg-dim)]">{chart.soul}</span>
            　身主 <span className="glyph text-[var(--fg-dim)]">{chart.body}</span>
          </div>
          <div className="text-[var(--fg-faint)]">{chart.lunarDate}</div>
          <div className="text-[var(--fg-faint)] glyph">{chart.fourPillars}</div>
          <div className="text-[var(--fg-faint)]">{chart.shichen}</div>
          {chart.now && (
            <div className="pt-2 mt-1 border-t border-[var(--line)] text-[var(--fg-faint)]">
              大限 <span className="glyph">{chart.now.decadal}</span> 落{chart.now.decadalPalace}
              <br />
              流年 <span className="glyph">{chart.now.yearly}</span> 落{chart.now.yearlyPalace}
            </div>
          )}
        </div>
      </div>

      {/* 生年四化 */}
      <div className="mt-8">
        <div className="text-[11px] tracking-[0.3em] text-[var(--fg-faint)] mb-3">生年四化</div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {chart.birthMutagens.map((m) => (
            <span key={m.mark} className="text-[13px] text-[var(--fg-dim)]">
              <span className="glyph">{m.star}</span>
              <span className="mx-1" style={{ color: MUTAGEN_COLOR[m.mark] }}>
                化{m.mark}
              </span>
              在 {m.palace}
            </span>
          ))}
        </div>
      </div>

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
