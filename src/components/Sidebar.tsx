'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
    { href: '/dashboard',          label: 'Дашборд',   icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'Проекты',   icon: FolderKanban },
    { href: '/dashboard/tasks',    label: 'Задачи',    icon: CheckSquare },
    { href: '/dashboard/team',     label: 'Команда',   icon: Users },
]

export default function Sidebar({ profile }: { profile: any }) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-800">
                <p className="text-white font-bold text-lg tracking-tight">CYFR FITOUT</p>
                <p className="text-gray-500 text-xs mt-0.5">Project Management</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                                active
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {profile?.full_name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{profile?.full_name ?? 'Пользователь'}</p>
                        <p className="text-gray-500 text-xs capitalize">{profile?.role ?? 'user'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition"
                >
                    <LogOut size={18} />
                    Выйти
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Десктоп сайдбар */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex-col z-40">
                <SidebarContent />
            </aside>

            {/* Мобильная кнопка */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white"
            >
                <Menu size={20} />
            </button>

            {/* Мобильный сайдбар */}
            {open && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <aside className="relative w-72 bg-gray-900 h-full flex flex-col border-r border-gray-800">
                        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400">
                            <X size={20} />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}
        </>
    )
}