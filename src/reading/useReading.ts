import { useCallback, useRef, useState } from 'react'
import type { ChartBase, DivinationModule, ModuleImpl } from '../divination/types'
import { buildOpening, buildSystem } from '../prompt/assemble'
import { loadCredentials, providerFor, LLMError, type Turn } from '../llm'

export type Phase = 'idle' | 'thinking' | 'writing' | 'done' | 'error'

export type ReadingState = {
  phase: Phase
  /** 「先生沉思」里滚动的字 */
  thinking: string
  /** 解读正文，边流边长 */
  text: string
  turns: Turn[]
  error: { message: string; hint?: string } | null
}

const EMPTY: ReadingState = { phase: 'idle', thinking: '', text: '', turns: [], error: null }

export function useReading(
  mod: DivinationModule,
  impl: ModuleImpl,
  chart: ChartBase,
  localPreviewText = '',
) {
  const [state, setState] = useState<ReadingState>(() => localPreviewText
    ? { phase: 'done', thinking: '', text: localPreviewText, turns: [], error: null }
    : EMPTY)
  const abort = useRef<AbortController | null>(null)

  const run = useCallback(
    async (turns: Turn[]) => {
      const cred = loadCredentials()
      if (!cred) {
        setState((s) => ({ ...s, phase: 'error', error: { message: '还没有设置模型端点。' } }))
        return
      }

      abort.current?.abort()
      const ctrl = new AbortController()
      abort.current = ctrl

      setState({ phase: 'thinking', thinking: '', text: '', turns, error: null })

      try {
        const provider = await providerFor(cred)
        const stream = provider.stream({
          system: buildSystem(mod, impl),
          messages: turns,
          signal: ctrl.signal,
        })

        let text = ''
        for await (const ev of stream) {
          if (ctrl.signal.aborted) return
          if (ev.type === 'thinking') {
            setState((s) => ({ ...s, thinking: (s.thinking + ev.text).slice(-600) }))
          } else if (ev.type === 'text') {
            text += ev.text
            setState((s) => ({ ...s, phase: 'writing', text }))
          } else {
            setState((s) => ({
              ...s,
              phase: 'done',
              turns: [...turns, { role: 'assistant', content: text }],
            }))
          }
        }
      } catch (e) {
        if (ctrl.signal.aborted) return
        const err =
          e instanceof LLMError
            ? { message: e.message, hint: e.hint }
            : { message: e instanceof Error ? e.message : String(e) }
        setState((s) => ({ ...s, phase: 'error', error: err }))
      }
    },
    [mod, impl],
  )

  const open = useCallback(
    (question: string) => run([{ role: 'user', content: buildOpening(chart, question) }]),
    [chart, run],
  )

  const follow = useCallback(
    (q: string) => run([...state.turns, { role: 'user', content: q }]),
    [run, state.turns],
  )

  const stop = useCallback(() => {
    abort.current?.abort()
    setState((s) => ({ ...s, phase: s.text ? 'done' : 'idle' }))
  }, [])

  return { state, open, follow, stop }
}
