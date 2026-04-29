import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import TasksBoard from '@/components/TasksBoard'
import MobileTaskFilter from '@/components/MobileTaskFilter'

type AssigneeItem = { user?: { full_name?: string } | null }

const filters = [
    {value: 'all', label: 'Все'},
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
    const normalizedTasks = (tasks ?? [])
        .filter((task) => task.status !== 'open')
        .map((task) => {
            const rawAssignees: AssigneeItem[] = (task.task_assignees ?? []) as never
            const assignees = rawAssignees
                .map((item) => item?.user?.full_name ?? '')
                .filter((name): name is string => name.length > 0)
            const projectName = Array.isArray(task.project)
                ? task.project[0]?.name
                : (task.project as { name?: string } | null)?.name

            return {
                id: task.id,
                title: task.title,
                status: task.status,
                deadline: task.deadline,
                project_id: task.project_id,
                project_name: projectName ?? 'Без проекта',
                assignees,
            }
        })

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
            <div className="mb-6">
                <MobileTaskFilter filters={filters} currentStatus={currentStatus}/>
                <nav className="hidden min-w-max gap-2 sm:flex">
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

            {normalizedTasks.length ? (
                <TasksBoard tasks={normalizedTasks}/>
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
