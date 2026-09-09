import { toPng } from 'html-to-image'
import type { ChartBase } from '../divination/types'

function stamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function save(blobUrl: string, name: string) {
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = name
  a.click()
}

/** 命盘与解读存成一份 Markdown。全程在本地拼字符串，不经任何服务。 */
export function downloadMarkdown(title: string, chart: ChartBase, reading: string) {
  const md = [
    `# ${title}`,
    '',
    '## 盘',
    '',
    '```',
    chart.digest,
    '```',
    '',
    reading,
    '',
    '---',
    '',
    '由「象见」在本地排盘，解读出自你自己配置的模型端点。',
  ].join('\n')

  const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }))
  save(url, `${title}-${stamp()}.md`)
  URL.revokeObjectURL(url)
}

/** 整页存成一张长图。 */
export async function downloadPng(node: HTMLElement | null, title: string) {
  if (!node) return
  const bg = getComputedStyle(document.body).backgroundColor
  const url = await toPng(node, {
    backgroundColor: bg,
    pixelRatio: 2,
    style: { padding: '32px' },
  })
  save(url, `${title}-${stamp()}.png`)
}
