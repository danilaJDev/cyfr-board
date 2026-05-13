import {createClient} from '@/lib/supabase/server'
import {Icons} from '@/components/Icons'
import Link from 'next/link'

const taskStatusLabel: Record<string, string> = {
    in_progress: 'В работе',
    done: 'Выполнена',
    cancelled: 'Отменена',
}

const taskBarColors: Record<string, string> = {
    in_progress: 'var(--app-accent-text)',
    done: 'var(--status-success-text)',
    cancelled: 'var(--app-subtle)',
}

const projectStatusLabels: Record<string, { label: string; chipClass: string }> = {
    active: {label: 'Активный', chipClass: 'status-success'},
    completed: {label: 'Завершён', chipClass: 'status-info'},
    on_hold: {label: 'На паузе', chipClass: 'status-warning'},
    cancelled: {label: 'Отменён', chipClass: 'status-danger'},
}

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
}

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('ru-RU') : 'Без даты'

const getProjectName = (project: unknown) => {
    if (Array.isArray(project)) return (project[0] as { name?: string } | undefined)?.name ?? 'Без проекта'
    return (project as { name?: string } | null)?.name ?? 'Без проекта'
}

export default async function DashboardPage() {
    const supabase = await createClient()

    const [
        {count: projectsCount},
        {count: activeProjectsCount},
        {count: tasksCount},
        {count: doneTasksCount},
        {data: taskStatusData},
        {data: projects},
        {count: permitsCount},
        {data: urgentTasks},
        {data: permitAlertsRaw},
    ] = await Promise.all([
        supabase.from('projects').select('*', {count: 'exact', head: true}),
        supabase.from('projects').select('*', {count: 'exact', head: true}).eq('status', 'active'),
        supabase.from('tasks').select('*', {count: 'exact', head: true}),
        supabase.from('tasks').select('*', {count: 'exact', head: true}).eq('status', 'done'),
        supabase.from('tasks').select('status').order('created_at', {ascending: false}),
        supabase.from('projects').select('id, name, status, created_at').order('created_at', {ascending: false}).limit(6),
        supabase.from('permits').select('*', {count: 'exact', head: true}),
        supabase
            .from('tasks')
            .select('id, title, status, deadline, project_id, project:projects(name)')
            .not('deadline', 'is', null)
            .neq('status', 'done')
            .neq('status', 'cancelled')
            .order('deadline', {ascending: true})
            .limit(6),
        supabase
            .from('permits')
            .select('id, permit_type, status, expires_at, project:projects(id, name)')
            .not('expires_at', 'is', null)
            .order('expires_at', {ascending: true})
            .limit(8),
    ])

    const today = new Date()
    const soonBoundary = new Date(today)
    soonBoundary.setDate(today.getDate() + 30)
    const total = tasksCount ?? 0
    const completionPercent = total > 0 ? Math.round(((doneTasksCount ?? 0) / total) * 100) : 0
    const overdueTasksCount = urgentTasks?.filter((task) => task.deadline && new Date(task.deadline) < today).length ?? 0
    const permitAlerts = (permitAlertsRaw ?? [])
        .filter((permit) => {
            if (!permit.expires_at) return false
            const expiresAt = new Date(permit.expires_at)
            return permit.status === 'expired' || expiresAt <= soonBoundary
        })
        .slice(0, 6)

    const statusBuckets = Object.keys(taskStatusLabel).map((key) => ({
        key,
        label: taskStatusLabel[key],
        count: taskStatusData?.filter((t) => t.status === key).length ?? 0,
    }))

    return (
        <div className="space-y-8 sm:space-y-10 animate-in">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight t-fg sm:text-4xl text-balance">Дашборд</h1>
                    <p className="mt-1 text-sm t-muted">Операционная сводка по проектам, задачам и разрешениям</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard/projects" className="btn-secondary px-4 py-2 text-sm">
                        <Icons.Projects className="h-4 w-4"/>
                        Проекты
                    </Link>
                    <Link href="/dashboard/tasks" className="btn-primary px-4 py-2 text-sm">
                        <Icons.Tasks className="h-4 w-4"/>
                        Задачи
                    </Link>
                </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                <StatCard title="Проекты" value={projectsCount ?? 0} icon={<Icons.Projects className="h-5 w-5"/>} accentClass="status-accent" trend={`${activeProjectsCount ?? 0} активных`} href="/dashboard/projects"/>
                <StatCard title="Задачи" value={total} icon={<Icons.Tasks className="h-5 w-5"/>} accentClass="status-info" trend={`${completionPercent}% выполнено`} href="/dashboard/tasks"/>
                <StatCard title="Разрешения" value={permitsCount ?? 0} icon={<Icons.File className="h-5 w-5"/>} accentClass="status-warning" trend="По всем проектам" href="/dashboard/permits"/>
            </div>

            <section className="section-card">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold t-fg sm:text-lg">Требует внимания</h2>
                        <p className="text-sm t-muted">{overdueTasksCount} просроченных задач · {permitAlerts.length} разрешений в риске</p>
                    </div>
                    <Link href="/dashboard/permits" className="inline-flex items-center gap-1 self-start font-semibold t-accent transition-opacity hover:opacity-75">
                        Разрешения<Icons.ArrowRight className="h-5 w-5"/>
                    </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border p-4" style={{borderColor: 'var(--app-border)', background: 'var(--app-surface-2)'}}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold t-fg">Ближайшие задачи</h3>
                            <span className="chip status-info">{urgentTasks?.length ?? 0}</span>
                        </div>
                        {urgentTasks?.length ? (
                            <div className="space-y-2">
                                {urgentTasks.map((task) => {
                                    const overdue = task.deadline ? new Date(task.deadline) < today : false
                                    return (
                                        <Link key={task.id} href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`}
                                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition hover:bg-surface"
                                            style={{borderColor: 'var(--app-border)'}}>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold t-fg">{task.title}</p>
                                                <p className="truncate text-xs t-muted">{getProjectName(task.project)}</p>
                                            </div>
                                            <span className={`chip shrink-0 ${overdue ? 'status-danger' : 'status-warning'}`}>
                                                {formatDate(task.deadline)}
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <CompactEmpty icon={<Icons.Check className="h-5 w-5"/>} title="Критичных задач нет"/>
                        )}
                    </div>

                    <div className="rounded-lg border p-4" style={{borderColor: 'var(--app-border)', background: 'var(--app-surface-2)'}}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold t-fg">Сроки разрешений</h3>
                            <span className="chip status-warning">{permitAlerts.length}</span>
                        </div>
                        {permitAlerts.length ? (
                            <div className="space-y-2">
                                {permitAlerts.map((permit) => {
                                    const status = permitStatusLabels[permit.status] ?? permitStatusLabels.pending
                                    return (
                                        <Link key={permit.id} href={`/dashboard/permits/${permit.id}`}
                                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition hover:bg-surface"
                                            style={{borderColor: 'var(--app-border)'}}>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold t-fg">{permit.permit_type}</p>
                                                <p className="truncate text-xs t-muted">{getProjectName(permit.project)}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className={`chip ${status.chipClass}`}>{status.label}</span>
                                                <span className="hidden text-xs font-semibold t-muted sm:inline">{formatDate(permit.expires_at)}</span>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <CompactEmpty icon={<Icons.File className="h-5 w-5"/>} title="Сроки под контролем"/>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
                <section className="section-card lg:col-span-1">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-base font-bold t-fg sm:text-lg">Статистика задач</h2>
                        <Link href="/dashboard/tasks" className="inline-flex items-center gap-1 font-semibold t-accent transition-opacity hover:opacity-75">
                            Все<Icons.ArrowRight className="h-5 w-5"/>
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {statusBuckets.map((status) => {
                            const max = Math.max(total, 1)
                            const percent = Math.min((status.count / max) * 100, 100)
                            const barColor = taskBarColors[status.key] ?? 'var(--app-accent-text)'
                            return (
                                <div key={status.key}>
                                    <div className="mb-2 flex items-center justify-between text-balance">
                                        <span className="font-medium t-muted">{status.label}</span>
                                        <span className="font-bold t-fg">{status.count}</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full" style={{background: 'var(--app-surface-2)'}}>
                                        <div className="h-full rounded-full transition-all duration-700" style={{width: `${percent}%`, background: barColor}}/>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                <section className="section-card lg:col-span-2">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 className="text-base font-bold t-fg sm:text-lg">Последние проекты</h2>
                        <Link href="/dashboard/projects" className="inline-flex items-center gap-1 font-semibold t-accent transition-opacity hover:opacity-75">
                            Все<Icons.ArrowRight className="h-5 w-5"/>
                        </Link>
                    </div>
                    {projects?.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {projects.map((project) => {
                                const status = projectStatusLabels[project.status] ?? projectStatusLabels.active
                                return (
                                    <Link key={project.id} href={`/dashboard/projects/${project.id}`}
                                        className="group glass-card flex flex-col justify-between rounded-lg p-4 transition hover:-translate-y-0.5">
                                        <p className="line-clamp-2 text-sm font-bold t-fg sm:text-base">{project.name}</p>
                                        <div className="mt-3 flex items-end justify-between gap-2">
                                            <span className={`chip ${status.chipClass}`}>{status.label}</span>
                                            <p className="text-[11px] text-right t-muted">{new Date(project.created_at).toLocaleDateString('ru-RU')}</p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <EmptyState title="Проектов ещё нет" description="Создайте первый объект, чтобы начать работу" icon={<Icons.Projects className="h-7 w-7"/>}/>
                    )}
                </section>
            </div>
        </div>
    )
}

function StatCard({title, value, icon, accentClass, trend, href}: {title: string; value: number; icon: React.ReactNode; accentClass: string; trend: string; href: string}) {
    return (
        <Link href={href} className="block">
            <article className="section-card transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                    <div className={`chip ${accentClass} px-3 py-2 text-[13px]`}>{icon}</div>
                    <span className="text-right text-xs font-semibold uppercase tracking-wide t-muted">{trend}</span>
                </div>
                <div className="mt-5">
                    <p className="text-sm font-semibold t-muted">{title}</p>
                    <p className="mt-0.5 text-4xl font-black tracking-tight t-fg sm:text-4xl">{value}</p>
                </div>
            </article>
        </Link>
    )
}

function EmptyState({title, description, icon}: {title: string; description: string; icon: React.ReactNode}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center"
            style={{borderColor: 'var(--app-border)', background: 'var(--app-surface-2)'}}>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle" style={{background: 'var(--app-surface)'}}>
                {icon}
            </div>
            <p className="text-sm font-bold t-fg">{title}</p>
            <p className="mt-1 text-xs t-subtle">{description}</p>
        </div>
    )
}

function CompactEmpty({title, icon}: {title: string; icon: React.ReactNode}) {
    return (
        <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-semibold t-muted"
            style={{borderColor: 'var(--app-border)', background: 'var(--app-surface)'}}>
            {icon}
            {title}
        </div>
    )
}
