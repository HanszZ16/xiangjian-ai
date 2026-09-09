import { register } from '../registry'
import type { DivinationModule, FormValues } from '../types'
import type { TarotChart } from './compute'
import { SPREADS, type SpreadId } from './deck'
export const TAROT_SECTIONS = ['整体能量', '逐牌', '牌间关系', '综合', '一个问题']

export type TarotValues = FormValues & { spread: string; question: string }

const mod: DivinationModule<TarotValues, TarotChart> = {
  id: 'tarot',
  name: '塔罗牌',
  tagline: '洗牌切牌以照见当下的处境与去路',
  mark: '牌',
  sections: TAROT_SECTIONS,

  fields: [
    {
      kind: 'choice',
      name: 'spread',
      label: '牌阵',
      options: (Object.keys(SPREADS) as SpreadId[]).map((id) => ({
        value: id,
        label: SPREADS[id].name,
      })),
      defaultValue: 'three',
      optionHint: Object.fromEntries(
        (Object.keys(SPREADS) as SpreadId[]).map((id) => [
          id,
          `${SPREADS[id].hint}　·　${SPREADS[id].positions.join(' / ')}`,
        ]),
      ),
    },
    {
      kind: 'text',
      name: 'question',
      label: '所问何事',
      placeholder: '越具体，牌说得越具体',
      multiline: true,
    },
  ],

  load: () => import('./impl').then((m) => m.default),
}

register(mod as unknown as DivinationModule)
export default mod
