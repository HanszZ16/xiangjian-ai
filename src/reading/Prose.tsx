import { Fragment, type ReactNode } from 'react'

/**
 * 极简的行内渲染：只认 **重点**、《书名》、以及段落与列表。
 * 不引 markdown 库——解读文里真正需要的排版就这几样，
 * 多引一个库反而会把书名号和中文标点弄乱。
 */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|《[^》]+》|【[^】]+】)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} className="font-normal text-[var(--fg)] border-b border-[var(--accent)]/35">
          {p.slice(2, -2)}
        </strong>
      )
    }
    if (p.startsWith('《') || p.startsWith('【')) {
      return (
        <span key={i} className="text-[var(--accent)] opacity-90">
          {p}
        </span>
      )
    }
    return <Fragment key={i}>{p}</Fragment>
  })
}

export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)

  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter((l) => l.trim())
        if (!lines.length) return null

        // 印证条目在别处单独渲染，正文里不重复显示
        if (lines.every((l) => /^[-*]\s*\[印证\]/.test(l.trim()))) return null

        if (lines.length === 1 && /^###\s+/.test(lines[0].trim())) {
          return (
            <h3 key={i} className="glyph pt-1 text-[15px] tracking-[0.16em] text-[var(--fg)]">
              {inline(lines[0].trim().replace(/^###\s+/, ''))}
            </h3>
          )
        }

        const isList = lines.every((l) => /^(?:[-*]|\d+[.)])\s+/.test(l.trim()))
        if (isList) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3 leading-[2.05] text-[15.5px] text-[var(--fg-dim)]">
                  <span className="text-[var(--accent)] opacity-50 shrink-0 mt-[0.1em]">·</span>
                  <span>{inline(l.replace(/^(?:[-*]|\d+[.)])\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (lines.every((l) => /^>\s?/.test(l.trim()))) {
          return (
            <blockquote key={i} className="border-l border-[var(--accent)]/45 pl-4 text-[15px] leading-[2] text-[var(--fg-dim)]">
              {inline(lines.map((l) => l.trim().replace(/^>\s?/, '')).join(''))}
            </blockquote>
          )
        }

        return (
          <p key={i} className="leading-[2.05] text-[16px] text-[var(--fg-dim)] indent-8">
            {inline(b.replace(/\n/g, ''))}
          </p>
        )
      })}
    </div>
  )
}
