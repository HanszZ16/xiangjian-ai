import type { Credentials, LLMProvider } from './types'

/**
 * 全站唯一的出站口。想知道数据去了哪里，看这一个函数就够。
 *
 * 两个实现都按需加载：官方 SDK 有十几兆，首页和排盘都用不上它，
 * 没道理让只想看看命盘的人先把它下下来。
 */
export async function providerFor(cred: Credentials): Promise<LLMProvider> {
  if (cred.provider === 'anthropic') {
    const { anthropicProvider } = await import('./anthropic')
    return anthropicProvider(cred)
  }
  const { openAIProvider } = await import('./openaiCompatible')
  return openAIProvider(cred)
}

export * from './types'
export * from './credentials'
