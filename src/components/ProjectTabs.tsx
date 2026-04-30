'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Icons} from './Icons'
import {parsePermitNotes} from '@/lib/permits'
import PermitCardDocs from '@/components/PermitCardDocs'

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
    issued_at?: string | null
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
            <div className="mb-5 -mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                <nav className="flex min-w-max gap-1 border-b" style={{borderColor: 'var(--app-border)'}} aria-label="Tabs">
                    {tabs.map(({key, label, count, icon: Icon}) => {
                        const active = activeTab === key
                        return (
                            <button key={key} type="button" onClick={() => setActiveTab(key)}
                                className="group relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200"
                                style={{borderBottomColor: active ? 'var(--app-accent-text)' : 'transparent', color: active ? 'var(--app-accent-text)' : 'var(--app-muted)'}}>
                                <Icon className="h-4 w-4"/>
                                {label}
                                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                    style={{background: active ? 'var(--app-accent-subtle)' : 'var(--app-surface-2)', color: active ? 'var(--app-accent-text)' : 'var(--app-muted)'}}>
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
                        <h2 className="flex items-center gap-2 text-lg font-bold t-fg">
                            <Icons.Tasks className="h-5 w-5 t-subtle"/>Задачи
                        </h2>
                        {isAdmin && (
                            <Link href={`/dashboard/projects/${project.id}/tasks/new`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                                style={{borderColor: 'var(--app-accent-ring)', background: 'var(--app-accent-subtle)', color: 'var(--app-accent-text)'}}>
                                <Icons.Plus className="h-4 w-4"/>Добавить
                            </Link>
                        )}
                    </div>
                    {!project.tasks?.length ? (
                        <EmptyTab icon={<Icons.Tasks className="h-7 w-7"/>} title="Задач пока нет" description="Создайте первую задачу для этого проекта"/>
                    ) : (
                        <div className="grid gap-2.5">
                            {project.tasks.map((task) => {
                                const ts = taskStatusLabels[task.status] ?? taskStatusLabels.open
                                const assignees = task.task_assignees?.map((a) => a.user?.full_name).filter(Boolean) as string[] | undefined
                                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
                                const isDone = task.status === 'done'
                                const isCancelled = task.status === 'cancelled'
                                return (
                                    <Link key={task.id} href={`/dashboard/projects/${project.id}/tasks/${task.id}`}
                                        className="glass-card group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5 sm:gap-4 sm:px-5"
                                        style={{borderColor: 'var(--app-border)', opacity: isCancelled ? 0.65 : 1}}>
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
                                            style={{background: isDone ? 'var(--status-success-bg)' : 'var(--app-surface-2)', color: isDone ? 'var(--status-success-text)' : 'var(--app-subtle)'}}>
                                            {isDone ? <Icons.Check className="h-4 w-4"/> : <Icons.TaskCheck className="h-4 w-4"/>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold t-fg" style={{textDecoration: isDone || isCancelled ? 'line-through' : 'none'}}>
                                                {task.title}
                                            </p>
                                            {assignees && assignees.length > 0 && (
                                                <p className="mt-0.5 truncate text-xs t-subtle">{assignees.join(', ')}</p>
                                            )}
                                        </div>
                                        <div className="hidden shrink-0 items-center gap-2 sm:flex">
                                            {task.deadline && (
                                                <span className={`chip ${isOverdue ? 'status-danger' : isDone ? 'status-neutral' : 'status-success'}`}>
                                                    {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                                </span>
                                            )}
                                            <span className={`chip ${ts.chipClass}`}>{ts.label}</span>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:hidden">
                                            <span className={`chip ${ts.chipClass}`}>{ts.label}</span>
                                            {task.deadline && (
                                                <span className={`chip ${isOverdue ? 'status-danger' : isDone ? 'status-neutral' : 'status-success'}`}>
                                                    {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                                </span>
                                            )}
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
                        <h2 className="flex items-center gap-2 text-lg font-bold t-fg">
                            <Icons.File className="h-5 w-5 t-subtle"/>Разрешения
                        </h2>
                        {isAdmin && (
                            <Link href={`/dashboard/projects/${project.id}/permits/new`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                                style={{borderColor: 'var(--app-accent-ring)', background: 'var(--app-accent-subtle)', color: 'var(--app-accent-text)'}}>
                                <Icons.Plus className="h-4 w-4"/>Добавить
                            </Link>
                        )}
                    </div>
                    {!project.permits?.length ? (
                        <EmptyTab icon={<Icons.File className="h-7 w-7"/>} title="Разрешений пока нет" description="Добавьте первое разрешение по проекту"/>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {project.permits.map((permit) => {
                                const ps = permitStatusLabels[permit.status] ?? permitStatusLabels.pending
                                const meta = parsePermitNotes(permit.notes)
                                const docs = meta.documents ?? []
                                const isExpired = permit.status === 'expired'
                                const daysLeft = permit.expires_at
                                    ? (new Date(permit.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                    : null
                                const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 14 && !isExpired
                                return (
                                    <div key={permit.id}
                                         className="glass-card flex flex-col overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                         style={{borderColor: isExpired ? 'var(--status-danger-border)' : isExpiringSoon ? 'var(--status-warning-border)' : undefined}}>
                                        <Link href={`/dashboard/permits/${permit.id}`} className="flex flex-1 flex-col gap-4 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium uppercase tracking-wide t-subtle">Тип разрешения</p>
                                                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug t-fg">{permit.permit_type}</h3>
                                                </div>
                                                <span className={`chip shrink-0 ${ps.chipClass}`}>{ps.label}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 rounded-xl p-3"
                                                 style={{background: 'var(--app-surface-2)'}}>
                                                <div>
                                                    <p className="text-[11px] t-subtle">Дата начала</p>
                                                    <p className="mt-1 text-sm font-semibold t-fg">{permit.issued_at ? new Date(permit.issued_at).toLocaleDateString('ru-RU') : 'Не указана'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] t-subtle">Дата окончания</p>
                                                    <p className="mt-1 text-sm font-semibold"
                                                       style={{color: isExpired ? 'var(--status-danger-text)' : isExpiringSoon ? 'var(--status-warning-text)' : undefined}}>
                                                        {permit.expires_at ? new Date(permit.expires_at).toLocaleDateString('ru-RU') : 'Не указана'}
                                                    </p>
                                                </div>
                                            </div>
                                            {(isExpired || isExpiringSoon) && (
                                                <div className="rounded-xl px-3 py-2 text-xs font-medium"
                                                     style={{color: isExpired ? 'var(--status-danger-text)' : 'var(--status-warning-text)', background: isExpired ? 'var(--status-danger-bg)' : 'var(--status-warning-bg)'}}>
                                                    {isExpired ? 'Разрешение истекло' : `Скоро истекает · осталось ${Math.ceil(daysLeft!)} дн.`}
                                                </div>
                                            )}
                                        </Link>
                                        <div className="border-t" style={{borderColor: 'var(--app-border)'}}>
                                            <PermitCardDocs documents={docs}/>
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

function EmptyTab({icon, title, description}: {icon: React.ReactNode; title: string; description: string}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center"
            style={{borderColor: 'var(--app-border)', background: 'var(--app-surface-2)'}}>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle" style={{background: 'var(--app-surface)'}}>
                {icon}
            </div>
            <p className="text-sm font-bold t-fg">{title}</p>
            <p className="mt-1 text-xs t-subtle">{description}</p>
        </div>
    )
}
