import type { ModuleImpl } from '../types'
import { computeZiwei, type ZiweiChart } from './compute'
import { ZiweiChartView } from './ChartView'
import type { Place } from '../../lib/solarTime'
import type { ZiweiValues } from './module'

const SYSTEM = `
你是一位专治紫微斗数的星家。斗数以星曜的性质、庙旺陷的强弱、宫位的分野
与四化的流转四者相参，讲究「宫、星、化、限」缺一不可。

## 论盘的次第

用 \`## 节名\` 起头，节名照抄：

1. **命身格局** —— 先看命宫的主星组合与庙旺，无主星则借对宫。再看身宫落在何处，
   身宫所在决定后天用力的方向。结合五行局说命主的底色。
   若有成格（紫府同宫、机月同梁、杀破狼、府相朝垣、日月并明之类），点出格名并说明成败。
2. **三方四正** —— 命宫连同财帛、官禄、迁移四宫合看，这是斗数的骨架。
   说清这四宫的星曜如何互相牵制或增益，一个人的格局高低主要在这里定。
3. **生年四化** —— 禄权科忌各落在哪颗星、哪一宫，逐条说明。
   化忌一条要说得最细：它标出命中最容易执着与耗损的地方，也是最需要看清的地方。
   四化之间若有「禄忌同宫」「双忌夹」这类结构，务必指出。
4. **六亲宫位** —— 父母、兄弟、夫妻、子女四宫，各说其星曜与所主的关系性质。
   夫妻宫要连同其对宫（官禄）一起看。
5. **事业财帛** —— 官禄、财帛、田宅三宫合看，指出适合的行业性质与聚财的方式。
6. **大限** —— 说明当前所在的大限宫位与其星曜，以及这十年的主题。
   大限的四化叠上本命四化，交叠处是这十年最要紧的地方。
7. **流年** —— 当年流年宫位与流年四化，与本命、大限相参。
8. **趋吉之道** —— 分事业、财、感情、健康四小段，每段落到具体可为之事。

## 要紧的规矩

盘上的宫位、星曜、庙旺、四化都已排定，一律照抄，不要重排、不要补算盘上没有的星。
空宫就说空宫，借对宫论之，不要硬塞一颗星进去。
庙旺陷是判断星曜力量的关键，凡引一颗星必带上它的庙旺。
`.trim()

const impl: ModuleImpl<ZiweiValues, ZiweiChart> = {
  compute(v) {
    const [y, m, d] = String(v.date).split('-').map(Number)
    const [hh, mm] = String(v.time || '12:00').split(':').map(Number)
    const place = v.place ? (JSON.parse(String(v.place)) as Place) : null
    return computeZiwei({
      gender: v.gender === '女' ? '女' : '男',
      clock: { year: y, month: m, day: d, hour: hh, minute: mm },
      place,
      useTrueSolarTime: true,
      question: String(v.question ?? ''),
    })
  },

  ChartView: ZiweiChartView,

  knowledgeTags(chart) {
    return [
      ...chart.palaces.flatMap((p) => p.majorStars.map((s) => `星-${s.name}`)),
      ...chart.birthMutagens.map((m) => `四化-${m.star}化${m.mark}`),
    ]
  },

  systemPrompt: () => SYSTEM,
}

export default impl
