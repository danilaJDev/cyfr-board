'use client'

import { useEffect, useState } from 'react'
import { Icons } from './Icons'

type Theme = 'light' | 'dark'

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const current =
      (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'dark'
    setTheme(current)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch {}
  }

  // Render a placeholder during SSR / before hydration to avoid layout shift
  if (!mounted) {
    return (
      <div
        className={`h-9 w-9 rounded-xl ${className ?? ''}`}
        style={{ backgroundColor: 'var(--app-surface-2)' }}
        aria-hidden
      />
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${className ?? ''}`}
      style={{
        backgroundColor: 'var(--app-surface-2)',
        border: '1.5px solid var(--app-border)',
        color: 'var(--app-muted)',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--app-fg)'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--app-accent)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--app-muted)'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--app-border)'
      }}
    >
      {theme === 'dark' ? (
        <Icons.Sun className="h-4 w-4" />
      ) : (
        <Icons.Moon className="h-4 w-4" />
      )}
    </button>
  )
}
