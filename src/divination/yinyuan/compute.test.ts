import { describe, expect, it } from 'vitest'
import { computeYinyuan } from './compute'

const base = {
  name: '', gender: '男' as const, time: '12:00', hourKnown: true, place: null,
}

describe('姻缘合参', () => {
  it('完整模式按双方四柱拆出五项依据', () => {
    const chart = computeYinyuan({
      mode: 'bazi',
      a: { ...base, name: '甲', date: '1990-05-15' },
      b: { ...base, name: '乙', gender: '女', date: '1991-11-03' },
    })
    expect(chart.people[0].chart.pillars).toHaveLength(4)
    expect(chart.dimensions).toHaveLength(5)
    expect(chart.score).toBeGreaterThanOrEqual(0)
    expect(chart.score).toBeLessThanOrEqual(100)
    expect(chart.digest).toContain('规则拆分')
  })

  it('生肖模式只以年柱给出轻量结果并明确边界', () => {
    const chart = computeYinyuan({
      mode: 'zodiac',
      a: { ...base, date: '1990-05-15' },
      b: { ...base, date: '1997-05-15' },
    })
    expect(chart.dimensions).toHaveLength(1)
    expect(chart.warnings.join('')).toContain('只看')
    expect(chart.digest).toContain('生肖速配')
  })

  /* 三合局与三刑都是三支成组，用 includes 判「两支是否同组」时，
     同一个字出现两次也会命中，于是所有同地支都被读成三合局。 */
  it('同地支走同气或自刑，不落三合局', () => {
    const same = (date: string, other: string) => computeYinyuan({
      mode: 'zodiac',
      a: { ...base, name: '甲', date },
      b: { ...base, name: '乙', date: other },
    }).dimensions[0].summary

    expect(same('1992-05-15', '2004-05-15')).toContain('申申同气')
    expect(same('1986-05-15', '1998-05-15')).toContain('寅寅同气')
    expect(same('1988-05-15', '2000-05-15')).toContain('辰辰自刑')
  })

  it('两人都不填称呼时也能分辨甲乙', () => {
    const chart = computeYinyuan({
      mode: 'bazi',
      a: { ...base, date: '1990-05-15' },
      b: { ...base, date: '1992-08-20' },
    })
    expect(chart.people[0].name).not.toBe(chart.people[1].name)
  })
})
