import type { ChartBase } from '../types'
import { computeBazi, type BaziChart } from '../bazi/compute'
import type { Place } from '../../lib/solarTime'

export type MatchMode = 'bazi' | 'zodiac'
export type MatchTone = 'resonance' | 'steady' | 'tension'

export type MatchDimension = {
  name: string
  score: number
  tone: MatchTone
  summary: string
}

export type MatchPerson = {
  name: string
  gender: '男' | '女'
  chart: BaziChart
}

export type YinyuanInput = {
  mode: MatchMode
  a: { name: string; gender: '男' | '女'; date: string; time: string; hourKnown: boolean; place: Place | null }
  b: { name: string; gender: '男' | '女'; date: string; time: string; hourKnown: boolean; place: Place | null }
  question?: string
}

export type YinyuanChart = ChartBase & {
  mode: MatchMode
  people: [MatchPerson, MatchPerson]
  score: number
  tier: string
  dimensions: MatchDimension[]
  elements: Array<{ element: string; a: number; b: number }>
  question: string
}

const STEM_COMBINES = ['甲己', '乙庚', '丙辛', '丁壬', '戊癸']
const STEM_CLASHES = ['甲庚', '乙辛', '丙壬', '丁癸']
const BRANCH_COMBINES = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']
const BRANCH_CLASHES = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']
const BRANCH_HARMS = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌']
const HARMONY_GROUPS = ['申子辰', '寅午戌', '巳酉丑', '亥卯未']
const PUNISH_GROUPS = ['寅巳申', '丑未戌', '子卯']
const SELF_PUNISH = '辰午酉亥'
const ELEMENTS = ['木', '火', '土', '金', '水']
const GENERATES: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

function pairIn(list: string[], a: string, b: string) {
  if (a === b) return false
  return list.some((pair) => pair.includes(a) && pair.includes(b))
}

function tone(score: number): MatchTone {
  return score >= 78 ? 'resonance' : score < 58 ? 'tension' : 'steady'
}

function branchRelation(a: string, b: string) {
  if (pairIn(BRANCH_COMBINES, a, b)) return { score: 92, label: `${a}${b}六合` }
  const harmony = HARMONY_GROUPS.find((group) => group.includes(a) && group.includes(b))
  if (harmony) return { score: 86, label: `${a}${b}同入${harmony}三合局` }
  if (pairIn(BRANCH_CLASHES, a, b)) return { score: 38, label: `${a}${b}相冲` }
  if (pairIn(BRANCH_HARMS, a, b)) return { score: 46, label: `${a}${b}相害` }
  const punish = PUNISH_GROUPS.find((group) => group.includes(a) && group.includes(b))
  if (punish || (a === b && SELF_PUNISH.includes(a))) return { score: 50, label: `${a}${b}见刑` }
  if (a === b) return { score: 72, label: `${a}${b}同气` }
  return { score: 66, label: `${a}${b}无明显合冲` }
}

function stemRelation(a: string, b: string) {
  if (pairIn(STEM_COMBINES, a, b)) return { score: 92, label: `${a}${b}五合` }
  if (pairIn(STEM_CLASHES, a, b)) return { score: 43, label: `${a}${b}相冲` }
  if (a === b) return { score: 74, label: `${a}${b}比和` }
  return { score: 66, label: `${a}${b}无合冲` }
}

function elementRelation(a: string, b: string) {
  if (a === b) return { score: 74, label: `${a}${b}比和` }
  if (GENERATES[a] === b) return { score: 84, label: `${a}生${b}` }
  if (GENERATES[b] === a) return { score: 84, label: `${b}生${a}` }
  if (CONTROLS[a] === b) return { score: 55, label: `${a}克${b}` }
  return { score: 55, label: `${b}克${a}` }
}

function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) throw new Error('出生日期不完整')
  return { year, month, day }
}

function personOf(data: YinyuanInput['a'], light: boolean): MatchPerson {
  const d = parseDate(data.date)
  const [hour, minute] = (data.time || '12:00').split(':').map(Number)
  const chart = computeBazi({
    gender: data.gender,
    clock: { ...d, hour: light ? 12 : hour, minute: light ? 0 : minute },
    hourKnown: light ? false : data.hourKnown,
    place: light ? null : data.place,
    manualLongitude: null,
    useTrueSolarTime: !light,
  })
  return { name: data.name.trim() || (data.gender === '男' ? '甲方' : '乙方'), gender: data.gender, chart }
}

