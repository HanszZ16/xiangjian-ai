import { corpusFor } from '../knowledge'
import type { ChartBase, DivinationModule, ModuleImpl } from '../divination/types'
import type { SystemBlock } from '../llm/types'
import { CHART_IS_AUTHORITATIVE, GUARDRAILS } from './guardrails'

/**
 * 装配一次解读的提示。
 *
 * 前两块是稳定的——角色、护栏、参考资料——所以打上缓存标记；命盘和问题
 * 放在 user 里，每次都变。这样重复起盘时只有末尾一小段要重新计费。
 */
export function buildSystem(mod: DivinationModule, impl: ModuleImpl): SystemBlock[] {
  const blocks: SystemBlock[] = [
    { text: `${impl.systemPrompt()}\n\n${GUARDRAILS}`, cache: true },
  ]
  const corpus = corpusFor(mod.id)
  if (corpus) blocks.push({ text: corpus, cache: true })
  return blocks
}

export function buildOpening(chart: ChartBase, question: string | undefined): string {
  const q = question?.trim()
  return [
    CHART_IS_AUTHORITATIVE,
    '',
    '━━━━━ 盘 ━━━━━',
    chart.digest,
    '',
    q ? `命主所问：${q}\n\n既定各节都要写，但与所问相关的那几节多着些笔墨。` : '命主没有特别要问的，通盘看一遍即可。',
  ].join('\n')
}
