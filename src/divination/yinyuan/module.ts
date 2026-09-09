import { register } from '../registry'
import type { DivinationModule, FormValues } from '../types'
import type { YinyuanChart } from './compute'

export const YINYUAN_SECTIONS = [
  '缘分总览',
  '年柱与日柱',
  '五行互补',
  '相处动力',
  '风险与边界',
  '经营建议',
]

export type YinyuanValues = FormValues & {
  mode: string
  aName: string
  aGender: string
  aDate: string
  aTime: string
  aHourUnknown: boolean
  aPlace: string
  bName: string
  bGender: string
  bDate: string
  bTime: string
  bHourUnknown: boolean
  bPlace: string
  question: string
}

const mod: DivinationModule<YinyuanValues, YinyuanChart> = {
  id: 'yinyuan',
  name: '姻缘合参',
  tagline: '把两个人的年柱、日柱与五行放在同一张盘上看',
  category: '合参',
  mark: '缘',
  sections: YINYUAN_SECTIONS,
  fields: [
    {
      kind: 'choice',
      name: 'mode',
      label: '合参深度',
      options: [
        { value: 'bazi', label: '八字合参' },
        { value: 'zodiac', label: '生肖速配' },
      ],
      defaultValue: 'bazi',
      optionHint: {
        bazi: '四柱、日主与五行一起看；不知道时辰也能排三柱，但会少一层依据。',
        zodiac: '只取立春划分后的年柱作轻量参考，适合对方资料不全时。',
      },
    },
    { kind: 'section', name: 'personA', label: '你的生辰', hint: '第一位合参者', mark: '甲' },
    { kind: 'text', name: 'aName', label: '称呼', placeholder: '例如：我', optional: true },
    {
      kind: 'choice',
      name: 'aGender',
      label: '性别',
      options: [
        { value: '男', label: '男命' },
        { value: '女', label: '女命' },
      ],
      defaultValue: '男',
      visibleWhen: { name: 'mode', equals: 'bazi' },
    },
    { kind: 'date', name: 'aDate', label: '出生日期', hint: '公历；年柱以立春为界。' },
    {
      kind: 'time',
      name: 'aTime',
      label: '出生时刻',
      hint: '用于完整四柱与真太阳时校正。',
      unknownField: { name: 'aHourUnknown', label: '时辰不详' },
      visibleWhen: { name: 'mode', equals: 'bazi' },
    },
    {
      kind: 'place',
      name: 'aPlace',
      label: '出生地',
      hint: '用于真太阳时校正，可留空。',
      visibleWhen: { name: 'mode', equals: 'bazi' },
    },
    { kind: 'section', name: 'personB', label: '对方生辰', hint: '第二位合参者', mark: '乙' },
    { kind: 'text', name: 'bName', label: '称呼', placeholder: '例如：对方', optional: true },
    {
      kind: 'choice',
      name: 'bGender',
      label: '性别',
      options: [
        { value: '男', label: '男命' },
        { value: '女', label: '女命' },
      ],
      defaultValue: '女',
      visibleWhen: { name: 'mode', equals: 'bazi' },
    },
    { kind: 'date', name: 'bDate', label: '出生日期', hint: '公历；年柱以立春为界。' },
    {
      kind: 'time',
      name: 'bTime',
      label: '出生时刻',
      hint: '不知道可勾选时辰不详。',
      unknownField: { name: 'bHourUnknown', label: '时辰不详' },
      visibleWhen: { name: 'mode', equals: 'bazi' },
    },
    {
      kind: 'place',
      name: 'bPlace',
      label: '出生地',
      hint: '用于真太阳时校正，可留空。',
      visibleWhen: { name: 'mode', equals: 'bazi' },
    },
    { kind: 'section', name: 'relationship', label: '这段关系', hint: '把最想弄清的事说具体', mark: '问' },
    {
      kind: 'text',
      name: 'question',
      label: '所问何事',
      placeholder: '例如：相处总在同一件事上争执，盘里能看出双方的动力吗？',
      multiline: true,
      optional: true,
    },
  ],
  load: () => import('./impl').then((m) => m.default),
}

register(mod as unknown as DivinationModule)
export default mod
