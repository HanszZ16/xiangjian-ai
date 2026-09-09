import { SixtyCycleHour, SixtyCycleYear, SolarTime } from 'tyme4ts'
import type { ChartBase } from '../types'

export type Direction = '北' | '东北' | '东' | '东南' | '南' | '西南' | '西' | '西北'
export type GuaName = '坎' | '坤' | '震' | '巽' | '乾' | '兑' | '艮' | '离'
export type AuspiceTone = 'good' | 'calm' | 'caution'

export type FengshuiCell = {
  direction: Direction
  gua: GuaName
  star: string
  tone: AuspiceTone
  use: string
  highlighted: boolean
}

export type FengshuiInput = {
  facing: Direction
  completedDate: string
  residentGender: '男' | '女'
  residentBirthDate: string
  focus: string
  layout?: string
  question?: string
}

export type FengshuiChart = ChartBase & {
  facing: Direction
  sitting: Direction
  houseGua: GuaName
  houseGroup: '东四宅' | '西四宅'
  residentGua: GuaName
  residentNumber: number
  residentGroup: '东四命' | '西四命'
  compatible: boolean
  adjustedBirthYear: number
  period: number
  periodYears: string
  cells: FengshuiCell[]
  focus: string
  layout: string
  question: string
}

const OPPOSITE: Record<Direction, Direction> = {
  北: '南', 东北: '西南', 东: '西', 东南: '西北', 南: '北', 西南: '东北', 西: '东', 西北: '东南',
}

const DIRECTION_GUA: Record<Direction, GuaName> = {
  北: '坎', 东北: '艮', 东: '震', 东南: '巽', 南: '离', 西南: '坤', 西: '兑', 西北: '乾',
}

const GUA_NUMBER: Record<number, GuaName> = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兑', 8: '艮', 9: '离' }
const EAST_GUA = new Set<GuaName>(['坎', '离', '震', '巽'])

const HOUSE_MAP: Record<GuaName, Record<string, Direction>> = {
  坎: { 生气: '东南', 延年: '南', 天医: '东', 伏位: '北', 祸害: '西', 六煞: '东北', 五鬼: '西南', 绝命: '西北' },
  离: { 生气: '东', 延年: '北', 天医: '东南', 伏位: '南', 祸害: '西北', 六煞: '西', 五鬼: '东北', 绝命: '西南' },
  震: { 生气: '南', 延年: '东南', 天医: '北', 伏位: '东', 祸害: '东北', 六煞: '西南', 五鬼: '西北', 绝命: '西' },
  巽: { 生气: '北', 延年: '东', 天医: '南', 伏位: '东南', 祸害: '西南', 六煞: '西北', 五鬼: '西', 绝命: '东北' },
  乾: { 生气: '西南', 延年: '东北', 天医: '西', 伏位: '西北', 祸害: '东南', 六煞: '北', 五鬼: '南', 绝命: '东' },
  坤: { 生气: '西北', 延年: '西', 天医: '东北', 伏位: '西南', 祸害: '东', 六煞: '南', 五鬼: '北', 绝命: '东南' },
  艮: { 生气: '西', 延年: '西南', 天医: '西北', 伏位: '东北', 祸害: '南', 六煞: '东', 五鬼: '东南', 绝命: '北' },
  兑: { 生气: '东北', 延年: '西北', 天医: '西南', 伏位: '西', 祸害: '北', 六煞: '东南', 五鬼: '东', 绝命: '南' },
}

const USE: Record<string, string> = {
  生气: '活跃、工作与生长', 延年: '关系与长期协作', 天医: '休息与恢复', 伏位: '稳定与专注',
  祸害: '减噪、少作关键位', 六煞: '边界与情绪管理', 五鬼: '控火、控电、宜静', 绝命: '低频与储藏用途',
}

const FOCUS_STAR: Record<string, string[]> = {
  事业: ['生气', '伏位'], 感情: ['延年'], 健康: ['天医'], 整体: [],
}

function adjustedYear(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) throw new Error('常住者出生日期不完整')
  const birthYearPillar = SixtyCycleHour.fromSolarTime(
    SolarTime.fromYmdHms(year, month, day, 12, 0, 0),
  ).getEightChar().getYear().getName()
  const calendarYearPillar = SixtyCycleYear.fromYear(year).getSixtyCycle().getName()
  return birthYearPillar === calendarYearPillar ? year : year - 1
}

