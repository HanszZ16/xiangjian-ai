export type Section = { title: string; body: string }

/** 把流式长文按 `## 节名` 切成章。未及闭合的最后一章照样返回，好让它边写边显。 */
export function splitSections(text: string, expected: string[]): Section[] {
  // 只切二级标题；`### 小标题` 必须留在正文里交给 Prose 渲染。
  const parts = text.split(/^##(?!#)[ \t]*/m)
  const out: Section[] = []

  for (const part of parts) {
    if (!part.trim()) continue
    const nl = part.indexOf('\n')
    const title = (nl === -1 ? part : part.slice(0, nl)).trim()
    const body = nl === -1 ? '' : part.slice(nl + 1)
    // 模型偶尔会在节名前后加编号或书名号，宽松匹配一下
    const known = expected.find((e) => title.includes(e))
    out.push({ title: known ?? title, body: body.trimEnd() })
  }

  // 开头没有 ## 的话，第一段是引子
  if (out.length && !text.trimStart().startsWith('##')) out[0].title = ''
  return out
}

export type Proof = { raw: string; year: string; age: string; claim: string }

const PROOF = /^[-*]\s*\[印证\]\s*(.+)$/gm

/** 抽出「印证」那几条，供前端渲染成可点的条目。 */
export function extractProofs(text: string): Proof[] {
  const out: Proof[] = []
  for (const m of text.matchAll(PROOF)) {
    const raw = m[1].trim()
    const [head, ...rest] = raw.split(/[｜|]/)
    const claim = rest.join('｜').trim()
    if (!claim) continue
    const year = (head.match(/\d{4}/) ?? [''])[0]
    const age = (head.match(/（([^）]*)）/) ?? ['', ''])[1]
    out.push({ raw, year, age, claim })
  }
  return out
}