function complementScore(a: BaziChart, b: BaziChart) {
  const totalA = Object.values(a.elements).reduce((sum, n) => sum + n, 0)
  const totalB = Object.values(b.elements).reduce((sum, n) => sum + n, 0)
  const distance = ELEMENTS.reduce(
    (sum, el) => sum + Math.abs((a.elements[el] ?? 0) / totalA - (b.elements[el] ?? 0) / totalB),
    0,
  ) / 2
  const supplied = ELEMENTS.filter(
    (el) => ((a.elements[el] ?? 0) < 0.5 && (b.elements[el] ?? 0) >= 1) ||
      ((b.elements[el] ?? 0) < 0.5 && (a.elements[el] ?? 0) >= 1),
  ).length
  return Math.round(Math.min(94, 58 + (1 - distance) * 25 + supplied * 5))
}

function tierOf(score: number) {
  if (score >= 84) return '相生有应'
  if (score >= 72) return '有合可成'
  if (score >= 60) return '平中见契'
  if (score >= 48) return '有缘需磨'
  return '张力偏重'
}

export function computeYinyuan(input: YinyuanInput): YinyuanChart {
  const light = input.mode === 'zodiac'
  const a = personOf(input.a, light)
  const b = personOf(input.b, light)
  const ay = a.chart.pillars[0]
  const by = b.chart.pillars[0]
  const yearStem = stemRelation(ay.stem, by.stem)
  const yearBranch = branchRelation(ay.branch, by.branch)
  const dimensions: MatchDimension[] = [
    {
      name: '年柱根基',
      score: Math.round(yearStem.score * 0.35 + yearBranch.score * 0.65),
      tone: 'steady',
      summary: `${yearStem.label}；${yearBranch.label}`,
    },
  ]

  if (!light) {
    const ad = a.chart.pillars[2]
    const bd = b.chart.pillars[2]
    const dayStem = stemRelation(ad.stem, bd.stem)
    const dayBranch = branchRelation(ad.branch, bd.branch)
    const masters = elementRelation(a.chart.dayMasterElement, b.chart.dayMasterElement)
    const complement = complementScore(a.chart, b.chart)
    const nayin = elementRelation(ay.sound.slice(-1), by.sound.slice(-1))
    dimensions.push(
      {
        name: '日柱互动',
        score: Math.round(dayStem.score * 0.45 + dayBranch.score * 0.55),
        tone: 'steady',
        summary: `${dayStem.label}；配偶宫${dayBranch.label}`,
      },
      { name: '日主生克', score: masters.score, tone: 'steady', summary: masters.label },
      { name: '五行互补', score: complement, tone: 'steady', summary: '按双方五行分布的相似与补位计算' },
      { name: '纳音辅助', score: nayin.score, tone: 'steady', summary: `${ay.sound}与${by.sound}，${nayin.label}` },
    )
  }

  for (const d of dimensions) d.tone = tone(d.score)
  const weights = light ? [1] : [0.22, 0.3, 0.18, 0.2, 0.1]
  const score = Math.round(dimensions.reduce((sum, d, i) => sum + d.score * weights[i], 0))
  const warnings = light
    ? ['生肖速配只看立春划分后的年柱，不能代替双方完整八字或真实相处经验。']
    : [
        ...a.chart.warnings.map((w) => `${a.name}：${w}`),
        ...b.chart.warnings.map((w) => `${b.name}：${w}`),
      ]

  const chart: YinyuanChart = {
    mode: input.mode,
    people: [a, b],
    score,
    tier: tierOf(score),
    dimensions,
    elements: ELEMENTS.map((element) => ({ element, a: a.chart.elements[element], b: b.chart.elements[element] })),
    question: input.question?.trim() ?? '',
    warnings,
    digest: '',
  }
  chart.digest = digestOf(chart)
  return chart
}

function digestOf(c: YinyuanChart) {
  const [a, b] = c.people
  const lines = [
    `【合参方式】${c.mode === 'bazi' ? '八字合参' : '生肖速配'}`,
    `【双方】${c.mode === 'bazi' ? `${a.name}（${a.gender}） × ${b.name}（${b.gender}）` : `${a.name} × ${b.name}`}`,
    `【合参指数】${c.score}/100 · ${c.tier}（这是下列规则的加权展示，不是关系判决）`,
    '',
    ...c.people.flatMap((p) => {
      const pillars = c.mode === 'bazi' ? p.chart.pillars.map((x) => x.ganzhi).join(' ') : p.chart.pillars[0].ganzhi
      return [
        `【${p.name}】${pillars}；日主${p.chart.dayMaster}${p.chart.dayMasterElement}`,
        `五行：${Object.entries(p.chart.elements).map(([el, n]) => `${el}${n}`).join(' ')}`,
      ]
    }),
    '',
    '【规则拆分】',
    ...c.dimensions.map((d) => `${d.name}\t${d.score}/100\t${d.summary}`),
  ]
  if (c.warnings.length) lines.push('', '【边界】', ...c.warnings.map((w) => `- ${w}`))
  return lines.join('\n')
}
