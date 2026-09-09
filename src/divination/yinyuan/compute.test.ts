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
})
