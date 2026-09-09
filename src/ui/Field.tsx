import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FieldSpec } from '../divination/types'
import type { Place } from '../lib/solarTime'

/** 一千多座城市有一百多 KB，等真要选出生地时再拉。 */
function useCities(active: boolean) {
  const [cities, setCities] = useState<Place[]>([])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!active || cities.length) return
    let live = true
    void import('../data/cities.json').then(
      (m) => {
        if (live) setCities(m.default as Place[])
      },
      () => {
        if (live) setFailed(true)
      },
    )
    return () => {
      live = false
    }
  }, [active, cities.length])
  return { cities, failed }
}

const input =
  'block min-w-0 w-full rounded-none bg-transparent border-0 border-b border-[var(--line)] px-0 py-2.5 text-[16px] ' +
  'text-[var(--fg)] outline-none transition-colors duration-300 ' +
  'focus:border-[var(--accent)] placeholder:text-[var(--fg-faint)]'

function Label({ children, hint, id, optional }: {
  children: React.ReactNode
  hint?: string
  id: string
  optional?: boolean
}) {
  return (
    <div className="mb-2">
      <label htmlFor={id} className="text-[13px] tracking-[0.18em] text-[var(--fg-dim)]">
        {children}
        {optional && <span className="ml-2 text-[11px] tracking-normal text-[var(--fg-faint)]">可留空</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="mt-1 text-[12px] leading-relaxed text-[var(--fg-faint)]">{hint}</p>}
    </div>
  )
}

