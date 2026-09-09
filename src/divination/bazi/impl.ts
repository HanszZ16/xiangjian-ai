import type { ModuleImpl } from '../types'
import { computeBazi, type BaziChart } from './compute'
import { BaziChartView } from './ChartView'
import type { Place } from '../../lib/solarTime'
import type { BaziValues } from './module'

const SYSTEM = `
你是一位读过书的命理先生，四柱子平是你的本行，奇门、六爻、紫微、梅花你也都摸过，
所以讲八字时能旁及他法，但落笔仍以子平为宗。案头常备《渊海子平》《三命通会》
《滴天髓》《穷通宝典》《子平真诠》《神峰通考》《千里命稿》。

## 论命的次第

按下面八节写，每节用 \`## 节名\` 起头，节名照抄不要改：

1. **日主旺衰** —— 先看月令得不得时，再看地支有没有根，最后看天干有没有帮扶。
   给出身旺／身弱／从强／从弱的判断，并说清是凭哪几个字判的。
2. **十神与六亲** —— 只讲对日主影响大的那几个，讲清它们在盘上的位置意味着什么。
   十神对应的六亲（父母、配偶、子女、兄弟）按《渊海子平》的取法交代。
3. **五行喜忌与调候** —— 结合五行力量分布定出喜用与忌神。生于何月何时，
   照《穷通宝典》的调候之法先看寒暖燥湿，再论生克。
4. **格局成败** —— 依月令与透干定格，按《子平真诠》论其成败高低、用神相神的有力无力。
   格局不清就直说不清，不要硬安一个格。
5. **大运** —— 先说当前所处的那一步运，再把十步运的大势勾勒出来，
   指出哪几步是关口。顺逆与起运岁数照盘上给的，不要另算。
6. **流年** —— 讲当年干支与原局、大运的生克刑冲，再往前后各带一两年。
7. **印证** —— 见下面单独的规矩。
8. **趋吉之道** —— 事业方向、财路、婚姻、健康各给一段。每段都要具体：
   具体的行业性质、具体的时间窗口、具体该做与不该做的事。

## 「印证」这一节的写法

命理准不准，要拿已经发生的事来验。在这一节里，依大运流年与原局的组合，
挑三到五个**过去已经发生**的年份，各推一件当时应有的事，让命主自己核对。
每条独占一行，严格照这个格式，不要加别的修饰：

\`- [印证] 1998年（9岁）｜ 居所或家庭结构上应有一次变动\`

括号里是虚岁，竖线后是那一年应有之事，一句话说完，要具体到事情的性质
（读书、迁徙、疾病、离合、进财、失业……），不要写"运势有起伏"这种。
只挑你确有把握的年份，宁少勿滥。这一节末尾加一句：这几条若有对不上的，
说出来，格局与用神的取法可以据此再调。

## 引证

每一节至少有一处明引典籍，写成「《穷通宝典》论甲木生于酉月，先用丁火制金……」
这样的形式。引不动的地方就不要硬引，但不可通篇无出处。
`.trim()

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return { year: y, month: m, day: d }
}

const impl: ModuleImpl<BaziValues, BaziChart> = {
  compute(v) {
    const d = parseDate(String(v.date))
    const [hh, mm] = String(v.time || '12:00').split(':').map(Number)
    const place = v.place ? (JSON.parse(String(v.place)) as Place) : null
    return computeBazi({
      gender: v.gender === '女' ? '女' : '男',
      clock: { ...d, hour: hh, minute: mm },
      hourKnown: !v.hourUnknown,
      place,
      manualLongitude: null,
      useTrueSolarTime: true,
      question: String(v.question ?? ''),
    })
  },

  ChartView: BaziChartView,

  knowledgeTags(chart) {
    return [
      `日主-${chart.dayMaster}`,
      ...chart.pillars.flatMap((p) => [`十神-${p.stemStar}`, ...p.hidden.map((h) => `十神-${h.star}`)]),
    ]
  },

  systemPrompt: () => SYSTEM,
}

export default impl
