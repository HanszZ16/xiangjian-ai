import type { ModuleImpl } from '../types'
import type { FengshuiValues } from './module'
import { computeFengshui, type Direction, type FengshuiChart } from './compute'
import { FengshuiChartView } from './ChartView'

const SYSTEM = `
你是一位谨慎的阳宅顾问，以八宅明镜作方位骨架，但始终坚持「形势为体，理气为用」。
程序已经给出宅卦、命卦和八方游年，照盘解释，不重算、不补造二十四山或玄空飞星。

严格使用下面六个 \`## 节名\`，顺序与字面都不要改：

1. **宅与人** —— 说明坐向、宅卦、东西四宅与常住者命卦。宅命同组说可借力之处，
   异组说如何取舍，不用“凶宅”“不能住”等绝对措辞。
2. **八方落位** —— 按盘上八方逐项解读，四吉方讲适合承载的活动，四凶方讲降噪、降风险与
   低频使用，不建议购买法器或摆件。
3. **重点空间** —— 围绕用户选择的重点与已描述的房间位置，给出床、书桌、常坐位、收纳等
   可执行建议。用户没提供某个房间的位置就明确说“尚需核对”，不能编造户型。
4. **形势核对** —— 列出三到五个现场应检查的现实条件：采光、通风、潮湿、噪声、门窗直冲、
   床头承重墙、厨房火源与逃生动线等。现实安全的优先级高于方位吉凶。
5. **可执行调整** —— 按“今天可做 / 有条件再做”分层，只建议移位、遮挡、照明、通风、收纳、
   动线这类普通空间动作；不推销风水物件，不用恐吓促成消费。
6. **边界说明** —— 说明这是八方级初筛。要排玄空飞星至少还需要建造运、实测坐向度数和
   户型落宫；本盘未计算的内容一律不下结论。

健康、财务、关系只谈空间使用的支持条件，不做医学判断，不承诺改运，不把现实问题归咎于煞气。
`.trim()

const impl: ModuleImpl<FengshuiValues, FengshuiChart> = {
  compute(v) {
    return computeFengshui({
      facing: String(v.facing || '南') as Direction,
      completedDate: String(v.completedDate),
      residentGender: v.residentGender === '女' ? '女' : '男',
      residentBirthDate: String(v.residentBirthDate),
      focus: String(v.focus || '整体'),
      layout: String(v.layout ?? ''),
      question: String(v.question ?? ''),
    })
  },
  ChartView: FengshuiChartView,
  knowledgeTags(chart) {
    return [`宅卦-${chart.houseGua}`, `命卦-${chart.residentGua}`, ...chart.cells.map((c) => `游年-${c.star}`)]
  },
  systemPrompt: () => SYSTEM,
}

export default impl
