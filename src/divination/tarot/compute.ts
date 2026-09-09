import { SolarTime } from 'tyme4ts'
import type { ChartBase } from '../types'
import { DECK, SPREADS, type Card, type SpreadId } from './deck'

export type Drawn = {
  position: string
  card: Card
  /** 逆位 */
  reversed: boolean
}

export type TarotChart = ChartBase & {
  spread: SpreadId
  spreadName: string
  question: string
  drawn: Drawn[]
  /** 抽牌种子，凭它可以复现同一次 */
  seed: string
  /** 起卦时的时辰，作为时间因子 */
  shichen: string
  /** 大阿卡纳占比 */
  majorRatio: number
  /** 花色分布 */
  suits: Record<string, number>
}

export type TarotInput = { spread: SpreadId; question: string; seed?: string }

/* ── 随机数 ────────────────────────────────────────────────────────
   用 crypto.getRandomValues 起种子，不用 Math.random——洗牌这件事上
   可预测的伪随机是说不过去的。种子记下来，同一副牌可以复现。 */

function newSeed(): string {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * 由种子确定性展开的随机流。
 *
 * 先用 cyrb128 把种子字符串散成四个 32 位状态，再喂给 sfc32。
 * 中间试过自己拼的 xorshift，播种太弱——两百次凯尔特十字抽下来
 * 有三张牌一次都没出现过，被单测逮住了。这两个是经过检验的现成算法。
 */
function seedState(str: string): [number, number, number, number] {
  let h1 = 1779033703
  let h2 = 3144134277
  let h3 = 1013904242
  let h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0]
}

function rng(seed: string) {
  let [a, b, c, d] = seedState(seed)
  const next = () => {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0
    let t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    t = (t + d) | 0
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
  // 丢掉开头几个，让状态先搅匀
  for (let i = 0; i < 16; i++) next()
  return next
}

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function computeTarot(input: TarotInput): TarotChart {
  const spread = SPREADS[input.spread]
  const seed = input.seed || newSeed()
  const next = rng(seed)

  // Fisher–Yates
  const deck = [...DECK]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  const drawn: Drawn[] = spread.positions.map((position, i) => ({
    position,
    card: deck[i],
    reversed: next() < 0.5,
  }))

  const now = new Date()
  const hour = SolarTime.fromYmdHms(
    now.getFullYear(), now.getMonth() + 1, now.getDate(),
    now.getHours(), now.getMinutes(), 0,
  )
  const shichen = SHICHEN[Math.floor(((now.getHours() + 1) % 24) / 2)]
  void hour

  const suits: Record<string, number> = {}
  for (const d of drawn) if (d.card.suit) suits[d.card.suit] = (suits[d.card.suit] ?? 0) + 1
  const majorRatio = drawn.filter((d) => d.card.arcana === 'major').length / drawn.length

  const chart: TarotChart = {
    warnings: [],
    digest: '',
    spread: input.spread,
    spreadName: spread.name,
    question: input.question,
    drawn,
    seed,
    shichen,
    majorRatio,
    suits,
  }
  chart.digest = digestOf(chart)
  return chart
}

function digestOf(c: TarotChart): string {
  const L: string[] = []
  L.push(`【牌阵】${c.spreadName}　【时辰】${c.shichen}时　【种子】${c.seed}`)
  L.push('')
  L.push('位置\t牌\t正逆\t属性')
  for (const d of c.drawn) {
    const attr =
      d.card.arcana === 'major'
        ? `大阿卡纳 ${d.card.number}`
        : `${d.card.suit}·${d.card.element}　序数 ${d.card.number}`
    L.push(`${d.position}\t${d.card.name}\t${d.reversed ? '逆位' : '正位'}\t${attr}`)
  }
  L.push('')
  L.push(
    `【分布】大阿卡纳占 ${Math.round(c.majorRatio * 100)}%　花色 ${
      Object.entries(c.suits).map(([k, v]) => `${k}${v}`).join('　') || '无小牌'
    }`,
  )
  const absent = ['权杖', '圣杯', '宝剑', '星币'].filter((s) => !c.suits[s])
  if (absent.length && c.drawn.length > 2) {
    L.push(`【缺席花色】${absent.join('、')}——可提示被忽视的能量`)
  }
  return L.join('\n')
}
