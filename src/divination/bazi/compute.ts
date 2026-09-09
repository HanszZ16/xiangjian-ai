import {
  ChildLimit,
  EarthBranch,
  Gender,
  HeavenStem,
  SixtyCycleHour,
  SolarTime,
  type DecadeFortune,
  type SixtyCycle,
} from 'tyme4ts'
import type { ChartBase } from '../types'
import { toTrueSolarTime, type Place, type SolarCorrection, type WallClock } from '../../lib/solarTime'

export type BaziInput = {
  gender: '男' | '女'
  clock: WallClock
  /** 时辰不详时为 null，只排三柱 */
  hourKnown: boolean
  place: Place | null
  /** 手填经度，没有选城市时用；单位度，东正西负 */
  manualLongitude: number | null
  /** 是否做真太阳时校正 */
  useTrueSolarTime: boolean
  question?: string
}

export type Pillar = {
  /** 年 / 月 / 日 / 时 */
  position: string
  /** 干支，如「庚午」 */
  ganzhi: string
  stem: string
  branch: string
  stemElement: string
  branchElement: string
  /** 天干十神；日柱为「日主」 */
  stemStar: string
  /** 藏干及其十神，本气在前 */
  hidden: Array<{ stem: string; star: string; type: string }>
  /** 纳音 */
  sound: string
  /** 十二长生 */
  terrain: string
  /** 旬空 */
  empty: string
}

export type DecadeStep = {
  startAge: number
  endAge: number
  startYear: number
  ganzhi: string
  stemStar: string
  branchMainStar: string
}

export type AnnualStep = {
  age: number
  year: number
  ganzhi: string
  stemStar: string
}

export type BaziChart = ChartBase & {
  gender: '男' | '女'
  /** 用户填的钟表时间 */
  clock: WallClock
  /** 实际用于排盘的时刻 */
  used: WallClock
  place: Place | null
  correction: SolarCorrection | null
  hourKnown: boolean

  pillars: Pillar[]
  dayMaster: string
  dayMasterElement: string
  /** 五行力量分布，含藏干加权 */
  elements: Record<string, number>
  fetalOrigin: string
  ownSign: string
  bodySign: string

  forward: boolean
  startAge: string
  decades: DecadeStep[]
  /** 当前所处大运的序号，-1 表示尚在童限 */
  currentDecade: number
  annuals: AnnualStep[]
}

const ELEMENTS = ['木', '火', '土', '金', '水'] as const

/* 藏干权重：本气 1，中气 0.4，余气 0.2 —— 通行的取法之一 */
const HIDDEN_WEIGHT: Record<string, number> = { 本气: 1, 中气: 0.4, 余气: 0.2 }

function pillarOf(
  position: string,
  cycle: SixtyCycle,
  dayStem: string,
  isDay: boolean,
): Pillar {
  const stem = cycle.getHeavenStem()
  const branch = cycle.getEarthBranch()

  const hidden = branch.getHideHeavenStems().map((h) => ({
    stem: h.getHeavenStem().getName(),
    star: tenStar(dayStem, h.getHeavenStem().getName()),
    // HideHeavenStemType：0 余气 / 1 中气 / 2 本气
    type: h.getType() === 2 ? '本气' : h.getType() === 1 ? '中气' : '余气',
  }))

  return {
    position,
    ganzhi: cycle.getName(),
    stem: stem.getName(),
    branch: branch.getName(),
    stemElement: stem.getElement().getName(),
    branchElement: branch.getElement().getName(),
    stemStar: isDay ? '日主' : tenStar(dayStem, stem.getName()),
    hidden,
    sound: cycle.getSound().getName(),
    terrain: terrainOf(dayStem, branch.getName()),
    empty: cycle.getExtraEarthBranches().map((b) => b.getName()).join(''),
  }
}

/* 十神与十二长生都挂在 HeavenStem 实例上，按名字取一次 */
function tenStar(dayStem: string, target: string): string {
  return HeavenStem.fromName(dayStem).getTenStar(HeavenStem.fromName(target)).getName()
}

function terrainOf(dayStem: string, branch: string): string {
  return HeavenStem.fromName(dayStem).getTerrain(EarthBranch.fromName(branch)).getName()
}

