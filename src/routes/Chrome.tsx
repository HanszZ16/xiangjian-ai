import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'

/** 页框：顶栏与页脚。刻意做得很轻，不抢内容。 */
export function Chrome() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="app-shell relative z-10 min-h-full flex flex-col">
      <a className="skip-link" href="#main-content">跳至正文</a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="象见 · 首页">
            <span className="brand-mark glyph" aria-hidden="true">象</span>
            <span className="glyph">象见</span>
          </Link>
          <nav className="header-nav" aria-label="主导航">
            <NavLink to="/" end>观象</NavLink>
            <NavLink to="/settings">设置</NavLink>
            <NavLink to="/about">关于</NavLink>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span className="footer-motto">观象而不执象</span>
        <span className="footer-principles">本地起盘<span>·</span>自选模型<span>·</span>刷新即散</span>
      </footer>
    </div>
  )
}