/** 出生地：本地检索一万多条城市，一个字都不出浏览器。 */
function PlacePicker({
  value,
  onChange,
  id,
  describedBy,
}: {
  value: string
  onChange: (v: string) => void
  id: string
  describedBy?: string
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
  const [activeIndex, setActiveIndex] = useState(-1)
  const options = useRef<HTMLUListElement>(null)
  const { cities: all, failed } = useCities(open)

  useEffect(() => {
    if (open && activeIndex >= 0) {
      options.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, open])

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return all.filter(
      (c) => c.n.includes(s) || c.a.toLowerCase().includes(s) || c.r.includes(s)
        || `${c.r}${c.n}`.toLowerCase().includes(s),
    ).slice(0, 8)
  }, [q, all])

  const picked = (() => {
    try {
      return value ? (JSON.parse(value) as Place) : null
    } catch {
      return null
    }
  })()

  const choose = (city: Place) => {
    onChange(JSON.stringify(city))
    setQ(`${city.r}${city.n}`)
    setOpen(false)
    setActiveIndex(-1)
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-describedby={describedBy}
        aria-activedescendant={open && hits[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        autoComplete="off"
        className={input}
        value={q}
        placeholder="城市名，中英文皆可"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
          if (value) onChange('')
        }}
        onFocus={() => {
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            if (hits.length) {
              setActiveIndex((index) => event.key === 'ArrowDown'
                ? (index + 1) % hits.length
                : (index <= 0 ? hits.length - 1 : index - 1))
            }
          } else if (event.key === 'Enter' && open) {
            event.preventDefault()
            if (hits.length > 0) choose(hits[activeIndex < 0 ? 0 : activeIndex])
          } else if (event.key === 'Escape' && open) {
            event.preventDefault()
            setOpen(false)
            setActiveIndex(-1)
          }
        }}
      />

      {picked && !open && (
        <div className="mt-1.5 text-[12px] text-[var(--fg-faint)] tabular-nums">
          东经 {picked.lon.toFixed(2)}°　{picked.tz}
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 border border-[var(--line)] bg-[var(--bg-raised)] shadow-[0_12px_32px_rgb(0_0_0_/_15%)]">
          <ul ref={options} id={`${id}-options`} role="listbox" aria-label="匹配城市" className="max-h-64 overflow-auto py-1">
            {hits.map((c, index) => (
              <li
                id={`${id}-option-${index}`}
                key={`${c.c}-${c.r}-${c.n}-${c.lon}`}
                role="option"
                aria-selected={activeIndex === index}
                className={`cursor-pointer px-4 py-2.5 text-left transition-colors ${activeIndex === index ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--accent)]/5'}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(c)}
              >
                <span className="text-[15px] text-[var(--fg)]">{c.n}</span>
                <span className="ml-2 text-[12px] text-[var(--fg-faint)]">{c.r}</span>
                <span className="ml-2 text-[11px] text-[var(--fg-faint)] tabular-nums">
                  {c.lon.toFixed(1)}°
                </span>
              </li>
            ))}
          </ul>
          {hits.length === 0 && (
            <p role="status" className="px-4 pb-3 pt-2 text-[12px] leading-relaxed text-[var(--fg-faint)]">
              {failed ? '城市资料暂未载入，可先留空继续。'
                : !q.trim() ? '输入城市名，例如「杭州」或「Hangzhou」。'
                  : !all.length ? '正在载入本地城市资料…'
                    : '未找到匹配城市，可换个名称，或先留空。'}
            </p>
          )}
        </div>
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
  const id = useId()
  const v = values[spec.name]
  const hint = 'hint' in spec && spec.hint ? `${id}-hint` : undefined

  switch (spec.kind) {
    case 'section':
      return (
        <div className="field-section">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="glyph grid h-8 w-8 shrink-0 place-items-center border border-[var(--accent)]/30 text-[13px] text-[var(--accent)]">
              {spec.mark ?? '录'}
            </span>
            <div>
              <h2 className="glyph text-[18px] tracking-[0.16em] text-[var(--fg)]">
                {spec.label}
              </h2>
              {spec.hint && (
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--fg-faint)]">
                  {spec.hint}
                </p>
              )}
            </div>
          </div>
        </div>
      )

    case 'choice': {
      // 选项多时在手机两列、宽屏四列，八方等长选项不再挤成三行。
      const wide = spec.options.length > 3
      return (
        <fieldset className="min-w-0" aria-describedby={hint}>
          <legend className="mb-2 text-[13px] tracking-[0.18em] text-[var(--fg-dim)]">{spec.label}</legend>
          {spec.hint && <p id={hint} className="mb-3 text-[12px] leading-relaxed text-[var(--fg-faint)]">{spec.hint}</p>}
          <div className={wide ? 'grid grid-cols-2 gap-2 sm:grid-cols-4' : 'flex gap-2'}>
            {spec.options.map((o) => {
              const on = (v ?? spec.defaultValue) === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(spec.name, o.value)}
                  className={`min-w-0 flex-1 border py-2.5 text-[14px] tracking-[0.18em] indent-[0.18em] transition-colors duration-300 cursor-pointer ${
                    on
                      ? 'border-[var(--accent)]/45 bg-[var(--accent)]/5 text-[var(--accent)]'
                      : 'border-[var(--line)] text-[var(--fg-faint)] hover:border-[var(--accent)]/30 hover:text-[var(--fg-dim)]'
                  }`}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
          {spec.optionHint && (
            <div aria-live="polite" className="mt-3 text-[12px] leading-relaxed text-[var(--fg-faint)]">
              {spec.optionHint[String(v ?? spec.defaultValue ?? '')]}
            </div>
          )}
        </fieldset>
      )
    }

    case 'date':
      return (
        <div>
          <Label id={id} hint={spec.hint}>{spec.label}</Label>
          <input
            id={id}
            name={spec.name}
            aria-describedby={hint}
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
          <Label id={id} hint={spec.hint}>{spec.label}</Label>
          <input
            id={id}
            name={spec.name}
            aria-describedby={hint}
            type="time"
            className={`${input} ${unknown ? 'opacity-30' : ''}`}
            value={String(v ?? '')}
            disabled={unknown}
            onChange={(e) => set(spec.name, e.target.value)}
          />
          {spec.unknownField && (
            <label className="mt-2 flex min-h-10 w-fit cursor-pointer select-none items-center gap-2.5">
              <input
                type="checkbox"
                name={spec.unknownField.name}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[var(--accent)]"
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
          <Label id={id} hint={spec.hint} optional>{spec.label}</Label>
          <PlacePicker id={id} describedBy={hint} value={String(v ?? '')} onChange={(x) => set(spec.name, x)} />
        </div>
      )

    case 'text':
      return (
        <div>
          <Label id={id} optional={spec.optional}>{spec.label}</Label>
          {spec.multiline ? (
            <textarea
              id={id}
              name={spec.name}
              rows={3}
              className={`${input} min-h-24 resize-y leading-relaxed`}
              placeholder={spec.placeholder}
              value={String(v ?? '')}
              onChange={(e) => set(spec.name, e.target.value)}
            />
          ) : (
            <input
              id={id}
              name={spec.name}
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
