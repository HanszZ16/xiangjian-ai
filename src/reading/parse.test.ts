import { describe, expect, it } from 'vitest'
import { extractProofs, splitSections } from './parse'

describe('切章', () => {
  const expected = ['日主旺衰', '十神与六亲']

  it('按 ## 切，节名以预期表归一', () => {
    const s = splitSections('## 一、日主旺衰\n甲木生于……\n\n## 十神与六亲\n正官……', expected)
    expect(s.map((x) => x.title)).toEqual(['日主旺衰', '十神与六亲'])
    expect(s[0].body).toContain('甲木生于')
  })

  it('未闭合的末章照样返回', () => {
    const s = splitSections('## 日主旺衰\n写到一半', expected)
    expect(s).toHaveLength(1)
    expect(s[0].body).toBe('写到一半')
  })

  it('开头的引子不冒充章名', () => {
    const s = splitSections('先说一句题外话。\n\n## 日主旺衰\n正文', expected)
    expect(s[0].title).toBe('')
    expect(s[1].title).toBe('日主旺衰')
  })

  it('三级标题留在所属章节，不误切成新章', () => {
    const out = splitSections('## 趋吉之道\n\n### 今天可做\n\n先整理桌面。', ['趋吉之道'])
    expect(out).toHaveLength(1)
    expect(out[0].title).toBe('趋吉之道')
    expect(out[0].body).toContain('### 今天可做')
  })
})

describe('印证条目', () => {
  it('抽得出年份、虚岁与事由', () => {
    const p = extractProofs(
      '## 印证\n- [印证] 1998年（9岁）｜ 居所或家庭结构上应有一次变动\n- [印证] 2007年（18岁）| 学业上有一次抉择\n寻常的一行不算。',
    )
    expect(p).toHaveLength(2)
    expect(p[0]).toMatchObject({ year: '1998', age: '9岁', claim: '居所或家庭结构上应有一次变动' })
    expect(p[1].year).toBe('2007')
  })

  it('没有竖线的条目丢弃，免得渲染出半截', () => {
    expect(extractProofs('- [印证] 格式不对')).toHaveLength(0)
  })
})
