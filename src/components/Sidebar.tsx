'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icons } from './Icons'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: Icons.Dashboard },
  { href: '/dashboard/projects', label: 'Проекты', icon: Icons.Projects },
  { href: '/dashboard/tasks', label: 'Задачи', icon: Icons.Tasks },
  { href: '/dashboard/team', label: 'Команда', icon: Icons.Team },
]

type SidebarProps = {
  profile: {
    full_name?: string | null
    role?: string | null
  } | null
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials =
    profile?.full_name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--primary)', color: 'white' }}>
              <Icons.Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold">CYFR Board</p>
              <p className="text-xs text-muted">Project Control</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard' ? pathname === href || pathname === '/dashboard/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={{
                background: active ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                border: active ? '1px solid color-mix(in srgb, var(--primary) 35%, var(--border))' : '1px solid transparent',
              }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3">
        <div className="surface rounded-2xl p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase text-white" style={{ background: 'var(--primary)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile?.full_name ?? 'Пользователь'}</p>
              <p className="truncate text-xs uppercase text-muted">{profile?.role ?? 'user'}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="btn-danger w-full">
            <Icons.Logout className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r lg:flex lg:flex-col" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {sidebarContent}
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b px-4 lg:hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button type="button" onClick={() => setOpen(true)} aria-label="Открыть меню" className="btn-secondary h-10 w-10 p-0">
          <Icons.Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--primary)' }}>
            <Icons.Building className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold">CYFR Board</span>
        </Link>

        <ThemeToggle />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] border-r" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть меню" className="btn-secondary absolute right-3 top-3 z-10 h-9 w-9 p-0">
              <Icons.X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
