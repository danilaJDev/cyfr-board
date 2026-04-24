'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 shadow-lg shadow-cyan-500/20">
                <Icons.Projects className="h-6 w-6 text-slate-950" />
            </div>
            <div>
                <p className="text-lg font-bold tracking-tight text-white">CYFR Board</p>
                <p className="text-[10px] uppercase tracking-widest text-cyan-500 font-semibold">Fitout Command</p>
            </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' 
            ? pathname === href || pathname === '/dashboard/'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-cyan-400' : ''}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="glass rounded-2xl p-4 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-lg">
                {profile?.full_name?.[0] ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{profile?.full_name ?? 'Пользователь'}</p>
                <p className="text-[10px] uppercase tracking-tighter text-slate-400">{profile?.role ?? 'user'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/5 bg-slate-950/80 backdrop-blur-xl md:flex md:flex-col">
        {sidebarContent}
      </aside>

      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 text-white shadow-lg backdrop-blur md:hidden"
      >
        <Icons.Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-white/10 bg-slate-950 animate-in slide-in-from-left">
            <button 
                onClick={() => setOpen(false)} 
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white"
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

