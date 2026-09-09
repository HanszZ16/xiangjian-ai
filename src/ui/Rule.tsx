/** 一道细线，中间可缀一枚字。用来断章。 */
export function Rule({ mark }: { mark?: string }) {
  return (
    <div className="flex items-center gap-4 my-10 select-none" aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--line)]" />
      {mark && (
        <span className="glyph text-[13px] tracking-[0.3em] text-[var(--fg-faint)]">{mark}</span>
      )}
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}
