import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { findModule } from '../divination/registry'
import { Field } from '../ui/Field'
import { InkReveal } from '../ui/InkReveal'
import { Seal } from '../ui/Seal'
import { loadCredentials } from '../llm/credentials'
import type { FormValues } from '../divination/types'

export function Cast() {
  const { moduleId } = useParams()
  const mod = findModule(moduleId)
  const nav = useNavigate()

  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(
      mod?.fields.flatMap((f) =>
        f.kind === 'choice' && f.defaultValue ? [[f.name, f.defaultValue]] : [],
      ) ?? [],
    ),
  )
  const [error, setError] = useState<string | null>(null)
  const [needsModel, setNeedsModel] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!mod) return null

  const set = (name: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: v }))
    setError(null)
    setNeedsModel(false)
  }

  const visibleFields = mod.fields.filter(
    (f) => !f.visibleWhen || values[f.visibleWhen.name] === f.visibleWhen.equals,
  )

  const missing = visibleFields
    .filter((f) => {
      if (f.kind === 'section') return false
      if (f.kind === 'text' && f.optional) return false
      if (f.kind === 'time' && f.unknownField && values[f.unknownField.name]) return false
      if (f.kind === 'place') return false // 出生地可空，只是排盘会少一层校正
      return !values[f.name]
    })
    .map((f) => f.label)

  // 只把自然成对的字段并列；篇章、地点与问题始终独占一行。
  const pairedFields = new Set<string>()
  for (let i = 0; i < visibleFields.length - 1; i += 1) {
    const a = visibleFields[i]
    const b = visibleFields[i + 1]
    if (
      (a.kind === 'date' && b.kind === 'time') ||
      (a.kind === 'text' && !a.multiline && b.kind === 'choice' && b.options.length <= 3)
    ) {
      pairedFields.add(a.name)
      pairedFields.add(b.name)
      i += 1
    }
  }

  const submit = async (localPreview = false) => {
    if (busy) return
    setNeedsModel(false)
    if (missing.length) {
      setError(`还差：${missing.join('、')}`)
      return
    }
    if (!localPreview && !loadCredentials()) {
      setError('先设好模型来路，先生才能为你解盘。')
      setNeedsModel(true)
      return
    }
    setBusy(true)
    try {
      const impl = await mod.load()
      const chart = impl.compute(values)
      // 命盘只走内存，不落任何存储；刷新即散
      nav('/reading', {
        state: {
          moduleId: mod.id,
          chart,
          question: values.question ?? '',
          localPreview,
        },
      })
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? `排不出来：${e.message}` : '排不出来。')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
      <div className="w-full max-w-[52rem]">
        <InkReveal>
          <div className="mb-9 flex flex-col gap-5 sm:mb-11 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3 text-[11px] tracking-[0.3em] text-[var(--accent)]">
                <span aria-hidden="true" className="h-px w-7 bg-[var(--accent)]/60" />
                {mod.category ?? '观象'} · 起盘
              </div>
              <h1 className="glyph text-[32px] leading-[1.45] tracking-[0.18em] text-[var(--fg)] sm:text-[36px]">
                {mod.name}
              </h1>
              <p className="mt-4 max-w-[32rem] text-[14px] leading-relaxed text-[var(--fg-dim)]">{mod.tagline}</p>
            </div>
            <Link
              to="/"
              className="w-fit shrink-0 py-2 text-[12px] tracking-[0.16em] text-[var(--fg-faint)] transition-colors duration-300 hover:text-[var(--accent)]"
            >
              <span aria-hidden="true" className="mr-2">←</span>返回门类
            </Link>
          </div>
        </InkReveal>

        <form
          className="form-surface px-5 py-7 sm:px-9 sm:py-9"
          noValidate
          aria-busy={busy}
          onSubmit={(event) => {
            event.preventDefault()
            void submit(false)
          }}
        >
          <div className="grid grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-2 sm:gap-y-8">
            {visibleFields.map((f, i) => (
              <div
                key={f.name}
                className={`${pairedFields.has(f.name) ? '' : 'sm:col-span-2'} ${f.kind === 'section' && i > 0 ? 'mt-3 border-t border-[var(--line)] pt-6' : ''}`}
              >
                <Field spec={f} values={values} set={set} />
              </div>
            ))}
          </div>

          <div className="mt-9 border-t border-[var(--line)] pt-7 sm:mt-11">
            {error && (
              <div role="alert" className="mb-5 border-l border-[var(--seal)] pl-3 text-[13px] leading-relaxed text-[var(--seal)]">
                <p>{error}</p>
                {needsModel && (
                  <Link to="/settings" className="mt-2 inline-block text-[var(--accent)] underline underline-offset-4">
                    前往设置 <span aria-hidden="true">↗</span>
                  </Link>
                )}
              </div>
            )}
            <Seal type="submit" disabled={busy} className="w-full sm:w-auto sm:min-w-48">
              {busy ? '排 盘 中' : '起 盘'}
            </Seal>
            {import.meta.env.DEV && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(true)}
                className="mt-3 block w-full py-2 text-left text-[12px] tracking-[0.1em] text-[var(--fg-faint)] transition-colors duration-300 hover:text-[var(--accent)] disabled:opacity-35 sm:w-auto"
              >
                本地预览结果 · 不请求模型
              </button>
            )}
            <p className="mt-5 max-w-[36rem] text-[12px] leading-[1.9] text-[var(--fg-faint)]">
              生辰与所问先在本地排成盘，再交给你选定的模型解读。命盘不作留存，刷新即散。
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
