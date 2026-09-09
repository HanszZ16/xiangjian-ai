import { register } from '../registry'
import type { DivinationModule, FormValues } from '../types'
import type { FengshuiChart } from './compute'

export const FENGSHUI_SECTIONS = [
  '宅与人',
  '八方落位',
  '重点空间',
  '形势核对',
  '可执行调整',
  '边界说明',
]

export type FengshuiValues = FormValues & {
  facing: string
  completedDate: string
  residentGender: string
  residentBirthDate: string
  focus: string
  layout: string
  question: string
}

const DIRECTIONS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']

const mod: DivinationModule<FengshuiValues, FengshuiChart> = {
  id: 'fengshui',
  name: '阳宅八宅',
  tagline: '以坐向定宅卦，叠合居住者命卦梳理八方用途',
  category: '堪舆',
  mark: '宅',
  sections: FENGSHUI_SECTIONS,
  fields: [
    { kind: 'section', name: 'house', label: '宅的信息', hint: '先定坐向，再谈空间', mark: '宅' },
    {
      kind: 'choice',
      name: 'facing',
      label: '房屋朝向',
      hint: '站在屋内面向大门外或主要采光面；不确定时以长期主采光面为准。',
      options: DIRECTIONS.map((direction) => ({ value: direction, label: `朝${direction}` })),
      defaultValue: '南',
    },
    {
      kind: 'date',
      name: 'completedDate',
      label: '建成或最近大装修日期',
      hint: '这里只取年份判断三元九运背景；若只是小修补，填最初建成日期。',
    },
    { kind: 'section', name: 'resident', label: '常住者', hint: '命卦只作人与宅的第二层参照', mark: '人' },
    {
      kind: 'choice',
      name: 'residentGender',
      label: '性别',
      options: [
        { value: '男', label: '男' },
        { value: '女', label: '女' },
      ],
      defaultValue: '男',
    },
    { kind: 'date', name: 'residentBirthDate', label: '出生日期', hint: '命卦年以立春为界，程序会自动校正。' },
    { kind: 'section', name: 'needs', label: '所看之处', hint: '现实格局优先于方位名称', mark: '看' },
    {
      kind: 'choice',
      name: 'focus',
      label: '这次重点',
      options: [
        { value: '整体', label: '整体' },
        { value: '事业', label: '事业' },
        { value: '感情', label: '感情' },
        { value: '健康', label: '健康' },
      ],
      defaultValue: '整体',
    },
    {
      kind: 'text',
      name: 'layout',
      label: '已知格局',
      placeholder: '例如：大门朝南，主卧在西北，书房在东，厨房在东北',
      multiline: true,
      optional: true,
    },
    {
      kind: 'text',
      name: 'question',
      label: '具体问题',
      placeholder: '例如：书桌、床和常用工作位怎样安排更合适？',
      multiline: true,
      optional: true,
    },
  ],
  load: () => import('./impl').then((m) => m.default),
}

register(mod as unknown as DivinationModule)
export default mod