export function computeBazi(input: BaziInput): BaziChart {
  const warnings: string[] = []

  /* ── 一、定出用于排盘的时刻 ───────────────────────────── */
  let used: WallClock = input.clock
  let correction: SolarCorrection | null = null

  const place =
    input.place ??
    (input.manualLongitude === null
      ? null
      : {
          n: '自填经度',
          a: '',
          r: '',
          c: '',
          lat: 0,
          lon: input.manualLongitude,
          tz: 'Asia/Shanghai',
        })

  if (input.useTrueSolarTime && input.hourKnown) {
    if (place) {
      correction = toTrueSolarTime(input.clock, place)
      used = correction.trueSolar
      if (correction.dst) {
        warnings.push(
          `出生当时该地正行夏令时（钟表比标准时快一小时），已在换算中扣除。`,
        )
      }
      if (place.c === 'CN' && place.lon < 97) {
        warnings.push(
          '新疆、西藏西部有些人家按当地时间报时，比北京时间晚两小时。若家里说的是当地时间，请把出生时刻加两小时后重填。',
        )
      }
    } else {
      warnings.push('未给出生地，未做真太阳时校正，时柱可能有偏差。')
    }
  } else if (!input.useTrueSolarTime && input.hourKnown) {
    warnings.push('已关闭真太阳时校正，时柱按钟表时间取。')
  }

  /* ── 二、排盘 ─────────────────────────────────────────── */
  const solar = SolarTime.fromYmdHms(
    used.year,
    used.month,
    used.day,
    input.hourKnown ? used.hour : 12,
    input.hourKnown ? used.minute : 0,
    0,
  )
  const sch = SixtyCycleHour.fromSolarTime(solar)
  const ec = sch.getEightChar()

  const dayStem = ec.getDay().getHeavenStem().getName()

  const pillars = [
    pillarOf('年', ec.getYear(), dayStem, false),
    pillarOf('月', ec.getMonth(), dayStem, false),
    pillarOf('日', ec.getDay(), dayStem, true),
    ...(input.hourKnown ? [pillarOf('时', ec.getHour(), dayStem, false)] : []),
  ]

  /* ── 三、临界提醒 ─────────────────────────────────────── */
  if (!input.hourKnown) {
    warnings.push('时辰不详，只排三柱。凡与时柱相关的断语（子女、晚年、部分神煞）一概从略。')
  } else {
    const mins = used.hour * 60 + used.minute
    // 时辰以奇数点为界：23:00、01:00、03:00 …… 子时跨午夜，故从 -60 起算
    const toBoundary = Math.min(
      ...Array.from({ length: 13 }, (_, i) => Math.abs(mins - (i * 120 - 60))),
    )
    if (toBoundary <= 15) {
      warnings.push(
        `真太阳时 ${fmt(used)} 距时辰交界不足十五分钟，出生时刻若有出入，时柱会换一个。`,
      )
    }
    if (used.hour === 23) {
      warnings.push('生于夜子时（23:00 后），此处按早晚子时法，日柱已进次日。')
    }
  }

  const term = solar.getTerm()
  const termDay = term.getJulianDay().getSolarDay()
  const bornDay = solar.getSolarDay()
  if (Math.abs(bornDay.subtract(termDay)) <= 1) {
    warnings.push(
      `生于「${term.getName()}」交节前后一日之内，月柱（乃至年柱）在此处最敏感，出生时刻须准确到分。`,
    )
  }

  /* ── 四、五行力量 ─────────────────────────────────────── */
  const elements: Record<string, number> = Object.fromEntries(ELEMENTS.map((e) => [e, 0]))
  for (const p of pillars) {
    elements[p.stemElement] += 1
    for (const h of p.hidden) {
      elements[HeavenStem.fromName(h.stem).getElement().getName()] += HIDDEN_WEIGHT[h.type] ?? 0.2
    }
  }
  for (const k of Object.keys(elements)) elements[k] = Math.round(elements[k] * 10) / 10

  /* ── 五、大运流年 ─────────────────────────────────────── */
  const cl = ChildLimit.fromSolarTime(solar, input.gender === '男' ? Gender.MAN : Gender.WOMAN)
  const startAge = `${cl.getYearCount()} 年 ${cl.getMonthCount()} 月 ${cl.getDayCount()} 天`

  const decades: DecadeStep[] = []
  let df: DecadeFortune = cl.getStartDecadeFortune()
  for (let i = 0; i < 10; i++) {
    const gz = df.getSixtyCycle()
    decades.push({
      startAge: df.getStartAge(),
      endAge: df.getEndAge(),
      startYear: df.getStartSixtyCycleYear().getYear(),
      ganzhi: gz.getName(),
      stemStar: tenStar(dayStem, gz.getHeavenStem().getName()),
      branchMainStar: tenStar(dayStem, gz.getEarthBranch().getHideHeavenStemMain().getName()),
    })
    df = df.next(1)
  }

  const thisYear = new Date().getFullYear()
  const age = thisYear - used.year
  const currentDecade = decades.findIndex((d) => age >= d.startAge && age <= d.endAge)

  const annuals: AnnualStep[] = []
  let fortune = cl.getStartFortune()
  const firstAge = fortune.getAge()
  const wantFrom = Math.max(firstAge, age - 3)
  fortune = fortune.next(wantFrom - firstAge)
  for (let i = 0; i < 9; i++) {
    const gz = fortune.getSixtyCycle()
    annuals.push({
      age: fortune.getAge(),
      year: fortune.getSixtyCycleYear().getYear(),
      ganzhi: gz.getName(),
      stemStar: tenStar(dayStem, gz.getHeavenStem().getName()),
    })
    fortune = fortune.next(1)
  }

  const chart: BaziChart = {
    warnings,
    digest: '',
    gender: input.gender,
    clock: input.clock,
    used,
    place,
    correction,
    hourKnown: input.hourKnown,
    pillars,
    dayMaster: dayStem,
    dayMasterElement: HeavenStem.fromName(dayStem).getElement().getName(),
    elements,
    fetalOrigin: ec.getFetalOrigin().getName(),
    ownSign: ec.getOwnSign().getName(),
    bodySign: ec.getBodySign().getName(),
    forward: cl.isForward(),
    startAge,
    decades,
    currentDecade,
    annuals,
  }
  chart.digest = digestOf(chart)
  return chart
}

