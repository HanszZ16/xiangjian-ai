/**
 * 七十八张牌。
 *
 * 这里只放牌的身份——名字、花色、序数——不放牌义。
 * 牌义走 tarot-skill 那套生成式规则（花色定领域、数字定阶段、宫廷定角色），
 * 存在 knowledge/vendor/tarot/cards.md 里，随提示一并交给先生。
 * 这么做比逐牌抄一份词典更省，也更不容易把牌义写死。
 */

export type Arcana = 'major' | 'minor'
export type Suit = '权杖' | '圣杯' | '宝剑' | '星币'

export type Card = {
  id: string
  name: string
  en: string
  arcana: Arcana
  /** 大牌的编号 0–21；小牌为花色内的序数 1–14 */
  number: number
  suit?: Suit
  /** 火水风土 */
  element?: string
}

const MAJOR: Array<[string, string]> = [
  ['愚者', 'The Fool'],
  ['魔术师', 'The Magician'],
  ['女祭司', 'The High Priestess'],
  ['皇后', 'The Empress'],
  ['皇帝', 'The Emperor'],
  ['教皇', 'The Hierophant'],
  ['恋人', 'The Lovers'],
  ['战车', 'The Chariot'],
  ['力量', 'Strength'],
  ['隐士', 'The Hermit'],
  ['命运之轮', 'Wheel of Fortune'],
  ['正义', 'Justice'],
  ['倒吊人', 'The Hanged Man'],
  ['死神', 'Death'],
  ['节制', 'Temperance'],
  ['恶魔', 'The Devil'],
  ['高塔', 'The Tower'],
  ['星星', 'The Star'],
  ['月亮', 'The Moon'],
  ['太阳', 'The Sun'],
  ['审判', 'Judgement'],
  ['世界', 'The World'],
]

const SUITS: Array<[Suit, string, string]> = [
  ['权杖', '火', 'Wands'],
  ['圣杯', '水', 'Cups'],
  ['宝剑', '风', 'Swords'],
  ['星币', '土', 'Pentacles'],
]

const RANK = ['首', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const COURT = ['侍从', '骑士', '皇后', '国王']
const COURT_EN = ['Page', 'Knight', 'Queen', 'King']

export const DECK: Card[] = [
  ...MAJOR.map(([name, en], i) => ({
    id: `major-${i}`,
    name,
    en,
    arcana: 'major' as const,
    number: i,
  })),
  ...SUITS.flatMap(([suit, element, suitEn]) =>
    Array.from({ length: 14 }, (_, i) => {
      const n = i + 1
      const isCourt = n > 10
      return {
        id: `${suitEn.toLowerCase()}-${n}`,
        name: isCourt ? `${suit}${COURT[n - 11]}` : `${suit}${RANK[i]}`,
        en: isCourt ? `${COURT_EN[n - 11]} of ${suitEn}` : `${n} of ${suitEn}`,
        arcana: 'minor' as const,
        number: n,
        suit,
        element,
      }
    }),
  ),
]

export type SpreadId = 'single' | 'three' | 'diamond' | 'moon' | 'horseshoe' | 'celtic'

/** 位置定义照搬 tarot-skill 的 references/spreads.md。 */
export const SPREADS: Record<SpreadId, { name: string; hint: string; positions: string[] }> = {
  single: { name: '一张', hint: '今日或简单的问题', positions: ['当前指引'] },
  three: {
    name: '三张',
    hint: '通用、关系、决策',
    positions: ['过去', '现在', '未来'],
  },
  diamond: {
    name: '菱形',
    hint: '卡住的决策',
    positions: ['核心', '根源', '阻力', '潜力', '建议'],
  },
  moon: {
    name: '月相',
    hint: '一个月的周期',
    positions: ['新月·意图', '上弦·行动', '满月·觉察', '下弦·释放'],
  },
  horseshoe: {
    name: '马蹄',
    hint: '看一条时间线',
    positions: ['远期过去', '近期过去', '当前', '近期未来', '外部影响', '建议', '结果'],
  },
  celtic: {
    name: '凯尔特十字',
    hint: '复杂的局面',
    positions: [
      '核心', '交叉', '意识目标', '根基过去', '近期过去',
      '近期未来', '自我', '环境', '希望与恐惧', '结果',
    ],
  },
}
