import { Link, Outlet, useLocation } from 'react-router'

/** 页框：顶栏与页脚。刻意做得很轻，不抢内容。 */
export function Chrome() {
  const { pathname } = useLocation()
  const atHome = pathname === '/'

  return (
    <div className="relative z-10 min-h-full flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 text-[13px] tracking-[0.25em]">
        <Link
          to="/"
          className="glyph text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors duration-500"
          style={{ opacity: atHome ? 0 : 1, pointerEvents: atHome ? 'none' : 'auto' }}
        >
          象见
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

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="px-6 sm:px-10 py-5 text-[12px] tracking-[0.2em] text-[var(--fg-faint)]">
        本地排盘 · 无服务器 · 不留痕迹
      </footer>
    </div>
  )
}
