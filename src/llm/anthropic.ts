import Anthropic from '@anthropic-ai/sdk'
import { DEFAULTS } from './credentials'
import { LLMError, type Credentials, type LLMProvider, type StreamEvent, type StreamRequest } from './types'

/**
 * 直连 api.anthropic.com。
 *
 * `dangerouslyAllowBrowser` 之所以在这里是对的：密钥是用户自己的，从头到尾
 * 只在他自己的浏览器里，没有服务端可以替他保管，也没有第三方会看到。
 * 这个开关危险的场景是把公司的密钥打包进公开网页，那不是本项目的形态。
 */
export function anthropicProvider(cred: Credentials): LLMProvider {
  const baseURL = cred.baseUrl || DEFAULTS.anthropic.baseUrl

  const client = new Anthropic({
    apiKey: cred.apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
    maxRetries: 1,
  })

  return {
    endpoint: () => baseURL,

    async *stream({ system, messages, signal }: StreamRequest): AsyncIterable<StreamEvent> {
      let s
      try {
        s = client.beta.messages.stream(
          {
            model: cred.model || DEFAULTS.anthropic.model,
            max_tokens: 32000,
            // 摘要化的思考流直接喂给「先生沉思」，正好省掉一段空等
            thinking: { type: 'adaptive', display: 'summarized' },
            output_config: { effort: 'high' },
            // 论命时偶有话题触到安全分类器，留个退路免得整页空白
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            system: system.map((b) => ({
              type: 'text' as const,
              text: b.text,
              ...(b.cache ? { cache_control: { type: 'ephemeral' as const } } : {}),
            })),
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          },
          { signal },
        )
      } catch (e) {
        throw wrap(e)
      }

      try {
        for await (const ev of s) {
          if (ev.type !== 'content_block_delta') continue
          if (ev.delta.type === 'text_delta') {
            yield { type: 'text', text: ev.delta.text }
          } else if (ev.delta.type === 'thinking_delta') {
            yield { type: 'thinking', text: ev.delta.thinking }
          }
        }
      } catch (e) {
        if (signal.aborted) return
        throw wrap(e)
      }
      yield { type: 'done' }
    },
  }
}

function wrap(e: unknown): Error {
  if (e instanceof Anthropic.AuthenticationError) {
    return new LLMError('密钥不对，或者已经失效。', '到设置页重填一次。')
  }
  if (e instanceof Anthropic.RateLimitError) {
    return new LLMError('调用太频繁，被限流了。', '等一会儿再起一盘。')
  }
  if (e instanceof Anthropic.PermissionDeniedError) {
    return new LLMError('这个密钥没有调用该模型的权限。')
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return new LLMError(
      '连不上模型端点。',
      '若填的是自建网关，检查地址是否可达、是否放行了跨域请求。',
    )
  }
  if (e instanceof Anthropic.APIError) {
    return new LLMError(`模型端点返回了错误：${e.message}`)
  }
  return e instanceof Error ? e : new Error(String(e))
}
