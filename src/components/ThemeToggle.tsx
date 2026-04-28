'use client'

import { useEffect, useState } from 'react'
import { Icons } from './Icons'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cyfr-theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const root = document.documentElement
    const current = (root.getAttribute('data-theme') as Theme | null) ?? 'light'
    setTheme(current)
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-secondary h-10 w-10 rounded-xl p-0"
      aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
    >
      {theme === 'light' ? <Icons.Moon className="h-4 w-4" /> : <Icons.Sun className="h-4 w-4" />}
    </button>
  )
}
