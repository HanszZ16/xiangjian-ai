import { useId, type CSSProperties } from 'react'

/* 二十四山：八天干（去戊己）+ 十二地支 + 四维卦 */
const SHAN = [
  '壬', '子', '癸', '丑', '艮', '寅', '甲', '卯',
  '乙', '辰', '巽', '巳', '丙', '午', '丁', '未',
  '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥',
]

const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/* 先天八卦，自下而上三爻：1 阳 0 阴 */
const GUA: Array<[string, [number, number, number]]> = [
  ['乾', [1, 1, 1]],
  ['巽', [0, 1, 1]],
  ['坎', [0, 1, 0]],
  ['艮', [0, 0, 1]],
  ['坤', [0, 0, 0]],
  ['震', [1, 0, 0]],
  ['离', [1, 0, 1]],
  ['兑', [1, 1, 0]],
]

type RingProps = {
  radius: number
  items: string[]
  fontSize: number
  className?: string
  /** 秒数；正为顺时针，负为逆时针 */
  period: number
  spinning: boolean
}

/**
 * CSS 驱动旋转，不依赖 SVGSVGElement.pauseAnimations/unpauseAnimations。
 * 后两者在 Safari、内嵌浏览器和页面休眠恢复时支持并不稳定。
 */
function spinStyle(period: number, spinning: boolean): CSSProperties {
  return {
    // 轴心用每圈自己的包围盒，不用 view-box。
    //
    // 这个盘的 viewBox 是 `-220 -220 440 440`，起点不在 0。配 view-box 时，
    // Chrome 把 `center` 落在用户坐标 (220, 220)——viewBox 的右下角，不是圆心。
    // 于是每圈字都绕着右下角转，转得越久甩得越远，久候的页面上尤其明显。
    //
    // 四圈都是偶数等分（24、12、10、8）且绕原点排布，180° 旋转下自身重合，
    // 包围盒必然正中于圆心，所以 fill-box + center 精确落在轴上，且不看 viewBox 的脸色。
    transformBox: 'fill-box',
    transformOrigin: 'center',
    animationName: 'luopan-spin',
    animationDuration: `${Math.abs(period)}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationDirection: period < 0 ? 'reverse' : 'normal',
    animationPlayState: spinning ? 'running' : 'paused',
  }
}

/** 一圈沿半径方向立起来的字 */
function GlyphRing({ radius, items, fontSize, className, period, spinning }: RingProps) {
  const step = 360 / items.length
  return (
    <g style={spinStyle(period, spinning)}>
      {items.map((ch, i) => {
        const deg = i * step
        return (
          <text
            key={`${ch}-${i}`}
            className={className}
            x={0}
            y={-radius}
            fontSize={fontSize}
            fill="currentColor"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${deg})`}
          >
            {ch}
          </text>
        )
      })}
    </g>
  )
}

/** 一圈八卦，用真的爻画，不用字符 */
function TrigramRing({ radius, period, spinning }: { radius: number; period: number; spinning: boolean }) {
  const step = 360 / GUA.length
  const w = 20
  const gap = 4.6
  const th = 2.4
  return (
    <g style={spinStyle(period, spinning)}>
      {GUA.map(([name, lines], i) => (
        <g key={name} transform={`rotate(${i * step}) translate(0 ${-radius})`}>
          {lines.map((yang, j) => {
            const y = (1 - j) * gap
            return yang ? (
              <rect key={j} x={-w / 2} y={y - th / 2} width={w} height={th} fill="currentColor" />
            ) : (
              <g key={j}>
                <rect x={-w / 2} y={y - th / 2} width={w * 0.4} height={th} fill="currentColor" />
                <rect x={w * 0.1} y={y - th / 2} width={w * 0.4} height={th} fill="currentColor" />
              </g>
            )
          })}
        </g>
      ))}
    </g>
  )
}

export type LuopanProps = {
  size?: number
  /** 停转即出盘 */
  spinning?: boolean
  /** 天池里的「象」。首页上标题正压在盘心，此时要让位 */
  centerGlyph?: boolean
  className?: string
}

/**
 * 罗盘。四层同心圈以不同速度、不同方向缓慢游走，
 * 排盘时旋转，盘停即出结果。
 */
export function Luopan({ size = 420, spinning = true, centerGlyph = true, className }: LuopanProps) {
  const gradientId = `lp-core-${useId().replace(/:/g, '')}`
  const rings = { shan: 188, zhi: 152, gua: 116, gan: 84 }

  return (
    <svg
      viewBox="-220 -220 440 440"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
          <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.03" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle r="200" fill={`url(#${gradientId})`} />

      {/* 界圈 */}
      {[204, 172, 134, 100, 64].map((r) => (
        <circle
          key={r}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth="0.8"
          opacity="0.85"
        />
      ))}
      <circle r="205.5" fill="none" stroke="var(--accent)" strokeWidth="0.6" opacity="0.35" />

      {/* 二十四山刻度 */}
      <g opacity="0.4">
        {Array.from({ length: 24 }, (_, i) => (
          <line
            key={i}
            x1="0"
            y1="-204"
            x2="0"
            y2="-172"
            stroke="var(--line)"
            strokeWidth="0.7"
            transform={`rotate(${i * 15 + 7.5})`}
          />
        ))}
      </g>

      <g style={{ color: 'var(--fg-dim)' }} className="glyph">
        <GlyphRing radius={rings.shan} items={SHAN} fontSize={13} period={-240} spinning={spinning} />
      </g>
      <g style={{ color: 'var(--accent)' }} className="glyph" opacity="0.85">
        <GlyphRing radius={rings.zhi} items={ZHI} fontSize={17} period={168} spinning={spinning} />
      </g>
      <g style={{ color: 'var(--fg-faint)' }}>
        <TrigramRing radius={rings.gua} period={-116} spinning={spinning} />
      </g>
      <g style={{ color: 'var(--fg-dim)' }} className="glyph" opacity="0.8">
        <GlyphRing radius={rings.gan} items={GAN} fontSize={14} period={84} spinning={spinning} />
      </g>

      {/* 天池 */}
      <circle r="30" fill="var(--bg)" stroke="var(--line)" strokeWidth="0.8" />
      <circle
        r="30"
        fill="none"
        stroke="var(--seal)"
        strokeWidth="0.8"
        opacity={spinning ? 0.25 : 0.7}
        style={{ transition: 'opacity 1.6s var(--ease-silk)' }}
      />
      {centerGlyph && (
        <text
          className="glyph"
          y="1"
          fontSize="26"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--accent)"
          opacity={spinning ? 0.35 : 0.9}
          style={{ transition: 'opacity 1.6s var(--ease-silk)' }}
        >
          象
        </text>
      )}

      {/* 指针：静止时朝正北 */}
      <line
        x1="0"
        y1="-14"
        x2="0"
        y2="-58"
        stroke="var(--seal)"
        strokeWidth="1.4"
        opacity={spinning ? 0 : 0.8}
        style={{ transition: 'opacity 2s var(--ease-silk)' }}
      />
    </svg>
  )
}
