import type { Credentials, ProviderId } from './types'

const KEY = 'xiangjian.credentials'
const PREF = 'xiangjian.prefs'

export const DEFAULTS: Record<ProviderId, { baseUrl: string; model: string; label: string }> = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-opus-5',
    label: 'Anthropic',
  },
  openai: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen3:32b',
    label: 'OpenAI 兼容接口',
  },
}

export type Prefs = {
  /** 记在浏览器里，还是关掉标签页就忘 */
  remember: boolean
  /** 纸面模式 */
  paper: boolean
}

const DEFAULT_PREFS: Prefs = { remember: true, paper: false }

function store(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage
}

export function loadPrefs(): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF) ?? '{}') }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREF, JSON.stringify(p))
  } catch {
    /* 隐私模式下写不进去，忽略 */
  }
}

export function loadCredentials(): Credentials | null {
  for (const s of [localStorage, sessionStorage]) {
    try {
      const raw = s.getItem(KEY)
      if (raw) return JSON.parse(raw) as Credentials
    } catch {
      /* 同上 */
    }
  }
  return null
}

export function saveCredentials(c: Credentials, remember: boolean) {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
    store(remember).setItem(KEY, JSON.stringify(c))
  } catch {
    /* 同上 */
  }
}

/** 焚毁：把这个站在浏览器里留下的一切抹掉。 */
export function burnEverything() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    /* 同上 */
  }
}
