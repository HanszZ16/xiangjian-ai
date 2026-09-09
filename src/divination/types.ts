import type { ComponentType } from 'react'

/** 声明式表单字段。Cast 页照着渲染，模块不碰 UI 代码。 */
type FieldVisibility = {
  /** 只在另一个字段取到指定值时显示，供多路径表单使用。 */
  visibleWhen?: { name: string; equals: string | boolean }
}

export type FieldSpec = FieldVisibility & (
  | {
      kind: 'section'
      name: string
      label: string
      hint?: string
      mark?: string
    }
  | {
      kind: 'choice'
      name: string
      label: string
      hint?: string
      options: Array<{ value: string; label: string }>
      defaultValue?: string
      /** 选中某项时在下方补一句说明，键是选项的 value */
      optionHint?: Record<string, string>
    }
  | { kind: 'date'; name: string; label: string; hint?: string }
  | {
      kind: 'time'
      name: string
      label: string
      hint?: string
      /** 勾上表示时辰不详 */
      unknownField?: { name: string; label: string }
    }
  | { kind: 'place'; name: string; label: string; hint?: string }
  | {
      kind: 'text'
      name: string
      label: string
      placeholder?: string
      multiline?: boolean
      optional?: boolean
    }
)

export type FormValues = Record<string, string | boolean>

/** 排盘产物的公共部分。各模块在此之上加自己的字段。 */
export type ChartBase = {
  /** 排盘时发现的临界与存疑之处，命盘上以朱砂小字标注 */
  warnings: string[]
  /** 给模型看的结构化摘要，纯文本 */
  digest: string
}

/**
 * 模块的实作部分：排盘、画盘、角色提示。
 *
 * 与元信息分开，是为了按需加载——首页只需要名字和一句话，
 * 没道理为了列三行标题就把三套历法库和星表都下下来。
 */
export interface ModuleImpl<I extends FormValues = FormValues, C extends ChartBase = ChartBase> {
  /** 纯函数、确定性、零网络。算不出来就抛错。 */
  compute(input: I): C
  ChartView: ComponentType<{ chart: C }>
  /** 用于从本地知识库里检索条目 */
  knowledgeTags(chart: C): string[]
  /** 模块专属的角色与方法论，护栏另有共用的一份 */
  systemPrompt(): string
}

/** 元信息。轻，首屏就要。 */
export interface DivinationModule<I extends FormValues = FormValues, C extends ChartBase = ChartBase> {
  id: string
  /** 八字命理 */
  name: string
  /** 首页上的一句话 */
  tagline: string
  /** 首页卡片上的门类小签 */
  category?: string
  /** 首页序号旁的一个字 */
  mark: string
  fields: FieldSpec[]
  /** 解读章节标题，前端据此把长文切成卷轴的「章」 */
  sections: string[]
  /** 真要用到排盘与画盘时才拉进来 */
  load(): Promise<ModuleImpl<I, C>>
}
