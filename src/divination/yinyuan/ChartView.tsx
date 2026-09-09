import type { BaziChart } from '../bazi/compute'
import type { MatchPerson, MatchTone, YinyuanChart } from './compute'

const ELEMENT_COLOR: Record<string, string> = {
  木: '#5b8b6a', 火: '#b2413a', 土: '#9a7b48', 金: '#a9a294', 水: '#4a6d8c',
}

const TONE_COLOR: Record<MatchTone, string> = {
  resonance: '#5b8b6a', steady: '#c8a96a', tension: '#b2413a',
}

function Person({ person, light }: { person: MatchPerson; light: boolean }) {
  const shown = light ? person.chart.pillars.slice(0, 1) : person.chart.pillars
  return (
    <div className="min-w-0 border-t border-[var(--line)] pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="glyph truncate text-[18px] tracking-[0.18em] text-[var(--fg)]">{person.name}</span>
        <span className="text-[11px] text-[var(--fg-faint)]">{light ? '年柱' : `${person.gender}命`}</span>
      </div>
      <div className={`mt-4 grid ${light ? 'grid-cols-1 max-w-20' : 'grid-cols-4'} gap-2`}>
        {shown.map((p) => (
          <div key={p.position} className="text-center">
            <div className="text-[10px] text-[var(--fg-faint)]">{p.position}柱</div>
            <div className="glyph mt-1 text-[24px] leading-tight" style={{ color: ELEMENT_COLOR[p.stemElement] }}>
              {p.stem}
            </div>
            <div className="glyph text-[24px] leading-tight" style={{ color: ELEMENT_COLOR[p.branchElement] }}>
              {p.branch}
            </div>
          </div>
        ))}
      </div>
      {!light && (
        <div className="mt-4 text-[12px] text-[var(--fg-faint)]">
          日主 <span className="glyph text-[var(--fg-dim)]">{person.chart.dayMaster}{person.chart.dayMasterElement}</span>
        </div>
      )}
    </div>
  )
}

function maxElement(chart: BaziChart) {
  return Math.max(...Object.values(chart.elements), 1)
}

export function YinyuanChartView({ chart }: { chart: YinyuanChart }) {
  const [a, b] = chart.people
  const maxA = maxElement(a.chart)
  const maxB = maxElement(b.chart)
  return (
    <div className="w-full">
      <div className="grid items-center gap-7 sm:grid-cols-[1fr_180px_1fr]">
        <Person person={a} light={chart.mode === 'zodiac'} />
        <div className="order-first text-center sm:order-none">
          <div
            className="mx-auto grid h-32 w-32 place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--accent) ${chart.score * 3.6}deg, var(--line) 0deg)` }}
          >
            <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-[var(--bg-raised)]">
              <div>
                <div className="glyph text-[34px] leading-none text-[var(--fg)]">{chart.score}</div>
                <div className="mt-1 text-[10px] tracking-[0.18em] text-[var(--fg-faint)]">合参指数</div>
              </div>
            </div>
          </div>
          <div className="glyph mt-3 text-[14px] tracking-[0.2em] text-[var(--accent)]">{chart.tier}</div>
        </div>
        <Person person={b} light={chart.mode === 'zodiac'} />
      </div>

      <div className="mt-9 grid gap-2 sm:grid-cols-2">
        {chart.dimensions.map((d) => (
          <div key={d.name} className="border border-[var(--line)] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-[var(--fg-dim)]">{d.name}</span>
              <span className="text-[12px] tabular-nums" style={{ color: TONE_COLOR[d.tone] }}>{d.score}</span>
            </div>
            <div className="my-2 h-px bg-[var(--line)]">
              <div className="h-px" style={{ width: `${d.score}%`, background: TONE_COLOR[d.tone] }} />
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--fg-faint)]">{d.summary}</p>
          </div>
        ))}
      </div>

      {chart.mode === 'bazi' && (
        <div className="mt-9">
          <div className="mb-3 flex items-center justify-between text-[11px] tracking-[0.2em] text-[var(--fg-faint)]">
            <span>五行对照</span><span>{a.name} ／ {b.name}</span>
          </div>
          <div className="space-y-2">
            {chart.elements.map((row) => (
              <div key={row.element} className="grid grid-cols-[1rem_1fr_1fr] items-center gap-3">
                <span className="glyph text-[13px]" style={{ color: ELEMENT_COLOR[row.element] }}>{row.element}</span>
                <div className="h-1 bg-[var(--line)]"><div className="h-full opacity-75" style={{ width: `${row.a / maxA * 100}%`, background: ELEMENT_COLOR[row.element] }} /></div>
                <div className="h-1 bg-[var(--line)]"><div className="h-full opacity-75" style={{ width: `${row.b / maxB * 100}%`, background: ELEMENT_COLOR[row.element] }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 border-l border-[var(--accent)]/40 pl-4 text-[12px] leading-relaxed text-[var(--fg-faint)]">
        指数用于展开盘面关系，不代表感情成功率；真实的尊重、边界与共同选择始终比合冲更重要。
      </div>
      {chart.warnings.length > 0 && (
        <ul className="mt-5 space-y-1.5 border-t border-[var(--line)] pt-4">
          {chart.warnings.map((w) => <li key={w} className="text-[11.5px] leading-relaxed text-[var(--fg-faint)]">· {w}</li>)}
        </ul>
      )}
    </div>
  )
}
