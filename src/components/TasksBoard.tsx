'use client'

import Link from 'next/link'
import {useEffect, useMemo, useState, useTransition} from 'react'
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
    in_progress: {label: 'В работе', chipClass: 'status-accent'},
    done: {label: 'Выполнена', chipClass: 'status-success'},
    cancelled: {label: 'Отменена', chipClass: 'status-neutral'},
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('ru-RU')

function deadlineChipColor(deadline: string) {
    const msDiff = new Date(deadline).getTime() - Date.now()
    const days = msDiff / (1000 * 60 * 60 * 24)
    if (days <= 1) return 'status-danger'
    if (days <= 3) return 'status-warning'
    return 'status-success'
}

export default function TasksBoard({tasks}: { tasks: TaskItem[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [items, setItems] = useState(tasks)
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
    const supabase = createClient()
    
    useEffect(() => {
        setItems(tasks)
    }, [tasks])

    const grouped = useMemo(() => {
        const groups = new Map<string, TaskItem[]>()
        for (const task of items) {
            const key = task.project_name || 'Без проекта'
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(task)
        }

        return Array.from(groups.entries()).map(([projectName, projectTasks]) => ({
            projectName,
            tasks: projectTasks.sort((a, b) => {
                const aDone = a.status === 'done'
                const bDone = b.status === 'done'
                if (aDone !== bDone) return aDone ? 1 : -1
                const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
                const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
                return aDeadline - bDeadline
            }),
        }))
    }, [items])

    const toggleDone = async (task: TaskItem) => {
        const nextStatus = task.status === 'done' ? 'in_progress' : 'done'
        setUpdatingTaskId(task.id)
        setItems((prev) => prev.map((i) => (i.id === task.id ? {...i, status: nextStatus} : i)))
        const {error} = await supabase.from('tasks').update({status: nextStatus}).eq('id', task.id)
        if (error) {
            setItems((prev) => prev.map((i) => (i.id === task.id ? {...i, status: task.status} : i)))
        }
        startTransition(() => {
            router.refresh()
        })
        setUpdatingTaskId(null)
    }

    return (
        <div className="space-y-7">
            {grouped.map((group) => (
                <section key={group.projectName} className="space-y-3">
                    <div className="px-1">
                        <h2 className="text-lg font-bold t-fg sm:text-xl">{group.projectName}</h2>
                    </div>
                    <div className="grid gap-3">
                        {group.tasks.map((task) => {
                            const statusConfig = taskStatusLabels[task.status] ?? taskStatusLabels.in_progress
                            return (
                                <div
                                    key={task.id}
                                    className="glass-card group flex items-start gap-2.5 rounded-2xl border px-3 py-3 transition-all hover:-translate-y-0.5 sm:items-center sm:gap-4 sm:px-5"
                                    style={{borderColor: 'var(--app-border)'}}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleDone(task)}
                                        disabled={updatingTaskId === task.id || isPending}
                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors sm:mt-0 sm:h-10 sm:w-10 sm:rounded-xl"
                                        style={{
                                            borderColor: 'var(--app-border)',
                                            background: task.status === 'done' ? 'var(--status-success-bg)' : 'var(--app-surface-2)',
                                        }}
                                        aria-label={task.status === 'done' ? 'Вернуть в работу' : 'Пометить выполненной'}
                                    >
                                        <Icons.TaskCheck className="h-5 w-5"/>
                                    </button>

                                    <Link href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`} className="min-w-0 flex-1">
                                        <p className="text-base font-bold leading-tight t-fg sm:text-lg">{task.title}</p>
                                        {task.assignees.length > 0 && (
                                            <p className="mt-1 truncate text-sm t-muted">{task.assignees.join(', ')}</p>
                                        )}
                                        <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
                                            <span className={`chip ${statusConfig.chipClass}`}>{statusConfig.label}</span>
                                            {task.deadline ? (
                                                <span className={`chip ${deadlineChipColor(task.deadline)}`}>
                          {formatDate(task.deadline)}
                        </span>
                                            ) : (
                                                <span />
                                            )}
                                        </div>
                                    </Link>

                                    <div className="hidden h-full items-center gap-2 sm:flex">
                                        {task.deadline && (
                                            <span className={`chip ${deadlineChipColor(task.deadline)}`}>
                        {formatDate(task.deadline)}
                      </span>
                                        )}
                                        <span className={`chip ${statusConfig.chipClass}`}>{statusConfig.label}</span>
                                        <Icons.ChevronRight className="h-5 w-5 t-subtle"/>
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
