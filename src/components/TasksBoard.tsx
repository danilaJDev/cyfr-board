'use client'

import Link from 'next/link'
import {useMemo, useState, useTransition} from 'react'
import {Icons} from '@/components/Icons'
import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'

type TaskItem = {
    id: string
    title: string
    status: string
    deadline: string | null
    project_id: string
    project_name: string
    assignees: string[]
}

const taskStatusLabels: Record<string, { label: string; chipClass: string }> = {
    open: {label: 'Открыта', chipClass: 'status-info'},
    in_progress: {label: 'В работе', chipClass: 'status-accent'},
    done: {label: 'Выполнена', chipClass: 'status-success'},
    cancelled: {label: 'Отменена', chipClass: 'status-neutral'},
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('ru-RU')

function deadlineChipColor(deadline: string, isDone: boolean) {
    if (isDone) return 'status-neutral'
    const msDiff = new Date(deadline).getTime() - Date.now()
    const days = msDiff / (1000 * 60 * 60 * 24)
    if (days < 0) return 'status-danger'
    if (days <= 1) return 'status-danger'
    if (days <= 3) return 'status-warning'
    return 'status-success'
}

export default function TasksBoard({tasks}: { tasks: TaskItem[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [items, setItems] = useState(tasks)
    const [query, setQuery] = useState('')
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
    const supabase = createClient()

    const grouped = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        const visibleItems = normalizedQuery
            ? items.filter((task) => {
                const searchable = [
                    task.title,
                    task.project_name,
                    ...task.assignees,
                ].join(' ').toLowerCase()

                return searchable.includes(normalizedQuery)
            })
            : items

        const groups = new Map<string, TaskItem[]>()
        for (const task of visibleItems) {
            const key = task.project_name || 'Без проекта'
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(task)
        }
        return Array.from(groups.entries()).map(([projectName, projectTasks]) => ({
            projectName,
            projectId: projectTasks[0]?.project_id,
            tasks: projectTasks.sort((a, b) => {
                const order: Record<string, number> = {in_progress: 1, done: 3, cancelled: 4}
                const aOrd = order[a.status] ?? 2
                const bOrd = order[b.status] ?? 2
                if (aOrd !== bOrd) return aOrd - bOrd
                const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
                const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
                return aDeadline - bDeadline
            }),
        }))
    }, [items, query])

    const doneCount = items.filter((task) => task.status === 'done').length
    const activeCount = items.filter((task) => task.status !== 'done' && task.status !== 'cancelled').length
    const overdueCount = items.filter((task) => task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done' && task.status !== 'cancelled').length

    const toggleDone = async (task: TaskItem) => {
        const nextStatus = task.status === 'done' ? 'in_progress' : 'done'
        setUpdatingTaskId(task.id)
        setItems((prev) => prev.map((i) => (i.id === task.id ? {...i, status: nextStatus} : i)))
        const {error} = await supabase.from('tasks').update({status: nextStatus}).eq('id', task.id)
        if (error) {
            setItems((prev) => prev.map((i) => (i.id === task.id ? {...i, status: task.status} : i)))
        }
        startTransition(() => { router.refresh() })
        setUpdatingTaskId(null)
    }

    return (
        <div className="space-y-6">
            <div className="section-card space-y-4">
                <label className="relative block">
                    <span className="sr-only">Поиск задач</span>
                    <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 t-subtle"/>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="input-base pl-10"
                        placeholder="Поиск по задаче, проекту или ответственному"
                    />
                </label>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="chip status-info">{activeCount} активных</span>
                    <span className="chip status-success">{doneCount} выполнено</span>
                    <span className={`chip ${overdueCount ? 'status-danger' : 'status-neutral'}`}>{overdueCount} просрочено</span>
                </div>
            </div>

            {!grouped.length && (
                <div className="section-card flex flex-col items-center justify-center py-14 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle" style={{background: 'var(--app-surface-2)'}}>
                        <Icons.Search className="h-7 w-7"/>
                    </div>
                    <p className="text-base font-bold t-fg">Задачи не найдены</p>
                    <p className="mt-1 text-sm t-subtle">Измените поиск или фильтр статуса</p>
                </div>
            )}

            {grouped.map((group) => (
                <section key={group.projectName}>
                    <div className="mb-3 flex items-center gap-3 px-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{background: 'var(--app-accent-subtle)'}}>
                            <Icons.Projects className="h-4 w-4 t-accent"/>
                        </div>
                        {group.projectId ? (
                            <Link href={`/dashboard/projects/${group.projectId}`} className="text-base font-bold t-fg transition-opacity hover:opacity-70 sm:text-lg">
                                {group.projectName}
                            </Link>
                        ) : (
                            <h2 className="text-base font-bold t-fg sm:text-lg">{group.projectName}</h2>
                        )}
                        <span className="rounded-full px-2 py-0.5 text-[15px] font-semibold t-accent" style={{background: 'var(--app-accent-subtle)'}}>
                            {group.tasks.length}
                        </span>
                    </div>
                    <div className="grid gap-2.5">
                        {group.tasks.map((task) => {
                            const statusConfig = taskStatusLabels[task.status] ?? taskStatusLabels.in_progress
                            const isDone = task.status === 'done'
                            const isCancelled = task.status === 'cancelled'
                            const isUpdating = updatingTaskId === task.id
                            return (
                                <div
                                    key={task.id}
                                    className="glass-card group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5 sm:gap-4 sm:px-5"
                                    style={{borderColor: 'var(--app-border)', opacity: isCancelled ? 0.65 : 1}}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleDone(task)}
                                        disabled={isUpdating || isPending || isCancelled}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                                        style={{
                                            borderColor: isDone ? 'var(--status-success-border)' : 'var(--app-border-strong)',
                                            background: isDone ? 'var(--status-success-bg)' : 'var(--app-surface-2)',
                                            color: isDone ? 'var(--status-success-text)' : 'var(--app-subtle)',
                                        }}
                                        aria-label={isDone ? 'Вернуть в работу' : 'Пометить выполненной'}
                                    >
                                        {isUpdating ? <Icons.Loader className="h-4 w-4 animate-spin"/> : <Icons.Check className="h-4 w-4"/>}
                                    </button>
                                    <Link href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`} className="min-w-0 flex-1">
                                        <p
                                            className="text-sm font-semibold leading-snug t-fg sm:text-base"
                                            style={{textDecoration: isDone || isCancelled ? 'line-through' : 'none', color: isDone || isCancelled ? 'var(--app-muted)' : undefined}}
                                        >
                                            {task.title}
                                        </p>
                                        {task.assignees.length > 0 && (
                                            <p className="mt-0.5 truncate text-xs t-subtle">{task.assignees.join(', ')}</p>
                                        )}
                                    </Link>
                                    <div className="hidden items-center gap-2 sm:flex">
                                        {task.deadline && (
                                            <span className={`chip ${deadlineChipColor(task.deadline, isDone)}`}>
                                                {formatDate(task.deadline)}
                                            </span>
                                        )}
                                        <span className={`chip ${statusConfig.chipClass}`}>{statusConfig.label}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 sm:hidden">
                                        <span className={`chip ${statusConfig.chipClass}`}>{statusConfig.label}</span>
                                        {task.deadline && (
                                            <span className={`chip ${deadlineChipColor(task.deadline, isDone)}`}>
                                                {formatDate(task.deadline)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}
