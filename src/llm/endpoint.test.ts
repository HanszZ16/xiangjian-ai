import { describe, expect, it } from 'vitest'
import { checkEndpoint } from './endpoint'

const ok = (r: ReturnType<typeof checkEndpoint>) => {
  if (!r.ok) throw new Error(`本该通过，却被拒了：${r.message}`)
  return r
}

describe('端点校验', () => {
  it('留空则用该供应商的默认地址，并标记为默认', () => {
    const r = ok(checkEndpoint('', 'anthropic'))
    expect(r.url).toBe('https://api.anthropic.com')
    expect(r.host).toBe('api.anthropic.com')
    expect(r.isDefault).toBe(true)
  })

  it('自定义中转地址通过，并标记为非默认', () => {
    const r = ok(checkEndpoint('https://relay.example.com/v1', 'openai'))
    expect(r.host).toBe('relay.example.com')
    expect(r.isDefault).toBe(false)
  })

  it('末尾斜杠与空白都规范掉', () => {
    expect(ok(checkEndpoint('  https://relay.example.com/v1///  ', 'openai')).url)
      .toBe('https://relay.example.com/v1')
  })

  it('拆成前缀/主机/后缀三段，顺序拼回去要还原成原地址', () => {
    const r = ok(checkEndpoint('https://relay.example.com/v1', 'openai'))
    expect(r.prefix).toBe('https://')
    expect(r.host).toBe('relay.example.com')
    expect(r.suffix).toBe('/v1')
    expect(r.prefix + r.host + r.suffix).toBe(r.url)
  })

  it('根路径没有后缀', () => {
    const r = ok(checkEndpoint('https://api.anthropic.com', 'anthropic'))
    expect(r.suffix).toBe('')
    expect(r.prefix + r.host + r.suffix).toBe(r.url)
  })

  it('带端口的地址保留端口', () => {
    const r = ok(checkEndpoint('https://relay.example.com:8443/v1', 'openai'))
    expect(r.host).toBe('relay.example.com:8443')
  })

  it('明文 http 一律拒绝——密钥不能裸奔', () => {
    const r = checkEndpoint('http://relay.example.com/v1', 'openai')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('http')
  })

  it('但本机的 http 放行，浏览器把 localhost 当可信来源', () => {
    for (const h of ['http://localhost:11434/v1', 'http://127.0.0.1:1234/v1']) {
      const r = ok(checkEndpoint(h, 'openai'))
      expect(r.isLocal).toBe(true)
    }
  })

  it('地址里塞用户名密码的拒绝', () => {
    const r = checkEndpoint('https://user:pass@relay.example.com/v1', 'openai')
    expect(r.ok).toBe(false)
  })

  it('不成形的地址与怪协议拒绝', () => {
    for (const bad of ['relay.example.com', 'api.anthropic.com/v1', 'ftp://x.com', 'javascript:alert(1)']) {
      expect(checkEndpoint(bad, 'openai').ok).toBe(false)
    }
  })
})
