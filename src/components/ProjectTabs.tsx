'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Icons} from './Icons'

const taskStatusLabels: Record<string, { label: string; chipClass: string }> = {
    open: {label: 'Открыта', chipClass: 'status-info'},
    in_progress: {label: 'В работе', chipClass: 'status-accent'},
    done: {label: 'Выполнена', chipClass: 'status-success'},
    cancelled: {label: 'Отменена', chipClass: 'status-neutral'},
}

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
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

export default function ProjectTabs({project, isAdmin}: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState<'tasks' | 'permits'>('tasks')

    const tabs = [
        {key: 'tasks' as const, label: 'Задачи', count: project.tasks?.length ?? 0, icon: Icons.Tasks},
        {key: 'permits' as const, label: 'Разрешения', count: project.permits?.length ?? 0, icon: Icons.File},
    ]

    return (
        <div>
            {/* Tab bar */}
            <div className="mb-5 -mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                <nav
                    className="flex min-w-max gap-1 border-b"
                    style={{borderColor: 'var(--app-border)'}}
                    aria-label="Tabs"
                >
                    {tabs.map(({key, label, count, icon: Icon}) => {
                        const active = activeTab === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className="group relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200"
                                style={{
                                    borderBottomColor: active ? 'var(--app-accent-text)' : 'transparent',
                                    color: active ? 'var(--app-accent-text)' : 'var(--app-muted)',
                                }}
                            >
                                <Icon className="h-4 w-4"/>
                                {label}
                                <span
                                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                    style={{
                                        background: active ? 'var(--app-accent-subtle)' : 'var(--app-surface-2)',
                                        color: active ? 'var(--app-accent-text)' : 'var(--app-muted)',
                                    }}
                                >
                  {count}
                </span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tasks tab */}
            {activeTab === 'tasks' && (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold t-fg">
                            <Icons.Tasks className="h-5 w-5 t-subtle"/>
                            Задачи
                        </h2>
                        {isAdmin && (
                            <Link
                                href={`/dashboard/projects/${project.id}/tasks/new`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                                style={{
                                    borderColor: 'var(--app-accent-ring)',
                                    background: 'var(--app-accent-subtle)',
                                    color: 'var(--app-accent-text)',
                                }}
                            >
                                <Icons.Plus className="h-4 w-4"/>
                                Добавить
                            </Link>
                        )}
                    </div>

                    {!project.tasks?.length ? (
                        <EmptyTab
                            icon={<Icons.Tasks className="h-7 w-7"/>}
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
                                        className="group glass-card flex flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl t-subtle transition-colors"
                                                style={{background: 'var(--app-surface-2)'}}
                                            >
                                                <Icons.TaskCheck className="h-5 w-5"/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-bold t-fg">{task.title}</p>
                                                {assignees && assignees.length > 0 && (
                                                    <p className="mt-0.5 truncate text-xs t-subtle">
                                                        {assignees.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center justify-between gap-3 border-t pt-3 sm:gap-4 sm:border-0 sm:pt-0"
                                            style={{borderColor: 'var(--app-border)'}}
                                        >
                                            {task.deadline && (
                                                <div className="text-left sm:text-right">
                                                    <p
                                                        className="text-[10px] font-bold uppercase tracking-wider"
                                                        style={{color: isOverdue ? 'var(--status-danger-text)' : 'var(--app-subtle)'}}
                                                    >
                                                        Дедлайн
                                                    </p>
                                                    <p
                                                        className="text-xs font-medium"
                                                        style={{color: isOverdue ? 'var(--status-danger-text)' : 'var(--app-fg)'}}
                                                    >
                                                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                                    </p>
                                                </div>
                                            )}
                                            <span className={`chip ${ts.chipClass}`}>{ts.label}</span>
                                            <Icons.ChevronRight className="hidden h-5 w-5 t-subtle sm:block"/>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Permits tab */}
            {activeTab === 'permits' && (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold t-fg">
                            <Icons.File className="h-5 w-5 t-subtle"/>
                            Разрешения
                        </h2>
                        {isAdmin && (
                            <Link
                                href={`/dashboard/projects/${project.id}/permits/new`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                                style={{
                                    borderColor: 'var(--app-accent-ring)',
                                    background: 'var(--app-accent-subtle)',
                                    color: 'var(--app-accent-text)',
                                }}
                            >
                                <Icons.Plus className="h-4 w-4"/>
                                Добавить
                            </Link>
                        )}
                    </div>

                    {!project.permits?.length ? (
                        <EmptyTab
                            icon={<Icons.File className="h-7 w-7"/>}
                            title="Разрешений пока нет"
                            description="Добавьте первое разрешение по проекту"
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {project.permits.map((permit) => {
                                const ps = permitStatusLabels[permit.status] ?? permitStatusLabels.in_progress
                                return (
                                    <div
                                        key={permit.id}
                                        className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-start sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold t-fg">{permit.permit_type}</p>
                                            {permit.notes && (
                                                <p className="mt-1 line-clamp-2 text-xs t-muted">{permit.notes}</p>
                                            )}
                                        </div>
                                        <div
                                            className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                                            <span className={`chip ${ps.chipClass}`}>{ps.label}</span>
                                            {permit.expires_at && (
                                                <p className="text-[11px] t-subtle">
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
        <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center"
            style={{borderColor: 'var(--app-border)', background: 'var(--app-surface-2)'}}
        >
            <div
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle"
                style={{background: 'var(--app-surface)'}}
            >
                {icon}
            </div>
            <p className="text-sm font-bold t-fg">{title}</p>
            <p className="mt-1 text-xs t-subtle">{description}</p>
        </div>
    )
}