function fmt(w: WallClock) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${w.year}-${p(w.month)}-${p(w.day)} ${p(w.hour)}:${p(w.minute)}`
}

/** 给模型看的结构化命盘。刻意写成表格，省 token 又不易读错。 */
function digestOf(c: BaziChart): string {
  const L: string[] = []
  L.push(`【命主】${c.gender}命　日主 ${c.dayMaster}${c.dayMasterElement}`)
  L.push(`【出生】钟表 ${fmt(c.clock)}　${c.place ? `${c.place.r}${c.place.n}` : '出生地未填'}`)
  if (c.correction) {
    L.push(
      `【真太阳时】${fmt(c.used)}（经度时差 ${c.correction.longitudeMinutes.toFixed(1)} 分，均时差 ${c.correction.equationMinutes.toFixed(1)} 分）`,
    )
  }
  L.push('')
  L.push('【四柱】')
  L.push('柱位\t干支\t天干十神\t藏干(十神)\t纳音\t长生\t旬空')
  for (const p of c.pillars) {
    const hid = p.hidden.map((h) => `${h.stem}(${h.star})`).join('·')
    L.push(`${p.position}\t${p.ganzhi}\t${p.stemStar}\t${hid}\t${p.sound}\t${p.terrain}\t${p.empty}`)
  }
  if (!c.hourKnown) L.push('时\t未知\t——\t时辰不详，只排三柱')
  L.push('')
  L.push(`【五行】${Object.entries(c.elements).map(([k, v]) => `${k} ${v}`).join('　')}`)
  L.push(`【胎元】${c.fetalOrigin}　【命宫】${c.ownSign}　【身宫】${c.bodySign}`)
  L.push('')
  L.push(`【大运】${c.forward ? '顺排' : '逆排'}，起运 ${c.startAge}`)
  L.push('岁数\t干支\t天干十神\t地支本气十神\t起始年')
  for (const d of c.decades) {
    L.push(`${d.startAge}-${d.endAge}\t${d.ganzhi}\t${d.stemStar}\t${d.branchMainStar}\t${d.startYear}`)
  }
  if (c.currentDecade >= 0) {
    const d = c.decades[c.currentDecade]
    L.push(`当前行运：${d.startAge}-${d.endAge} 岁 ${d.ganzhi}`)
  }
  L.push('')
  L.push('【流年】')
  L.push(c.annuals.map((a) => `${a.year}(${a.age}岁)${a.ganzhi}·${a.stemStar}`).join('　'))
  if (c.warnings.length) {
    L.push('')
    L.push('【排盘提醒】')
    c.warnings.forEach((w, i) => L.push(`${i + 1}. ${w}`))
  }
  return L.join('\n')
}
