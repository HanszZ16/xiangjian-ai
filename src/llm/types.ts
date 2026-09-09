export type ProviderId = 'anthropic' | 'openai'

export type SystemBlock = {
  text: string
  /** 稳定不变的部分打上缓存标记 */
  cache?: boolean
}

export type Turn = { role: 'user' | 'assistant'; content: string }

export type StreamEvent =
  | { type: 'thinking'; text: string }
  | { type: 'text'; text: string }
  | { type: 'done' }

export type StreamRequest = {
  system: SystemBlock[]
  messages: Turn[]
  signal: AbortSignal
}

export type Credentials = {
  provider: ProviderId
  apiKey: string
  /** 留空则用各家默认 */
  baseUrl: string
  model: string
}

export interface LLMProvider {
  /** 出站地址，原样显示在设置页上供核对 */
  endpoint(): string
  stream(req: StreamRequest): AsyncIterable<StreamEvent>
}

export class LLMError extends Error {
  hint?: string
  constructor(message: string, hint?: string) {
    super(message)
    this.name = 'LLMError'
    this.hint = hint
  }
}
