'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icons } from './Icons'

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

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll when sidebar is open
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

  const initials = profile?.full_name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition hover:opacity-90"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30">
            <Icons.Building className="h-6 w-6 text-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-white">CYFR Board</p>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-semibold">
              Fitout Command
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === href || pathname === '/dashboard/'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.08)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-cyan-400" />
              )}
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  active ? 'text-cyan-300' : 'group-hover:text-cyan-300'
                }`}
              />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold uppercase text-white shadow-lg">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {profile?.full_name ?? 'Пользователь'}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wider text-slate-400">
                {profile?.role ?? 'user'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
          >
            <Icons.Logout className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/5 bg-slate-950/80 backdrop-blur-xl lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-slate-950/80 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
        >
          <Icons.Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md shadow-cyan-500/30">
            <Icons.Building className="h-5 w-5 text-slate-950" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">CYFR Board</span>
        </Link>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold uppercase text-white">
          {initials}
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r border-white/10 bg-slate-950 shadow-2xl animate-slide-in">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть меню"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <Icons.X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
