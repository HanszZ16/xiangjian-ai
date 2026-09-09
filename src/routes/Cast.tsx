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
  const [busy, setBusy] = useState(false)

  if (!mod) return null

  const set = (name: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: v }))
    setError(null)
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

  const submit = async (localPreview = false) => {
    if (missing.length) {
      setError(`还差：${missing.join('、')}`)
      return
    }
    if (!localPreview && !loadCredentials()) {
      setError('还没有设置模型端点，先去「设置」填一个。')
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
    <div className="flex-1 flex flex-col items-center px-5 sm:px-8 py-8 sm:py-12">
      <div className="w-full max-w-[58rem]">
        <InkReveal>
          <div className="mb-9 sm:mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 text-[12px] tracking-[0.3em] text-[var(--accent)]">
                {mod.category ?? '观象'} · {mod.mark}
              </div>
              <h1 className="glyph text-[30px] sm:text-[36px] tracking-[0.24em] text-[var(--fg)]">
                {mod.name}
              </h1>
              <p className="mt-3 text-[14px] text-[var(--fg-faint)]">{mod.tagline}</p>
            </div>
            <Link
              to="/"
              className="w-fit text-[12px] tracking-[0.2em] text-[var(--fg-faint)] hover:text-[var(--fg-dim)] transition-colors duration-500"
            >
              返回门类
            </Link>
          </div>
        </InkReveal>

        <div className="form-surface px-5 py-7 sm:px-10 sm:py-10">
          <div className="space-y-9">
          {visibleFields.map((f, i) => (
            <InkReveal key={f.name} delay={0.15 + i * 0.1}>
              <Field spec={f} values={values} set={set} />
            </InkReveal>
          ))}
          </div>

          <InkReveal delay={0.65}>
            <div className="mt-12 border-t border-[var(--line)] pt-8">
            {error && (
              <p className="mb-5 text-[13px] text-[var(--seal)] leading-relaxed">{error}</p>
            )}
            <Seal onClick={() => void submit(false)} disabled={busy} className="w-full">
              {busy ? '排 盘 中' : '起 盘'}
            </Seal>
            {import.meta.env.DEV && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(true)}
                className="mt-3 w-full border border-[var(--line)] py-2.5 text-[13px] tracking-[0.2em] text-[var(--fg-faint)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-35"
              >
                本地预览结果 · 不请求模型
              </button>
            )}
            <p className="mt-5 text-[12px] leading-relaxed text-[var(--fg-faint)] text-center">
              这些字只在你自己的浏览器里排成盘，
              <br />
              随解读一并送往你设定的模型端点，别处不留。
            </p>
            </div>
          </InkReveal>
        </div>
      </div>
    </div>
  )
}
