import { describe, expect, it } from 'vitest'
import { computeBazi, type BaziInput } from './compute'
import type { Place } from '../../lib/solarTime'

const BEIJING: Place = {
  n: '北京', a: 'Beijing', r: '北京市', c: 'CN',
  lat: 39.9075, lon: 116.3972, tz: 'Asia/Shanghai',
}

function chart(over: Partial<BaziInput> & Pick<BaziInput, 'clock'>) {
  return computeBazi({
    gender: '男',
    hourKnown: true,
    place: null,
    manualLongitude: null,
    useTrueSolarTime: false,
    ...over,
  })
}

const gz = (c: ReturnType<typeof chart>) => c.pillars.map((p) => p.ganzhi)

/* 黄金用例取自 jinchenma94/bazi-skill 的 test_pai_pan.py（MIT），
   用来交叉验证 tyme4ts 与另一套独立实现算得一致。 */
describe('四柱', () => {
  it('1990-05-15 午时男 → 庚午 辛巳 庚辰 壬午', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 } })
    expect(gz(c)).toEqual(['庚午', '辛巳', '庚辰', '壬午'])
    expect(c.dayMaster).toBe('庚')
    expect(c.dayMasterElement).toBe('金')
  })

  it('立春之前年柱仍属前一年：1990-02-03 10:00 → 己巳年', () => {
    const c = chart({ clock: { year: 1990, month: 2, day: 3, hour: 10, minute: 0 } })
    expect(c.pillars[0].ganzhi).toBe('己巳')
  })

  it('夜子时 23:30 日柱进次日', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 23, minute: 30 } })
    expect(c.pillars[2].ganzhi).toBe('辛巳')
    expect(c.pillars[3].branch).toBe('子')
  })

  it('早子时 00:30 日柱仍属当日', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 0, minute: 30 } })
    expect(c.pillars[2].ganzhi).toBe('庚辰')
    expect(c.pillars[3].branch).toBe('子')
  })

  it('时辰不详只排三柱并出提醒', () => {
    const c = chart({
      clock: { year: 1990, month: 5, day: 15, hour: 0, minute: 0 },
      hourKnown: false,
    })
    expect(gz(c)).toEqual(['庚午', '辛巳', '庚辰'])
    expect(c.warnings.some((w) => w.includes('时辰不详'))).toBe(true)
  })
})

describe('大运顺逆', () => {
  it('阳年男顺排', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 } })
    expect(c.forward).toBe(true)
  })

  it('阳年女逆排', () => {
    const c = chart({
      clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 },
      gender: '女',
    })
    expect(c.forward).toBe(false)
  })

  it('阴年男逆排：1991 辛未年', () => {
    const c = chart({ clock: { year: 1991, month: 6, day: 15, hour: 12, minute: 0 } })
    expect(c.pillars[0].ganzhi).toBe('辛未')
    expect(c.forward).toBe(false)
  })

  it('十步大运首尾相接、干支连续', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 } })
    expect(c.decades).toHaveLength(10)
    expect(c.decades.map((d) => d.ganzhi).slice(0, 4)).toEqual(['壬午', '癸未', '甲申', '乙酉'])
    for (let i = 1; i < c.decades.length; i++) {
      expect(c.decades[i].startAge).toBe(c.decades[i - 1].endAge + 1)
    }
  })
})

describe('五行与藏干', () => {
  it('日主本气计入且总量为正', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 } })
    const total = Object.values(c.elements).reduce((a, b) => a + b, 0)
    expect(total).toBeGreaterThan(4)
    expect(c.elements['金']).toBeGreaterThan(0)
  })

  it('日柱十神标为日主，其余柱有十神', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 } })
    expect(c.pillars[2].stemStar).toBe('日主')
    expect(c.pillars[0].stemStar).toBe('比肩')
    expect(c.pillars[3].stemStar).toBe('食神')
  })

  it('藏干按本气中气余气排序', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 } })
    const si = c.pillars[1].hidden // 巳藏 丙庚戊
    expect(si.map((h) => h.stem)).toEqual(['丙', '庚', '戊'])
    expect(si[0].type).toBe('本气')
  })
})

describe('真太阳时', () => {
  it('北京偏西于 120° 中央经线，真太阳时早于钟表', () => {
    // 1993 年已停行夏令时，此处偏移为标准的 +8
    const c = chart({
      clock: { year: 1993, month: 5, day: 15, hour: 12, minute: 0 },
      place: BEIJING,
      useTrueSolarTime: true,
    })
    expect(c.correction).not.toBeNull()
    expect(c.correction!.utcOffsetMinutes).toBe(480)
    expect(c.correction!.longitudeMinutes).toBeCloseTo(116.3972 * 4 - 480, 2)
    expect(c.correction!.totalMinutes).toBeLessThan(0)
    expect(c.used.hour).toBe(11)
  })

  it('中国 1986–1991 的夏令时被 tzdata 如实反映', () => {
    // 1990-05-15 正在夏令时内，钟表比标准时快一小时
    const c = chart({
      clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 },
      place: BEIJING,
      useTrueSolarTime: true,
    })
    expect(c.correction!.dst).toBe(true)
    expect(c.correction!.utcOffsetMinutes).toBe(540)
    // 钟表午时，真太阳时其实已落到巳时——这正是校正的意义
    expect(c.used.hour).toBe(10)
    expect(c.pillars[3].branch).toBe('巳')
  })

  it('行夏令时时给出提醒', () => {
    const c = chart({
      clock: { year: 1988, month: 7, day: 15, hour: 12, minute: 0 },
      place: BEIJING,
      useTrueSolarTime: true,
    })
    expect(c.correction!.dst).toBe(true)
    expect(c.warnings.some((w) => w.includes('夏令时'))).toBe(true)
  })

  it('校正可以把时柱推到上一个时辰', () => {
    // 1993-05-15 北京，钟表 13:04 合真太阳时约 12:53，仍是午时
    const at = { year: 1993, month: 5, day: 15, hour: 13, minute: 4 }
    const raw = chart({ clock: at })
    const fixed = chart({ clock: at, place: BEIJING, useTrueSolarTime: true })
    expect(raw.pillars[3].branch).toBe('未')
    expect(fixed.pillars[3].branch).toBe('午')
  })

  it('临界十五分钟内给出提醒', () => {
    const c = chart({ clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 55 } })
    expect(c.warnings.some((w) => w.includes('时辰交界'))).toBe(true)
  })
})

describe('命盘摘要', () => {
  it('digest 含四柱、大运与提醒', () => {
    const c = chart({
      clock: { year: 1990, month: 5, day: 15, hour: 12, minute: 0 },
      place: BEIJING, useTrueSolarTime: true,
    })
    expect(c.digest).toContain('【四柱】')
    expect(c.digest).toContain('【大运】')
    expect(c.digest).toContain('【真太阳时】')
    expect(c.digest).toContain('庚辰')
  })
})
