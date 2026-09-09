import { register } from '../registry'
import type { DivinationModule, FormValues } from '../types'
import type { ZiweiChart } from './compute'

export const ZIWEI_SECTIONS = [
  '命身格局',
  '三方四正',
  '生年四化',
  '六亲宫位',
  '事业财帛',
  '大限',
  '流年',
  '趋吉之道',
]

export type ZiweiValues = FormValues & {
  gender: string
  date: string
  time: string
  place: string
  question: string
}

const mod: DivinationModule<ZiweiValues, ZiweiChart> = {
  id: 'ziwei',
  name: '紫微斗数',
  tagline: '布十二宫以观星曜四化与大限流年',
  mark: '斗',
  sections: ZIWEI_SECTIONS,

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
      hint: '斗数比八字更吃时辰——时辰错一个，十二宫整体挪位。',
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
