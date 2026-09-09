import { DEFAULTS } from './credentials'
import { LLMError, type Credentials, type LLMProvider, type StreamEvent, type StreamRequest } from './types'

/**
 * 任何讲 OpenAI Chat Completions 那一套的端点：Ollama、LM Studio、
 * vLLM，以及各路中转。手写 SSE 解析，不引第二个 SDK。
 */
export function openAIProvider(cred: Credentials): LLMProvider {
  const baseUrl = (cred.baseUrl || DEFAULTS.openai.baseUrl).replace(/\/+$/, '')
  const url = `${baseUrl}/chat/completions`

  return {
    endpoint: () => baseUrl,

    async *stream({ system, messages, signal }: StreamRequest): AsyncIterable<StreamEvent> {
      // 只给「拿到响应头」这一步设上限，不限制之后的流式输出——
      // 一篇解读本来就可能写好几分钟。但端点若是收下连接却一直不答，
      // 没有这个上限界面就会永远停在「先生正在看盘」。
      const ctrl = new AbortController()
      const relay = () => ctrl.abort(signal.reason)
      signal.addEventListener('abort', relay, { once: true })
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        ctrl.abort()
      }, 60_000)

      let res: Response
      try {
        res = await fetch(url, {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'content-type': 'application/json',
            ...(cred.apiKey ? { authorization: `Bearer ${cred.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: cred.model || DEFAULTS.openai.model,
            stream: true,
            max_tokens: 32000,
            messages: [
              { role: 'system', content: system.map((b) => b.text).join('\n\n') },
              ...messages,
            ],
          }),
        })
      } catch {
        signal.removeEventListener('abort', relay)
        clearTimeout(timer)
        if (signal.aborted) return
        if (timedOut) {
          throw new LLMError(
            `${baseUrl} 一分钟没有回话。`,
            '地址可能填错了，或者那边的服务没起来。',
          )
        }
        throw new LLMError(
          `连不上 ${baseUrl}。`,
          '若是本机的 Ollama，先设 OLLAMA_ORIGINS=* 再启动，否则浏览器的跨域限制会把请求拦掉。',
        )
      }

      // 响应头已到，接下来的流想写多久写多久
      clearTimeout(timer)

      if (!res.ok || !res.body) {
        signal.removeEventListener('abort', relay)
        const detail = await res.text().catch(() => '')
        throw new LLMError(
          `端点返回 ${res.status}。`,
          detail.slice(0, 300) || undefined,
        )
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''

      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += value

          // SSE 以空行分事件；最后一段可能不完整，留在缓冲里
          let cut: number
          while ((cut = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, cut)
            buffer = buffer.slice(cut + 2)

            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data:')) continue
              const payload = line.slice(5).trim()
              if (!payload || payload === '[DONE]') continue

              let json: {
                choices?: Array<{
                  delta?: { content?: string | null; reasoning_content?: string | null; reasoning?: string | null }
                }>
              }
              try {
                json = JSON.parse(payload)
              } catch {
                continue
              }

              const delta = json.choices?.[0]?.delta
              if (!delta) continue
              const thinking = delta.reasoning_content ?? delta.reasoning
              if (thinking) yield { type: 'thinking', text: thinking }
              if (delta.content) yield { type: 'text', text: delta.content }
            }
          }
        }
      } catch (e) {
        if (signal.aborted) return
        throw e
      } finally {
        signal.removeEventListener('abort', relay)
      }
      yield { type: 'done' }
    },
  }
}
