import { DEFAULTS } from './credentials'
import type { ProviderId } from './types'

export type EndpointCheck =
  | {
      ok: true
      /** 规范化后的地址，末尾斜杠已去掉 */
      url: string
      /** 密钥实际会发往的主机名，界面上要把这个显给用户看 */
      host: string
      /** host 之前的部分，如 https:// */
      prefix: string
      /** host 之后的部分，如 /v1 */
      suffix: string
      /** 本机地址，浏览器把它当可信来源，允许 http */
      isLocal: boolean
      /** 用的是该供应商的默认地址，没改过 */
      isDefault: boolean
    }
  | { ok: false; message: string; hint?: string }

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * 校验用户填的模型端点。
 *
 * 这一层存在的理由：密钥要发给谁，是用户此刻做的最重要的一个决定，
 * 尤其在用中转的时候。所以宁可啰嗦，也要把主机名摊开给他看，
 * 并且明文 http 一律拒绝——那等于把密钥裸奔发出去。
 */
export function checkEndpoint(raw: string, provider: ProviderId): EndpointCheck {
  const fallback = DEFAULTS[provider].baseUrl
  const input = raw.trim()
  const value = input || fallback

  let u: URL
  try {
    u = new URL(value)
  } catch {
    return {
      ok: false,
      message: '这不是一个完整的地址。',
      hint: '要带上协议，例如 https://api.example.com/v1',
    }
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { ok: false, message: `不支持 ${u.protocol} 这种协议。` }
  }

  if (u.username || u.password) {
    return {
      ok: false,
      message: '地址里不要带用户名和密码。',
      hint: '密钥填在上面那一栏，不要写进地址。',
    }
  }

  const isLocal = LOCAL_HOSTS.has(u.hostname)

  if (u.protocol === 'http:' && !isLocal) {
    return {
      ok: false,
      message: '明文 http 不行，密钥会在路上裸奔。',
      hint: '换成 https://。只有本机地址（localhost）可以用 http。',
    }
  }

  const path = u.pathname.replace(/\/+$/, '')

  return {
    ok: true,
    url: `${u.protocol}//${u.host}${path}`,
    host: u.host,
    // 拆成三段给界面用。别写成「把 host 从 url 里删掉再拼回末尾」，
    // 那样 https://relay.com/v1 会显示成 https:///v1relay.com。
    prefix: `${u.protocol}//`,
    suffix: path,
    isLocal,
    isDefault: !input || input.replace(/\/+$/, '') === fallback.replace(/\/+$/, ''),
  }
}
