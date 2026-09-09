import { describe, expect, it } from 'vitest'
import { computeZiwei } from './compute'
import { computeBazi } from '../bazi/compute'
import type { Place } from '../../lib/solarTime'

const BEIJING: Place = {
  n: '北京', a: 'Beijing', r: '北京市', c: 'CN',
  lat: 39.9075, lon: 116.3972, tz: 'Asia/Shanghai',
}

const CASE = { year: 1990, month: 5, day: 15, hour: 12, minute: 0 }

function chart(over = {}) {
  return computeZiwei({
    gender: '男', clock: CASE, place: null, useTrueSolarTime: false, ...over,
  })
}

describe('紫微排盘', () => {
  it('十二宫齐备，宫名不重复', () => {
    const c = chart()
    expect(c.palaces).toHaveLength(12)
    expect(new Set(c.palaces.map((p) => p.name)).size).toBe(12)
    expect(c.palaces.some((p) => p.name === '命宫')).toBe(true)
  })

  it('地支按十二宫顺行，寅起首宫', () => {
    const c = chart()
    expect(c.palaces.map((p) => p.branch)).toEqual(
      ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    )
  })

  it('命主身主五行局都取得到', () => {
    const c = chart()
    expect(c.soul).toBeTruthy()
    expect(c.body).toBeTruthy()
    expect(c.fiveElements).toMatch(/局$/)
    expect(c.palaces.filter((p) => p.isBody)).toHaveLength(1)
  })

  it('生年四化恰为禄权科忌四条', () => {
    const c = chart()
    expect(c.birthMutagens.map((m) => m.mark)).toEqual(['禄', '权', '科', '忌'])
    for (const m of c.birthMutagens) expect(m.star).toBeTruthy()
  })

  it('四柱与八字引擎算得一致——两套独立实现互为验证', () => {
    const z = chart()
    const b = computeBazi({
      gender: '男', clock: CASE, hourKnown: true,
      place: null, manualLongitude: null, useTrueSolarTime: false,
    })
    expect(z.fourPillars).toBe(b.pillars.map((p) => p.ganzhi).join(' '))
  })

  it('大限区间首尾相接', () => {
    const withRange = chart().palaces.filter((p) => p.decadal)
    const sorted = withRange.map((p) => p.decadal!).sort((a, b) => a[0] - b[0])
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i][0]).toBe(sorted[i - 1][1] + 1)
    }
  })

  it('真太阳时会改变时辰，进而移动命宫', () => {
    // 1990-05-15 北京钟表 12:00 行夏令时，真太阳时约 10:49，午时变巳时
    const raw = chart()
    const fixed = chart({ place: BEIJING, useTrueSolarTime: true })
    expect(raw.shichen).toBe('午时')
    expect(fixed.shichen).toBe('巳时')
    expect(fixed.soulBranch).not.toBe(raw.soulBranch)
    expect(fixed.warnings.some((w) => w.includes('夏令时'))).toBe(true)
  })

  it('摘要含十二宫与四化', () => {
    const c = chart()
    expect(c.digest).toContain('【十二宫】')
    expect(c.digest).toContain('【生年四化】')
    expect(c.digest).toContain('命宫')
  })
})
