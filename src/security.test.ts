import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * 这个站的密钥就放在浏览器的存储里，同源的任何一段 JS 都读得到。
 * 因为要支持自定义中转地址，CSP 的 connect-src 没法收成白名单——
 * 也就是说一旦出了 XSS，没有第二道防线拦住外泄。
 *
 * 所以「没有注入点」不能只是此刻的事实，得是被守住的性质。
 * 下面几条现在都成立；谁（包括我自己）以后手滑破坏了，这里会先红。
 */

const ROOT = new URL('..', import.meta.url).pathname
const SELF = 'security.test.ts'

function sourceFiles(dir = join(ROOT, 'src')): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === 'vendor' ? [] : sourceFiles(full)
    return /\.(ts|tsx)$/.test(name) && !full.endsWith(SELF) ? [full] : []
  })
}

const files = sourceFiles().map((path) => ({
  path: path.slice(ROOT.length),
  text: readFileSync(path, 'utf8'),
}))

describe('不得存在把字符串当 HTML 或代码执行的入口', () => {
  // 拆开拼接，免得这条规则把本文件自己算进去
  const SINKS = [
    'dangerously' + 'SetInnerHTML',
    'inner' + 'HTML',
    'outer' + 'HTML',
    'document.' + 'write',
    'new ' + 'Function(',
    'eval' + '(',
  ]

  it.each(SINKS)('源码中不出现 %s', (sink) => {
    const hits = files.filter((f) => f.text.includes(sink)).map((f) => f.path)
    expect(hits, `${sink} 是 XSS 的直接入口；模型输出必须走 React 文本节点渲染`).toEqual([])
  })

  it('模型输出的渲染器没有任何 HTML 注入', () => {
    const prose = files.find((f) => f.path.endsWith('reading/Prose.tsx'))
    expect(prose, '渲染器改名了？把这条测试一起改').toBeTruthy()
    expect(prose!.text).not.toMatch(/innerHTML|dangerously/i)
  })
})

describe('密钥不得进入日志', () => {
  it('源码中不出现 console 输出', () => {
    const hits = files.filter((f) => /\bconsole\.\w+\(/.test(f.text)).map((f) => f.path)
    expect(hits, '控制台输出可能把密钥或生辰带出去，也会被浏览器扩展读到').toEqual([])
  })
})

describe('页面不得引入第三方来源', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8')

  it('index.html 里的 src / href 全是同源相对路径', () => {
    const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    for (const r of refs) {
      expect(r, `${r} 指向站外；第三方脚本或字体能读走 localStorage 里的密钥`)
        .toMatch(/^\/(?!\/)/)
    }
  })

  it('没有内联脚本', () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/)
  })
})

describe('依赖清单是一份需要有意识维护的名单', () => {
  // 加一个依赖就要改这里一行——这一步是故意设的门槛。
  // 尤其别加 markdown 渲染库：多数默认允许 raw HTML，一引进来上面几条就全废了。
  const ALLOWED = [
    '@anthropic-ai/sdk',
    'html-to-image',
    'iztro',
    'motion',
    'react',
    'react-dom',
    'react-router',
    'three',
    'tyme4ts',
  ]

  it('运行时依赖与名单一致', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(Object.keys(pkg.dependencies).sort()).toEqual(ALLOWED)
  })
})

describe('出站只有一个口子', () => {
  it('发起网络请求的地方只在 src/llm/ 下', () => {
    const callers = files
      .filter((f) => /\bfetch\(|new Anthropic\(|XMLHttpRequest|navigator\.sendBeacon/.test(f.text))
      .map((f) => f.path)
    for (const c of callers) {
      expect(c, '出站请求必须收敛在 src/llm/，否则「唯一出站地址」这句话就不成立')
        .toMatch(/^src\/llm\//)
    }
    expect(callers.length).toBeGreaterThan(0)
  })

  it('不把任何数据放进 URL', () => {
    const hits = files
      .filter((f) => /searchParams|location\.search|location\.hash/.test(f.text))
      .map((f) => f.path)
    expect(hits, 'URL 会进浏览器历史、Referer 和服务器日志，生辰和问题不能放这儿').toEqual([])
  })
})
