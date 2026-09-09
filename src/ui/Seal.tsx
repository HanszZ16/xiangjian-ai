import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'seal' | 'quiet'
}

/**
 * 朱砂印章式按钮。主行动用 seal，次级用 quiet。
 * 刻意做成方章而非圆角胶囊。
 */
export function Seal({ children, variant = 'seal', className = '', ...rest }: Props) {
  const base =
    'relative inline-flex items-center justify-center px-7 py-2.5 text-[15px] tracking-[0.35em] ' +
    'indent-[0.35em] transition-all duration-500 disabled:opacity-35 disabled:cursor-not-allowed ' +
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] cursor-pointer'

  const skin =
    variant === 'seal'
      ? 'text-[var(--color-paper)] bg-[var(--seal)]/85 hover:bg-[var(--seal)] ' +
        'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--seal)_60%,white)]'
      : 'text-[var(--fg-dim)] hover:text-[var(--fg)] bg-transparent ' +
        'shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_var(--accent)]'

  return (
    <button className={`${base} ${skin} ${className}`} {...rest}>
      {children}
    </button>
  )
}
