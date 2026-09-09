import { describe, expect, it } from 'vitest'
import { computeFengshui, lifeGua } from './compute'

describe('阳宅八宅', () => {
  it('坐北朝南为坎宅，八个游年方位不重复', () => {
    const chart = computeFengshui({
      facing: '南', completedDate: '2018-06-01', residentGender: '男',
      residentBirthDate: '1985-05-01', focus: '事业',
    })
    expect(chart.sitting).toBe('北')
    expect(chart.houseGua).toBe('坎')
    expect(new Set(chart.cells.map((c) => c.star)).size).toBe(8)
    expect(chart.cells.find((c) => c.direction === '东南')?.star).toBe('生气')
    expect(chart.digest).toContain('八宅落位')
  })

  it('九运年份与立春前出生年都能校正', () => {
    const chart = computeFengshui({
      facing: '东', completedDate: '2026-01-01', residentGender: '女',
      residentBirthDate: '1990-02-03', focus: '整体',
    })
    expect(chart.period).toBe(9)
    expect(chart.adjustedBirthYear).toBe(1989)
  })

  it('命卦 5 按性别分别寄坤与艮', () => {
    expect(lifeGua(1995, '男')).toEqual({ number: 2, gua: '坤' })
    expect(lifeGua(2008, '女')).toEqual({ number: 8, gua: '艮' })
    expect(lifeGua(1985, '男')).toEqual({ number: 6, gua: '乾' })
  })
})
