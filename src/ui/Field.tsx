import { useEffect, useMemo, useState } from 'react'
import type { FieldSpec } from '../divination/types'
import type { Place } from '../lib/solarTime'

/** 一千多座城市有一百多 KB，等真要选出生地时再拉。 */
function useCities(active: boolean): Place[] {
  const [cities, setCities] = useState<Place[]>([])
  useEffect(() => {
    if (!active || cities.length) return
    let live = true
    void import('../data/cities.json').then((m) => {
      if (live) setCities(m.default as Place[])
    })
    return () => {
      live = false
    }
  }, [active, cities.length])
  return cities
}

const input =
  'w-full bg-transparent border-0 border-b border-[var(--line)] px-0 py-2 text-[16px] ' +
  'text-[var(--fg)] outline-none transition-colors duration-300 ' +
  'focus:border-[var(--accent)] placeholder:text-[var(--fg-faint)]'

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-[12px] tracking-[0.3em] text-[var(--fg-dim)]">{children}</div>
      {hint && <div className="mt-1 text-[12px] text-[var(--fg-faint)]">{hint}</div>}
    </div>
  )
}

/** 出生地：本地检索一万多条城市，一个字都不出浏览器。 */
function PlacePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [q, setQ] = useState(() => {
    if (!value) return ''
    try {
      const p = JSON.parse(value) as Place
      return `${p.r}${p.n}`
    } catch {
      return ''
    }
  })
  const [open, setOpen] = useState(false)
  const all = useCities(open)

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return all.filter(
      (c) => c.n.includes(s) || c.a.toLowerCase().includes(s) || c.r.includes(s),
    ).slice(0, 8)
  }, [q, all])

  const picked = (() => {
    try {
      return value ? (JSON.parse(value) as Place) : null
    } catch {
      return null
    }
  })()

  return (
    <div className="relative">
      <input
        className={input}
        value={q}
        placeholder="城市名，中英文皆可"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          if (value) onChange('')
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {picked && !open && (
        <div className="mt-1.5 text-[12px] text-[var(--fg-faint)] tabular-nums">
          东经 {picked.lon.toFixed(2)}°　{picked.tz}
        </div>
      )}

      {open && hits.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-[var(--bg-raised)] border border-[var(--line)] max-h-64 overflow-auto">
          {hits.map((c) => (
            <li key={`${c.c}-${c.r}-${c.n}-${c.lon}`}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-[var(--line)]/40 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(JSON.stringify(c))
                  setQ(`${c.r}${c.n}`)
                  setOpen(false)
                }}
              >
                <span className="text-[15px] text-[var(--fg)]">{c.n}</span>
                <span className="ml-2 text-[12px] text-[var(--fg-faint)]">{c.r}</span>
                <span className="ml-2 text-[11px] text-[var(--fg-faint)] tabular-nums">
                  {c.lon.toFixed(1)}°
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Field({
  spec,
  values,
  set,
}: {
  spec: FieldSpec
  values: Record<string, string | boolean>
  set: (name: string, v: string | boolean) => void
}) {
  const v = values[spec.name]

  switch (spec.kind) {
    case 'choice': {
      // 三个以内并排；再多就排成网格，免得字被挤成一条
      const wide = spec.options.length > 3
      return (
        <div>
          <Label hint={spec.hint}>{spec.label}</Label>
          <div className={wide ? 'grid grid-cols-3 gap-px' : 'flex gap-px'}>
            {spec.options.map((o) => {
              const on = (v ?? spec.defaultValue) === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set(spec.name, o.value)}
                  className={`flex-1 py-2.5 text-[15px] tracking-[0.25em] indent-[0.25em] transition-all duration-400 cursor-pointer ${
                    on
                      ? 'text-[var(--accent)] shadow-[inset_0_-1px_0_var(--accent)]'
                      : 'text-[var(--fg-faint)] shadow-[inset_0_-1px_0_var(--line)] hover:text-[var(--fg-dim)]'
                  }`}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
          {spec.optionHint && (
            <div className="mt-2 text-[12px] text-[var(--fg-faint)]">
              {spec.optionHint[String(v ?? spec.defaultValue ?? '')]}
            </div>
          )}
        </div>
      )
    }

    case 'date':
      return (
        <div>
          <Label hint={spec.hint}>{spec.label}</Label>
          <input
            type="date"
            className={input}
            value={String(v ?? '')}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(e) => set(spec.name, e.target.value)}
          />
        </div>
      )

    case 'time': {
      const unknown = spec.unknownField ? Boolean(values[spec.unknownField.name]) : false
      return (
        <div>
          <Label hint={spec.hint}>{spec.label}</Label>
          <input
            type="time"
            className={`${input} ${unknown ? 'opacity-30' : ''}`}
            value={String(v ?? '')}
            disabled={unknown}
            onChange={(e) => set(spec.name, e.target.value)}
          />
          {spec.unknownField && (
            <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <span
                className={`w-3 h-3 border transition-colors duration-300 ${
                  unknown
                    ? 'bg-[var(--seal)] border-[var(--seal)]'
                    : 'border-[var(--line)]'
                }`}
              />
              <input
                type="checkbox"
                className="sr-only"
                checked={unknown}
                onChange={(e) => set(spec.unknownField!.name, e.target.checked)}
              />
              <span className="text-[13px] text-[var(--fg-faint)]">{spec.unknownField.label}</span>
            </label>
          )}
        </div>
      )
    }

    case 'place':
      return (
        <div>
          <Label hint={spec.hint}>{spec.label}</Label>
          <PlacePicker value={String(v ?? '')} onChange={(x) => set(spec.name, x)} />
        </div>
      )

    case 'text':
      return (
        <div>
          <Label>{spec.label}</Label>
          {spec.multiline ? (
            <textarea
              rows={2}
              className={`${input} resize-none leading-relaxed`}
              placeholder={spec.placeholder}
              value={String(v ?? '')}
              onChange={(e) => set(spec.name, e.target.value)}
            />
          ) : (
            <input
              className={input}
              placeholder={spec.placeholder}
              value={String(v ?? '')}
              onChange={(e) => set(spec.name, e.target.value)}
            />
          )}
        </div>
      )
  }
}
