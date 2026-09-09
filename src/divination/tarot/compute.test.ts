import { describe, expect, it } from 'vitest'
import { computeTarot } from './compute'
import { DECK, SPREADS } from './deck'

describe('牌堆', () => {
  it('七十八张，无重复', () => {
    expect(DECK).toHaveLength(78)
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78)
    expect(DECK.filter((c) => c.arcana === 'major')).toHaveLength(22)
  })

  it('小牌四花色各十四张，宫廷牌在末四位', () => {
    for (const suit of ['权杖', '圣杯', '宝剑', '星币'] as const) {
      const s = DECK.filter((c) => c.suit === suit)
      expect(s).toHaveLength(14)
      expect(s[10].name).toBe(`${suit}侍从`)
      expect(s[13].name).toBe(`${suit}国王`)
    }
  })
})

describe('抽牌', () => {
  it('按牌阵位置数抽牌，且不重复', () => {
    const c = computeTarot({ spread: 'celtic', question: '' })
    expect(c.drawn).toHaveLength(SPREADS.celtic.positions.length)
    expect(new Set(c.drawn.map((d) => d.card.id)).size).toBe(c.drawn.length)
    expect(c.drawn.map((d) => d.position)).toEqual(SPREADS.celtic.positions)
  })

  it('同一种子复现同一副牌，含正逆位', () => {
    const a = computeTarot({ spread: 'three', question: '', seed: 'deadbeefcafe0001' })
    const b = computeTarot({ spread: 'three', question: '', seed: 'deadbeefcafe0001' })
    expect(b.drawn.map((d) => [d.card.id, d.reversed])).toEqual(
      a.drawn.map((d) => [d.card.id, d.reversed]),
    )
  })

  it('不同种子给出不同结果', () => {
    const a = computeTarot({ spread: 'celtic', question: '', seed: 'aaaa000000000001' })
    const b = computeTarot({ spread: 'celtic', question: '', seed: 'bbbb000000000002' })
    expect(b.drawn.map((d) => d.card.id)).not.toEqual(a.drawn.map((d) => d.card.id))
  })

  it('洗牌覆盖整副牌，不偏在牌堆前段', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      for (const d of computeTarot({ spread: 'celtic', question: '' }).drawn) seen.add(d.card.id)
    }
    expect(seen.size).toBe(78)
  })

  it('首张牌在整副牌上大致均匀，不偏在某几张', () => {
    // 每张牌被抽为首张的期望次数是 N/78；偏得离谱说明播种或洗牌有问题
    const N = 7800
    const count = new Map<string, number>()
    for (let i = 0; i < N; i++) {
      const id = computeTarot({ spread: 'single', question: '' }).drawn[0].card.id
      count.set(id, (count.get(id) ?? 0) + 1)
    }
    expect(count.size).toBe(78)
    const expected = N / 78
    for (const [, n] of count) {
      expect(n).toBeGreaterThan(expected * 0.4)
      expect(n).toBeLessThan(expected * 1.9)
    }
  })

  it('正逆位大致各半', () => {
    let reversed = 0
    const N = 4000
    for (let i = 0; i < N; i++) {
      if (computeTarot({ spread: 'single', question: '' }).drawn[0].reversed) reversed++
    }
    expect(reversed / N).toBeGreaterThan(0.42)
    expect(reversed / N).toBeLessThan(0.58)
  })

  it('摘要里带种子与分布', () => {
    const c = computeTarot({ spread: 'three', question: '换不换工作', seed: 'abcd000000000003' })
    expect(c.digest).toContain('【种子】abcd000000000003')
    expect(c.digest).toContain('【分布】')
    expect(c.digest).toMatch(/正位|逆位/)
  })
})
