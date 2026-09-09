import { register } from '../registry'
import type { DivinationModule, FormValues } from '../types'
import type { BaziChart } from './compute'

export const BAZI_SECTIONS = [
  '日主旺衰',
  '十神与六亲',
  '五行喜忌与调候',
  '格局成败',
  '大运',
  '流年',
  '印证',
  '趋吉之道',
]

export type BaziValues = FormValues & {
  gender: string
  date: string
  time: string
  hourUnknown: boolean
  place: string
  question: string
}

const mod: DivinationModule<BaziValues, BaziChart> = {
  id: 'bazi',
  name: '八字命理',
  tagline: '以生辰四柱推五行格局与一生大运',
  category: '命理',
  mark: '柱',
  sections: BAZI_SECTIONS,

  fields: [
    {
      kind: 'choice',
      name: 'gender',
      label: '性别',
      options: [
        { value: '男', label: '男命' },
        { value: '女', label: '女命' },
      ],
      defaultValue: '男',
    },
    { kind: 'date', name: 'date', label: '出生日期', hint: '公历。农历生日请先换算成公历。' },
    {
      kind: 'time',
      name: 'time',
      label: '出生时刻',
      hint: '越准越好，时柱差一刻就换一个字。',
      unknownField: { name: 'hourUnknown', label: '时辰不详' },
    },
    { kind: 'place', name: 'place', label: '出生地', hint: '用于真太阳时校正。' },
    {
      kind: 'text',
      name: 'question',
      label: '所问何事',
      placeholder: '不填也可以，那就通盘看一遍',
      multiline: true,
      optional: true,
    },
  ],

  load: () => import('./impl').then((m) => m.default),
}

register(mod as unknown as DivinationModule)
export default mod
