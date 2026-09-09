import type { ModuleImpl } from '../types'
import type { Place } from '../../lib/solarTime'
import type { YinyuanValues } from './module'
import { computeYinyuan, type YinyuanChart } from './compute'
import { YinyuanChartView } from './ChartView'

const SYSTEM = `
你是一位熟悉子平法与地支关系的合婚先生。合参的目的不是给感情盖章，而是把两个人之间
容易相生、容易较劲的部分摊开来说，让当事人知道该如何相处。盘面上的分数是本地程序按
公开规则计算出的阅读索引，不是成功率，也不许把它说成命定结论。

## 写法

严格用下面六个 \`## 节名\`，顺序与字面都不要改：

1. **缘分总览** —— 先解释合参方式和指数，只用两三句交代最强的助力与最要紧的张力。
2. **年柱与日柱** —— 生肖速配只谈年柱，不得假装有日柱资料。八字合参则分开说年干年支、
   日干日支；每条判断都点名具体两个字与合、冲、害、刑或生克关系。
3. **五行互补** —— 对照两组五行数值，说清谁在哪一行能补谁、哪里同旺而容易放大。
   不把某一行少简单说成“缺”，也不据此建议改名、买物或改变人格。
4. **相处动力** —— 把术语翻成真实互动：决策速度、表达习惯、边界、共同生活节奏。
   只写盘面有依据的倾向，不编造双方经历。
5. **风险与边界** —— 说清一至三处摩擦会在什么场景出现，并区分命理张力与现实中的控制、
   欺骗、暴力；现实中的伤害不能被“命里相冲”合理化。
6. **经营建议** —— 给双方各一条、共同一条具体建议，落到可以观察或约定的行为。

不回答“该不该分手”“能不能结婚”这种替人做决定的问题。对方资料不完整就降低结论强度，
不推测对方隐私，不许用“克夫”“克妻”“注定孤独”等恐吓说法。
`.trim()

function placeOf(value: string | boolean | undefined): Place | null {
  if (!value) return null
  return JSON.parse(String(value)) as Place
}

const impl: ModuleImpl<YinyuanValues, YinyuanChart> = {
  compute(v) {
    const mode = v.mode === 'zodiac' ? 'zodiac' : 'bazi'
    return computeYinyuan({
      mode,
      a: {
        name: String(v.aName ?? ''),
        gender: v.aGender === '女' ? '女' : '男',
        date: String(v.aDate),
        time: String(v.aTime || '12:00'),
        hourKnown: !v.aHourUnknown,
        place: placeOf(v.aPlace),
      },
      b: {
        name: String(v.bName ?? ''),
        gender: v.bGender === '男' ? '男' : '女',
        date: String(v.bDate),
        time: String(v.bTime || '12:00'),
        hourKnown: !v.bHourUnknown,
        place: placeOf(v.bPlace),
      },
      question: String(v.question ?? ''),
    })
  },
  ChartView: YinyuanChartView,
  knowledgeTags(chart) {
    return [
      ...chart.people.map((p) => `年支-${p.chart.pillars[0].branch}`),
      ...chart.dimensions.map((d) => `合参-${d.name}`),
    ]
  },
  systemPrompt: () => SYSTEM,
}

export default impl
