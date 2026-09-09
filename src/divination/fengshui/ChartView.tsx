import type { AuspiceTone, Direction, FengshuiCell, FengshuiChart } from './compute'

const GRID: Array<Direction | '中'> = ['西北', '北', '东北', '西', '中', '东', '西南', '南', '东南']
const TONE_COLOR: Record<AuspiceTone, string> = {
  good: '#5b8b6a', calm: '#c8a96a', caution: '#b2413a',
}

function Cell({ cell }: { cell: FengshuiCell }) {
  return (
    <div
      className="relative min-h-[112px] p-3 sm:min-h-[132px] sm:p-4"
      style={{
        boxShadow: `inset 0 0 0 ${cell.highlighted ? 2 : 1}px ${cell.highlighted ? 'var(--accent)' : 'var(--line)'}`,
        background: cell.highlighted ? 'color-mix(in oklab, var(--accent) 7%, transparent)' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="glyph text-[15px] text-[var(--fg)]">{cell.direction}</span>
        <span className="glyph text-[11px] text-[var(--fg-faint)]">{cell.gua}</span>
      </div>
      <div className="glyph mt-3 text-[16px] tracking-[0.12em]" style={{ color: TONE_COLOR[cell.tone] }}>
        {cell.star}
      </div>
      <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--fg-faint)]">{cell.use}</p>
      {cell.highlighted && <span className="absolute bottom-2 right-2 text-[9px] text-[var(--accent)]">本次重点</span>}
    </div>
  )
}

export function FengshuiChartView({ chart }: { chart: FengshuiChart }) {
  const cells = new Map(chart.cells.map((cell) => [cell.direction, cell]))
  return (
    <div className="w-full">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="border-l border-[var(--accent)]/50 pl-3">
          <div className="text-[10px] tracking-[0.2em] text-[var(--fg-faint)]">宅向</div>
          <div className="glyph mt-1 text-[18px] text-[var(--fg)]">坐{chart.sitting}朝{chart.facing} · {chart.houseGua}宅</div>
        </div>
        <div className="border-l border-[var(--line)] pl-3">
          <div className="text-[10px] tracking-[0.2em] text-[var(--fg-faint)]">命卦</div>
          <div className="glyph mt-1 text-[18px] text-[var(--fg)]">{chart.residentNumber}{chart.residentGua} · {chart.residentGroup}</div>
        </div>
        <div className="border-l border-[var(--line)] pl-3">
          <div className="text-[10px] tracking-[0.2em] text-[var(--fg-faint)]">建造运</div>
          <div className="glyph mt-1 text-[18px] text-[var(--fg)]">{'一二三四五六七八九'[chart.period - 1]}运 · {chart.periodYears}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px">
        {GRID.map((direction) => direction === '中' ? (
          <div key="中" className="grid min-h-[112px] place-items-center p-3 text-center sm:min-h-[132px]" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <div>
              <div className="glyph text-[24px] text-[var(--accent)]">{chart.houseGua}</div>
              <div className="mt-1 text-[11px] text-[var(--fg-faint)]">{chart.houseGroup}</div>
              <div className={`mt-2 text-[10px] ${chart.compatible ? 'text-[#5b8b6a]' : 'text-[var(--seal)]'}`}>
                {chart.compatible ? '宅命同组' : '宅命异组'}
              </div>
            </div>
          </div>
        ) : <Cell key={direction} cell={cells.get(direction)!} />)}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[var(--fg-faint)]">
        <span><i className="mr-1.5 inline-block h-1.5 w-1.5 bg-[#5b8b6a]" />生气 · 延年 · 天医</span>
        <span><i className="mr-1.5 inline-block h-1.5 w-1.5 bg-[var(--accent)]" />伏位</span>
        <span><i className="mr-1.5 inline-block h-1.5 w-1.5 bg-[var(--seal)]" />宜降频与化解动线</span>
      </div>
      <div className="mt-6 border-l border-[var(--accent)]/40 pl-4 text-[12px] leading-relaxed text-[var(--fg-faint)]">
        这是一张八方初筛图。没有罗盘度数与户型图，不冒充二十四山玄空飞星精盘。
      </div>
    </div>
  )
}
