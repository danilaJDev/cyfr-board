'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: '▦' },
  { href: '/dashboard/projects', label: 'Проекты', icon: '◫' },
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
      <div className="border-b border-white/10 p-6">
        <p className="text-lg font-bold tracking-tight text-white">CYFR FITOUT</p>
        <p className="mt-0.5 text-xs text-slate-400">Project command center</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-1 flex items-center gap-3 rounded-xl px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
            {profile?.full_name?.[0] ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile?.full_name ?? 'Пользователь'}</p>
            <p className="text-xs capitalize text-slate-400">{profile?.role ?? 'user'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <span>↩</span>
          Выйти
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur md:flex md:flex-col">
        {sidebarContent}
      </aside>

      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-white/20 bg-slate-950/90 p-2.5 text-white md:hidden"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-white/10 bg-slate-950">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-slate-400">
              ✕
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
