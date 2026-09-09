import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { MysticBackdrop } from '../ui/MysticBackdrop'

/** 页框：顶栏与页脚。刻意做得很轻，不抢内容。 */
export function Chrome() {
  const { pathname } = useLocation()
  const atHome = pathname === '/'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="relative z-10 min-h-full flex flex-col">
      {!atHome && <MysticBackdrop />}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--line)]/60 bg-[var(--bg)]/80 px-5 py-4 text-[13px] tracking-[0.25em] backdrop-blur-xl sm:px-10">
        <Link
          to="/"
          className="glyph flex items-center gap-2.5 text-[17px] tracking-[0.18em] text-[var(--fg)] hover:text-[var(--accent)] transition-colors duration-500"
        >
          象见
          <span className="grid h-5 w-5 place-items-center border border-[var(--seal)] text-[8px] tracking-normal text-[var(--seal)]">
            观
          </span>
        </Link>
        <nav className="flex gap-7 text-[var(--fg-faint)]">
          <Link to="/settings" className="hover:text-[var(--fg-dim)] transition-colors duration-500">
            设置
          </Link>
          <Link to="/about" className="hover:text-[var(--fg-dim)] transition-colors duration-500">
            关于
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-4 border-t border-[var(--line)]/60 px-6 py-5 text-center text-[12px] tracking-[0.2em] text-[var(--fg-faint)] sm:px-10">
        本地起盘 · 自选模型 · 刷新即散
      </footer>
    </div>
  )
}
