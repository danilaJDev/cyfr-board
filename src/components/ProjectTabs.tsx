'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icons } from './Icons'

const taskStatusLabels: Record<string, { label: string; color: string }> = {
    open: { label: 'Открыта', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    in_progress: { label: 'В работе', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
    done: { label: 'Выполнена', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    cancelled: { label: 'Отменена', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
}

const permitStatusLabels: Record<string, { label: string; color: string }> = {
    received: { label: 'Получено', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    expired: { label: 'Истекло', color: 'bg-red-500/10 text-red-300 border-red-500/20' },
    in_progress: { label: 'В процессе', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    pending: { label: 'В процессе', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
}

type Task = {
    id: string
    title: string
    status: string
    deadline?: string | null
    task_assignees?: Array<{ user?: { full_name?: string } | null }>
}

type Permit = {
    id: string
    permit_type: string
    status: string
    expires_at?: string | null
    notes?: string | null
}

type ProjectShape = {
    id: string
    tasks?: Task[] | null
    permits?: Permit[] | null
}

type ProjectTabsProps = {
    project: ProjectShape
    isAdmin: boolean
}

export default function ProjectTabs({ project, isAdmin }: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState<'tasks' | 'permits'>('tasks')

    const tabs = [
        {
            key: 'tasks' as const,
            label: 'Задачи',
            count: project.tasks?.length ?? 0,
            icon: Icons.Tasks,
        },
        {
            key: 'permits' as const,
            label: 'Разрешения',
            count: project.permits?.length ?? 0,
            icon: Icons.File,
        },
    ]

    return (
        <div>
            <div className="mb-5 -mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                <nav
                    className="flex min-w-max gap-1 border-b border-white/10"
                    aria-label="Tabs"
                >
                    {tabs.map(({ key, label, count, icon: Icon }) => {
                        const active = activeTab === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className={`group relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                                    active
                                        ? 'border-cyan-500 text-cyan-300'
                                        : 'border-transparent text-slate-400 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        active ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/5 text-slate-400'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {activeTab === 'tasks' && (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                            <Icons.Tasks className="h-5 w-5 text-slate-500" />
                            Задачи
                        </h2>
                        {isAdmin && (
                            <Link
                                href={`/dashboard/projects/${project.id}/tasks/new`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                                <Icons.Plus className="h-4 w-4" />
                                Добавить
                            </Link>
                        )}
                    </div>

                    {!project.tasks?.length ? (
                        <EmptyTab
                            icon={<Icons.Tasks className="h-7 w-7" />}
                            title="Задач пока нет"
                            description="Создайте первую задачу для этого проекта"
                        />
                    ) : (
                        <div className="grid gap-3">
                            {project.tasks.map((task) => {
                                const ts = taskStatusLabels[task.status] ?? taskStatusLabels.open
                                const assignees = task.task_assignees
                                    ?.map((a) => a.user?.full_name)
                                    .filter(Boolean) as string[] | undefined
                                const isOverdue =
                                    task.deadline &&
                                    new Date(task.deadline) < new Date() &&
                                    task.status !== 'done'

                                return (
                                    <Link
                                        key={task.id}
                                        href={`/dashboard/projects/${project.id}/tasks/${task.id}`}
                                        className="group glass-card flex flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-300">
                                                <Icons.TaskCheck className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-bold text-white transition-colors group-hover:text-cyan-300">
                                                    {task.title}
                                                </p>
                                                {assignees && assignees.length > 0 && (
                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {assignees.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 sm:gap-4 sm:border-0 sm:pt-0">
                                            {task.deadline && (
                                                <div className="text-left sm:text-right">
                                                    <p
                                                        className={`text-[10px] font-bold uppercase tracking-wider ${
                                                            isOverdue ? 'text-red-400' : 'text-slate-500'
                                                        }`}
                                                    >
                                                        Дедлайн
                                                    </p>
                                                    <p
                                                        className={`text-xs font-medium ${
                                                            isOverdue ? 'font-bold text-red-400' : 'text-white'
                                                        }`}
                                                    >
                                                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                                    </p>
                                                </div>
                                            )}
                                            <span className={`chip ${ts.color}`}>{ts.label}</span>
                                            <Icons.ChevronRight className="hidden h-5 w-5 text-slate-700 transition group-hover:text-cyan-400 sm:block" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'permits' && (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                            <Icons.File className="h-5 w-5 text-slate-500" />
                            Разрешения
                        </h2>
                        {isAdmin && (
                            <Link
                                href={`/dashboard/projects/${project.id}/permits/new`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                                <Icons.Plus className="h-4 w-4" />
                                Добавить
                            </Link>
                        )}
                    </div>

                    {!project.permits?.length ? (
                        <EmptyTab
                            icon={<Icons.File className="h-7 w-7" />}
                            title="Разрешений пока нет"
                            description="Добавьте первое разрешение по проекту"
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {project.permits.map((permit) => {
                                const ps =
                                    permitStatusLabels[permit.status] ?? permitStatusLabels.in_progress
                                return (
                                    <div
                                        key={permit.id}
                                        className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-start sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-white">
                                                {permit.permit_type}
                                            </p>
                                            {permit.notes && (
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                                                    {permit.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                                            <span className={`chip ${ps.color}`}>{ps.label}</span>
                                            {permit.expires_at && (
                                                <p className="text-[11px] text-slate-500">
                                                    до {new Date(permit.expires_at).toLocaleDateString('ru-RU')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function EmptyTab({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="section-card flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-500">
                {icon}
            </div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
    )
}
