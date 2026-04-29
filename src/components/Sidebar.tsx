'use client'

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {Icons} from './Icons'
import {ThemeToggle} from './ThemeToggle'

const navItems = [
    {href: '/dashboard', label: 'Дашборд', icon: Icons.Dashboard},
    {href: '/dashboard/projects', label: 'Проекты', icon: Icons.Projects},
    {href: '/dashboard/tasks', label: 'Задачи', icon: Icons.Tasks},
    {href: '/dashboard/permits', label: 'Разрешения', icon: Icons.File},
    {href: '/dashboard/team', label: 'Команда', icon: Icons.Team},
]

type SidebarProps = {
    profile: { full_name?: string | null; role?: string | null } | null
}

export default function Sidebar({profile}: SidebarProps) {
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

    /* ── Shared sidebar content ───────────────────── */
    const sidebarContent = (
        <div className="flex h-full flex-col">

            {/* Logo */}
            <div className="px-5 pb-3 pt-6">
                <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-1 transition-opacity hover:opacity-85"
                >
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.30)',
                        }}
                    >
                        <Icons.Building className="h-5 w-5 text-white"/>
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold tracking-tight t-fg">
                            CYFR Board
                        </p>
                        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] t-accent">
                            Fitout Command
                        </p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 scrollbar-thin">
                {navItems.map(({href, label, icon: Icon}) => {
                    const active =
                        href === '/dashboard'
                            ? pathname === href || pathname === '/dashboard/'
                            : pathname.startsWith(href)
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className={`nav-item w-full${active ? ' active' : ''}`}
                        >
                            {active && (
                                <span
                                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full"
                                    style={{backgroundColor: 'var(--app-accent-text)'}}
                                />
                            )}
                            <Icon className="h-[18px] w-[18px] shrink-0"/>
                            <span className="truncate">{label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom: user card + theme toggle */}
            <div className="p-3">
                <div
                    className="rounded-2xl p-3"
                    style={{
                        background: 'var(--app-surface-2)',
                        border: '1px solid var(--app-border)',
                    }}
                >
                    {/* User info row */}
                    <div className="mb-3 flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase text-white shadow-md"
                            style={{background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'}}
                        >
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold t-fg">
                                {profile?.full_name ?? 'Пользователь'}
                            </p>
                            <p className="truncate text-[10px] font-semibold uppercase tracking-wider t-subtle">
                                {profile?.role ?? 'user'}
                            </p>
                        </div>
                        <ThemeToggle/>
                    </div>

                    {/* Logout button */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="btn-ghost w-full justify-center border py-2.5 text-xs font-semibold"
                        style={{borderColor: 'var(--app-border)'}}
                    >
                        <Icons.Logout className="h-4 w-4"/>
                        Выйти
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className="fixed left-0 top-0 z-40 hidden h-screen w-72 lg:flex lg:flex-col"
                style={{
                    background: 'var(--sidebar-bg)',
                    borderRight: '1px solid var(--sidebar-border)',
                    boxShadow: 'var(--sidebar-shadow)',
                }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile top bar */}
            <header
                className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between px-4 lg:hidden"
                style={{
                    background: 'var(--sidebar-bg)',
                    borderBottom: '1px solid var(--sidebar-border)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Открыть меню"
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
                    style={{
                        background: 'var(--app-surface-2)',
                        border: '1px solid var(--app-border)',
                        color: 'var(--app-fg)',
                    }}
                >
                    <Icons.Menu className="h-5 w-5"/>
                </button>

                <Link href="/dashboard" className="flex items-center gap-2">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'}}
                    >
                        <Icons.Building className="h-4 w-4 text-white"/>
                    </div>
                    <span className="text-sm font-bold tracking-tight t-fg">CYFR Board</span>
                </Link>

                <ThemeToggle/>
            </header>

            {/* Mobile drawer */}
            {open && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="absolute inset-0 animate-in"
                        onClick={() => setOpen(false)}
                        style={{background: 'rgba(9,14,28,0.65)', backdropFilter: 'blur(4px)'}}
                    />
                    <aside
                        className="relative h-full w-72 max-w-[85vw] animate-slide-in"
                        style={{
                            background: 'var(--sidebar-bg)',
                            borderRight: '1px solid var(--sidebar-border)',
                            boxShadow: 'var(--sidebar-shadow)',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Закрыть меню"
                            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
                            style={{background: 'var(--app-surface-2)', color: 'var(--app-muted)'}}
                        >
                            <Icons.X className="h-5 w-5"/>
                        </button>
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    )
}
