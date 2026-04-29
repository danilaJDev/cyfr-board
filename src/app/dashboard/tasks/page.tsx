import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

const taskStatusLabels: Record<string, { label: string; chipClass: string }> = {
    open: {label: 'Открыта', chipClass: 'status-info'},
    in_progress: {label: 'В работе', chipClass: 'status-accent'},
    done: {label: 'Выполнена', chipClass: 'status-success'},
    cancelled: {label: 'Отменена', chipClass: 'status-neutral'},
}

type AssigneeItem = { user?: { full_name?: string } | null }

const filters = [
    {value: 'all', label: 'Все'},
    {value: 'open', label: 'Открытые'},
    {value: 'in_progress', label: 'В работе'},
    {value: 'done', label: 'Выполненные'},
    {value: 'cancelled', label: 'Отменённые'},
]

export default async function TasksPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ status?: string }>
}) {
    const {status} = await searchParams
    const currentStatus = status ?? 'all'
    const supabase = await createClient()

    let query = supabase
        .from('tasks')
        .select(
            'id, title, status, deadline, project_id, project:projects(name), task_assignees(user:profiles(full_name))',
        )
        .order('created_at', {ascending: false})

    if (currentStatus && currentStatus !== 'all') {
        query = query.eq('status', currentStatus)
    }

    const {data: tasks} = await query

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Задачи</h1>
                <p className="mt-1 text-sm t-muted">
                    Полный контроль и мониторинг по всем объектам
                </p>
            </div>

            {/* Filter chips */}
            <div className="mb-6 -mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                <nav className="flex min-w-max gap-2">
                    {filters.map((f) => {
                        const active = f.value === currentStatus
                        const href =
                            f.value === 'all'
                                ? '/dashboard/tasks'
                                : `/dashboard/tasks?status=${f.value}`
                        return (
                            <Link
                                key={f.value}
                                href={href}
                                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200"
                                style={
                                    active
                                        ? {
                                            background: 'var(--app-accent)',
                                            color: 'var(--app-accent-fg)',
                                            boxShadow: '0 2px 8px var(--app-accent-ring)',
                                        }
                                        : {
                                            background: 'var(--app-surface-2)',
                                            border: '1px solid var(--app-border)',
                                            color: 'var(--app-muted)',
                                        }
                                }
                            >
                                {f.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {tasks?.length ? (
                <div className="grid gap-3">
                    {tasks.map((task) => {
                        const rawAssignees: AssigneeItem[] = (task.task_assignees ?? []) as never
                        const assignees = rawAssignees
                            .map((item) => item?.user?.full_name ?? '')
                            .filter((name): name is string => name.length > 0)
                        const projectName = Array.isArray(task.project)
                            ? task.project[0]?.name
                            : (task.project as { name?: string } | null)?.name
                        const statusConfig = taskStatusLabels[task.status] ?? taskStatusLabels.open
                        const isOverdue =
                            task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

                        return (
                            <Link
                                key={task.id}
                                href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`}
                                className="group glass-card flex flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                            >
                                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors t-subtle group-hover:t-accent sm:h-11 sm:w-11"
                                        style={{background: 'var(--app-surface-2)'}}
                                    >
                                        <Icons.TaskCheck className="h-5 w-5"/>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold t-fg">
                                            {task.title}
                                        </p>
                                        <div
                                            className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs t-subtle">
                      <span className="font-semibold t-accent">
                        {projectName ?? 'Без проекта'}
                      </span>
                                            {assignees.length > 0 && (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="truncate">{assignees.join(', ')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center justify-between gap-3 border-t pt-3 sm:flex-row sm:gap-4 sm:border-0 sm:pt-0"
                                    style={{borderColor: 'var(--app-border)'}}
                                >
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
                                            {task.deadline
                                                ? new Date(task.deadline).toLocaleDateString('ru-RU')
                                                : 'Не установлен'}
                                        </p>
                                    </div>

                                    <span className={`chip ${statusConfig.chipClass}`}>
                    {statusConfig.label}
                  </span>

                                    <Icons.ChevronRight className="hidden h-5 w-5 t-subtle sm:block"/>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="section-card flex flex-col items-center justify-center py-16 text-center">
                    <div
                        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle"
                        style={{background: 'var(--app-surface-2)'}}
                    >
                        <Icons.Tasks className="h-7 w-7"/>
                    </div>
                    <p className="text-base font-bold t-fg">Задач не найдено</p>
                    <p className="mt-1 text-sm t-subtle">
                        Попробуйте изменить фильтр или создайте новую задачу
                    </p>
                </div>
            )}
        </div>
    )
}
