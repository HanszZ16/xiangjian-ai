import { astro } from 'iztro'
import type { ChartBase } from '../types'
import { toTrueSolarTime, type Place, type SolarCorrection, type WallClock } from '../../lib/solarTime'

export type ZiweiInput = {
  gender: '男' | '女'
  clock: WallClock
  place: Place | null
  useTrueSolarTime: boolean
  question?: string
}

export type Star = { name: string; brightness?: string; mutagen?: string }

export type Palace = {
  index: number
  /** 命宫、兄弟、夫妻…… */
  name: string
  isBody: boolean
  stem: string
  branch: string
  /** 大限区间 */
  decadal: [number, number] | null
  majorStars: Star[]
  minorStars: Star[]
  adjectiveStars: Star[]
}

export type ZiweiChart = ChartBase & {
  gender: '男' | '女'
  clock: WallClock
  used: WallClock
  place: Place | null
  correction: SolarCorrection | null

  solarDate: string
  lunarDate: string
  fourPillars: string
  shichen: string
  soul: string
  body: string
  fiveElements: string
  soulBranch: string
  bodyBranch: string

  palaces: Palace[]
  /** 生年四化：禄权科忌各落哪颗星 */
  birthMutagens: Array<{ mark: string; star: string; palace: string }>
  /** 当前大限与流年 */
  now: { decadal: string; yearly: string; decadalPalace: string; yearlyPalace: string } | null
}

const MUTAGEN_ORDER = ['禄', '权', '科', '忌']

function toStars(list: Array<{ name: string; brightness?: string; mutagen?: string }>): Star[] {
  return list.map((s) => ({
    name: s.name,
    brightness: s.brightness || undefined,
    mutagen: s.mutagen || undefined,
  }))
}

export function computeZiwei(input: ZiweiInput): ZiweiChart {
  const warnings: string[] = []

  let used = input.clock
  let correction: SolarCorrection | null = null

  if (input.useTrueSolarTime && input.place) {
    correction = toTrueSolarTime(input.clock, input.place)
    used = correction.trueSolar
    if (correction.dst) {
      warnings.push('出生当时该地正行夏令时（钟表比标准时快一小时），已在换算中扣除。')
    }
  } else if (!input.place) {
    warnings.push('未给出生地，未做真太阳时校正。时辰若在交界附近，命宫可能落到隔壁。')
  }

  // iztro 的时辰序：0 早子(00-01)，1 丑 …… 12 晚子(23-24)
  const timeIndex = Math.floor((used.hour + 1) / 2)
  const p = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${used.year}-${p(used.month)}-${p(used.day)}`

  const a = astro.astrolabeBySolarDate(dateStr, timeIndex, input.gender, true, 'zh-CN')

  const palaces: Palace[] = a.palaces.map((q) => ({
    index: q.index,
    name: q.name,
    isBody: q.isBodyPalace,
    stem: q.heavenlyStem,
    branch: q.earthlyBranch,
    decadal: q.decadal?.range ? ([q.decadal.range[0], q.decadal.range[1]] as [number, number]) : null,
    majorStars: toStars(q.majorStars),
    minorStars: toStars(q.minorStars),
    adjectiveStars: toStars(q.adjectiveStars),
  }))

  const birthMutagens: Array<{ mark: string; star: string; palace: string }> = []
  for (const q of palaces) {
    for (const s of [...q.majorStars, ...q.minorStars]) {
      if (s.mutagen) birthMutagens.push({ mark: s.mutagen, star: s.name, palace: q.name })
    }
  }
  birthMutagens.sort((x, y) => MUTAGEN_ORDER.indexOf(x.mark) - MUTAGEN_ORDER.indexOf(y.mark))

  let now: ZiweiChart['now'] = null
  try {
    const today = new Date()
    const h = a.horoscope(
      `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`,
    )
    now = {
      decadal: `${h.decadal.heavenlyStem}${h.decadal.earthlyBranch}`,
      yearly: `${h.yearly.heavenlyStem}${h.yearly.earthlyBranch}`,
      decadalPalace: palaces[h.decadal.index]?.name ?? '',
      yearlyPalace: palaces[h.yearly.index]?.name ?? '',
    }
  } catch {
    // 命主已过大限表的范围时 iztro 会抛，忽略即可
  }

  const chart: ZiweiChart = {
    warnings,
    digest: '',
    gender: input.gender,
    clock: input.clock,
    used,
    place: input.place,
    correction,
    solarDate: a.solarDate,
    lunarDate: a.lunarDate,
    fourPillars: a.chineseDate,
    shichen: a.time,
    soul: a.soul,
    body: a.body,
    fiveElements: a.fiveElementsClass,
    soulBranch: a.earthlyBranchOfSoulPalace,
    bodyBranch: a.earthlyBranchOfBodyPalace,
    palaces,
    birthMutagens,
    now,
  }
  chart.digest = digestOf(chart)
  return chart
}

function fmt(w: WallClock) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${w.year}-${p(w.month)}-${p(w.day)} ${p(w.hour)}:${p(w.minute)}`
}

function starLine(s: Star) {
  return s.name + (s.brightness ?? '') + (s.mutagen ? `化${s.mutagen}` : '')
}

function digestOf(c: ZiweiChart): string {
  const L: string[] = []
  L.push(`【命主】${c.gender}命　命主 ${c.soul}　身主 ${c.body}　${c.fiveElements}`)
  L.push(`【出生】钟表 ${fmt(c.clock)}　${c.place ? `${c.place.r}${c.place.n}` : '出生地未填'}`)
  if (c.correction) L.push(`【真太阳时】${fmt(c.used)}`)
  L.push(`【历】${c.solarDate}　${c.lunarDate}　${c.shichen}`)
  L.push(`【四柱】${c.fourPillars}`)
  L.push(`【命宫】${c.soulBranch}　【身宫】${c.bodyBranch}`)
  L.push('')
  L.push('【十二宫】')
  L.push('宫位\t宫干支\t大限\t主星\t辅星\t杂曜')
  for (const q of c.palaces) {
    L.push(
      [
        q.name + (q.isBody ? '(身宫)' : ''),
        q.stem + q.branch,
        q.decadal ? `${q.decadal[0]}-${q.decadal[1]}` : '—',
        q.majorStars.map(starLine).join(' ') || '空宫',
        q.minorStars.map(starLine).join(' ') || '—',
        q.adjectiveStars.map((s) => s.name).join(' ') || '—',
      ].join('\t'),
    )
  }
  L.push('')
  L.push(
    `【生年四化】${c.birthMutagens.map((m) => `${m.star}化${m.mark}在${m.palace}`).join('　') || '无'}`,
  )
  if (c.now) {
    L.push(
      `【当前】大限 ${c.now.decadal}（宫位落${c.now.decadalPalace}）　流年 ${c.now.yearly}（宫位落${c.now.yearlyPalace}）`,
    )
  }
  if (c.warnings.length) {
    L.push('')
    L.push('【排盘提醒】')
    c.warnings.forEach((w, i) => L.push(`${i + 1}. ${w}`))
  }
  return L.join('\n')
}
