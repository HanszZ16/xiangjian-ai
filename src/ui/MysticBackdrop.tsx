import { Luopan } from './Luopan'

/**
 * 内页共用的幽暗天盘背景。只复用项目原有罗盘，不引入图片或网络资源。
 * 内容永远在它上方；纸面模式下由 CSS 自动收淡。
 */
export function MysticBackdrop() {
  return (
    <div className="mystic-backdrop fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="mystic-halo absolute left-1/2 top-[-34rem] h-[78rem] w-[78rem] -translate-x-1/2" />
      <Luopan
        size={1260}
        spinning={false}
        centerGlyph={false}
        className="absolute left-1/2 top-[-31rem] h-[78rem] w-[78rem] -translate-x-1/2 opacity-[0.16]"
      />
      <div className="mystic-orbit absolute -left-28 top-[22%] h-72 w-72 rounded-full" />
      <div className="mystic-orbit absolute -right-20 bottom-[7%] h-80 w-80 rounded-full" />
      <span className="vertical absolute left-8 top-[42%] hidden text-[11px] text-[var(--fg-faint)] opacity-35 xl:block">
        天地有常万物有时
      </span>
      <span className="vertical absolute right-8 top-[17%] hidden text-[11px] text-[var(--fg-faint)] opacity-35 xl:block">
        观天之道执象而见
      </span>
    </div>
  )
}