function digitalRoot(n: number) {
  let value = Math.abs(n)
  while (value > 9) value = String(value).split('').reduce((sum, x) => sum + Number(x), 0)
  return value
}

export function lifeGua(year: number, gender: '男' | '女') {
  // 八宅命卦用出生年后两位递加；2000 年后的男女常数分别改为 9 与 6。
  const sum = digitalRoot(year % 100)
  let number = gender === '男'
    ? (year >= 2000 ? 9 : 10) - sum
    : (year >= 2000 ? 6 : 5) + sum
  number = digitalRoot(number <= 0 ? number + 9 : number)
  if (number === 5) number = gender === '男' ? 2 : 8
  const gua = GUA_NUMBER[number]
  if (!gua) throw new Error('命卦换算失败')
  return { number, gua }
}

function periodOf(year: number) {
  const cycleOffset = ((year - 1864) % 180 + 180) % 180
  const cycleStart = year - cycleOffset
  const period = Math.floor(cycleOffset / 20) + 1
  const start = cycleStart + (period - 1) * 20
  return { period, years: `${start}–${start + 19}` }
}

export function computeFengshui(input: FengshuiInput): FengshuiChart {
  const completedYear = Number(input.completedDate.slice(0, 4))
  if (!completedYear) throw new Error('建成或装修日期不完整')
  const sitting = OPPOSITE[input.facing]
  if (!sitting) throw new Error('房屋朝向不在八方之内')
  const houseGua = DIRECTION_GUA[sitting]
  const houseEast = EAST_GUA.has(houseGua)
  const birthYear = adjustedYear(input.residentBirthDate)
  const resident = lifeGua(birthYear, input.residentGender)
  const residentEast = EAST_GUA.has(resident.gua)
  const period = periodOf(completedYear)
  const byDirection = Object.fromEntries(
    Object.entries(HOUSE_MAP[houseGua]).map(([star, direction]) => [direction, star]),
  ) as Record<Direction, string>

  const cells = (Object.keys(DIRECTION_GUA) as Direction[]).map((direction) => {
    const star = byDirection[direction]
    const good = ['生气', '延年', '天医'].includes(star)
    return {
      direction,
      gua: DIRECTION_GUA[direction],
      star,
      tone: good ? 'good' as const : star === '伏位' ? 'calm' as const : 'caution' as const,
      use: USE[star],
      highlighted: FOCUS_STAR[input.focus]?.includes(star) ?? false,
    }
  })

  const warnings = [
    '当前只到八方层级，未采集罗盘度数与户型图，因此不排二十四山山向飞星，也不判断具体外煞。',
    '命卦与宅卦是传统空间分类，不代表居住安全或健康结论；采光、通风、动线、结构与消防优先。',
  ]
  const chart: FengshuiChart = {
    facing: input.facing,
    sitting,
    houseGua,
    houseGroup: houseEast ? '东四宅' : '西四宅',
    residentGua: resident.gua,
    residentNumber: resident.number,
    residentGroup: residentEast ? '东四命' : '西四命',
    compatible: houseEast === residentEast,
    adjustedBirthYear: birthYear,
    period: period.period,
    periodYears: period.years,
    cells,
    focus: input.focus,
    layout: input.layout?.trim() ?? '',
    question: input.question?.trim() ?? '',
    warnings,
    digest: '',
  }
  chart.digest = digestOf(chart)
  return chart
}

function digestOf(c: FengshuiChart) {
  const lines = [
    `【宅向】坐${c.sitting}朝${c.facing} · ${c.houseGua}宅 · ${c.houseGroup}`,
    `【宅运背景】${c.periodYears} 年为${'一二三四五六七八九'[c.period - 1]}运，中宫数 ${c.period}`,
    `【常住者】命卦 ${c.residentNumber}${c.residentGua} · ${c.residentGroup}（出生年按立春校正为 ${c.adjustedBirthYear}）`,
    `【宅命关系】${c.compatible ? '命宅同组，可优先利用共同吉方' : '命宅异组，需在固定格局与个人常用位置之间取舍'}`,
    `【本次重点】${c.focus}`,
    '',
    '【八宅落位】',
    ...c.cells.map((x) => `${x.direction}（${x.gua}）\t${x.star}\t${x.use}${x.highlighted ? '\t本次重点' : ''}`),
  ]
  if (c.layout) lines.push('', `【用户描述的格局】${c.layout}`)
  lines.push('', '【分析边界】', ...c.warnings.map((w) => `- ${w}`))
  return lines.join('\n')
}
