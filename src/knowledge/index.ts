/*
 * 知识库。
 *
 * 原本打算把古籍条目切碎成带标签的小块再检索，实际掂量下来不值得：
 * 八字那几份参考表加起来也就两万多字，整份塞进 system 提示既省掉一套
 * 容易出错的切分逻辑，又不会像分块检索那样把表格拦腰截断。加上
 * cache_control，重复调用几乎不花钱。所以这里按「篇」取，不按「条」取。
 */

import wuxing from './vendor/bazi/wuxing-tables.md?raw'
import shensha from './vendor/bazi/shensha-table.md?raw'
import dayun from './vendor/bazi/dayun-rules.md?raw'
import shichen from './vendor/bazi/shichen-table.md?raw'
import classics from './vendor/bazi/classical-texts.md?raw'

import tarotCards from './vendor/tarot/cards.md?raw'
import tarotSpreads from './vendor/tarot/spreads.md?raw'
import tarotRelations from './vendor/tarot/card-relations.md?raw'
import tarotCombos from './vendor/tarot/combinations.md?raw'

export type Corpus = { title: string; text: string }

const LIBRARY: Record<string, Corpus[]> = {
  bazi: [
    { title: '五行·天干地支·十神·藏干·十二长生参考表', text: wuxing },
    { title: '神煞查法与吉凶', text: shensha },
    { title: '大运顺逆、起运与流年规则', text: dayun },
    { title: '时辰对照与日上起时', text: shichen },
    { title: '九本经典的论命规则摘要', text: classics },
  ],
  tarot: [
    { title: '牌义纪律', text: tarotCards },
    { title: '牌阵位置', text: tarotSpreads },
    { title: '牌间关系', text: tarotRelations },
    { title: '经典组合', text: tarotCombos },
  ],
}

/** 取某门类的全部参考资料，拼成一块可缓存的提示。 */
export function corpusFor(moduleId: string): string {
  const parts = LIBRARY[moduleId]
  if (!parts?.length) return ''
  return [
    '以下是可供查阅的参考资料。解释术语、查神煞、定大运顺逆一律以此为准，',
    '不要凭记忆另立一套；资料里没有的条目就不要补算。',
    '',
    ...parts.map((p) => `━━━━━ ${p.title} ━━━━━\n${p.text.trim()}`),
  ].join('\n')
}
