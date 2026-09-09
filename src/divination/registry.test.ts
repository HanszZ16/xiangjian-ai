import { describe, expect, it } from 'vitest'
import './modules'
import { allModules, findModule } from './registry'
import { buildOpening, buildSystem } from '../prompt/assemble'
import type { FormValues } from './types'

/* 模块拆成了「元信息」与「实作」两半，实作按需加载。
   这条测试把所有模块各自完整地走一遍：加载 → 排盘 → 装配提示，
   免得哪个模块的动态 import 写错了要等到线上点开才发现。 */

const INPUTS: Record<string, FormValues> = {
  bazi: {
    gender: '男',
    date: '1990-05-15',
    time: '12:00',
    hourUnknown: false,
    place: '',
    question: '今年该不该换工作',
  },
  ziwei: {
    gender: '女',
    date: '1988-11-03',
    time: '07:30',
    place: '',
    question: '',
  },
  tarot: { spread: 'three', question: '这段关系还要不要继续' },
  yinyuan: {
    mode: 'bazi',
    aName: '甲', aGender: '男', aDate: '1990-05-15', aTime: '12:00', aHourUnknown: false, aPlace: '',
    bName: '乙', bGender: '女', bDate: '1992-08-20', bTime: '09:30', bHourUnknown: false, bPlace: '',
    question: '两个人遇事节奏不同，如何磨合',
  },
  fengshui: {
    facing: '南', completedDate: '2018-06-01', residentGender: '男',
    residentBirthDate: '1985-05-01', focus: '事业', layout: '书房在东', question: '书桌如何安排',
  },
}

describe('模块注册表', () => {
  it('五个门类都挂上了，id 与元信息齐全', () => {
    const ids = allModules().map((m) => m.id)
    expect(ids).toEqual(['bazi', 'ziwei', 'yinyuan', 'fengshui', 'tarot'])
    for (const m of allModules()) {
      expect(m.name).toBeTruthy()
      expect(m.tagline).toBeTruthy()
      expect(m.mark).toHaveLength(1)
      expect(m.fields.length).toBeGreaterThan(0)
      expect(m.sections.length).toBeGreaterThan(2)
    }
  })

  it('表单字段名不重复，且每个必填项都有默认或可填', () => {
    for (const m of allModules()) {
      const names = m.fields.map((f) => f.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })
})

describe.each(allModules().map((m) => m.id))('%s 走通一遍', (id) => {
  const mod = findModule(id)!

  it('实作加载得到，排得出盘，摘要非空', async () => {
    const impl = await mod.load()
    expect(typeof impl.compute).toBe('function')
    expect(impl.ChartView).toBeTruthy()

    const chart = impl.compute(INPUTS[id])
    expect(chart.digest.length).toBeGreaterThan(120)
    expect(Array.isArray(chart.warnings)).toBe(true)
    expect(impl.knowledgeTags(chart).length).toBeGreaterThan(0)
  })

  it('提示装配完整：护栏、章节名、命盘都在', async () => {
    const impl = await mod.load()
    const chart = impl.compute(INPUTS[id])

    const system = buildSystem(mod, impl)
    const joined = system.map((b) => b.text).join('\n')
    expect(joined).toContain('反巴纳姆')
    expect(joined).toContain('400-161-9995')
    for (const s of mod.sections) expect(joined).toContain(s)
    // 稳定的部分要打上缓存标记，否则每次起盘都全额计费
    expect(system.every((b) => b.cache)).toBe(true)

    const opening = buildOpening(chart, String(INPUTS[id].question ?? ''))
    expect(opening).toContain('唯一的事实依据')
    expect(opening).toContain(chart.digest)
  })
})
