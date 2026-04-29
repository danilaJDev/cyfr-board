import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

const statusLabels: Record<string, { label: string; chipClass: string }> = {
    active: {label: 'Активный', chipClass: 'status-success'},
    completed: {label: 'Завершён', chipClass: 'status-info'},
    on_hold: {label: 'На паузе', chipClass: 'status-warning'},
    cancelled: {label: 'Отменён', chipClass: 'status-danger'},
}

const typeLabels: Record<string, string> = {
    FITOUT: 'Fitout',
    Maintenance: 'Maintenance',
    Other: 'Other',
}

export default async function ProjectsPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    const {data: projects} = await supabase
        .from('projects')
        .select(`
      *,
      manager:profiles!projects_manager_id_fkey(full_name),
      project_assignees(user:profiles(full_name)),
      creator:profiles!projects_created_by_fkey(full_name),
      tasks(count)
    `)
        .order('created_at', {ascending: false})

    const {data: profile} = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Проекты</h1>
                    <p className="mt-1 text-sm t-muted">
                        Всего проектов: {projects?.length ?? 0}
                    </p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/projects/new"
                        className="btn-primary self-stretch justify-center py-3 sm:self-auto"
                    >
                        <Icons.Plus className="h-4 w-4"/>
                        Новый проект
                    </Link>
                )}
            </div>

            {!projects?.length ? (
                <div className="section-card flex flex-col items-center justify-center py-16 text-center sm:py-24">
                    <div
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full t-subtle"
                        style={{background: 'var(--app-surface-2)'}}
                    >
                        <Icons.Projects className="h-8 w-8"/>
                    </div>
                    <p className="mb-1 text-base font-bold t-fg sm:text-lg">Проектов пока нет</p>
                    <p className="text-sm t-subtle">Создайте первый объект, чтобы начать работу</p>
                    {isAdmin && (
                        <Link href="/dashboard/projects/new" className="btn-primary mt-6">
                            <Icons.Plus className="h-4 w-4"/>
                            Создать проект
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project, i) => {
                        const status = statusLabels[project.status] ?? statusLabels.active
                        const taskCount = project.tasks?.[0]?.count ?? 0
                        const assignees = project.project_assignees
                            ?.map((a: { user?: { full_name?: string } | null }) => a.user?.full_name)
                            .filter(Boolean) ?? []
                        const previewAssignees = assignees.slice(0, 2)
                        const moreAssigneesCount = Math.max(assignees.length - previewAssignees.length, 0)

                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className="group glass-card animate-in relative block overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99] sm:p-6"
                                style={{
                                    '--index': i,
                                    borderColor: 'color-mix(in oklab, var(--app-border) 75%, var(--app-accent) 25%)',
                                } as React.CSSProperties}
                            >
                                {/* Decorative glow */}
                                <div
                                    className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl opacity-40 transition-opacity group-hover:opacity-80"
                                    style={{background: 'var(--app-accent-subtle)'}}
                                />

                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <span className={`chip shrink-0 ${status.chipClass}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <h3 className="mb-5 line-clamp-2 text-lg font-bold leading-tight t-fg transition-colors group-hover:t-accent sm:text-[1.35rem]">
                                    {project.name}
                                </h3>

                                <div className="space-y-3 border-t pt-4 text-sm"
                                     style={{borderColor: 'var(--app-border)'}}>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 t-muted">
                                            <Icons.File className="h-4 w-4"/>
                                            Тип
                                        </span>

                                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide t-fg"
                                              style={{background: 'var(--app-surface-2)'}}>
                                            {typeLabels[project.type] ?? project.type ?? '—'}
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-3">
                                        <span className="mt-1 flex items-center gap-2 t-muted">
                                            <Icons.User className="h-4 w-4"/>
                                            Ответственные
                                        </span>

                                        {previewAssignees.length ? (
                                            <div className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
                                                {previewAssignees.map((name: string) => (
                                                    <span
                                                        key={name}
                                                        className="rounded-full px-2.5 py-1 text-xs font-medium t-fg"
                                                        style={{background: 'var(--app-surface-2)'}}
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                                {moreAssigneesCount > 0 && (
                                                    <span
                                                        className="rounded-full px-2.5 py-1 text-xs font-semibold t-accent"
                                                        style={{background: 'var(--app-accent-subtle)'}}
                                                    >
                                                        +{moreAssigneesCount}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="font-medium t-fg">{project.manager?.full_name ?? '—'}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 t-muted">
                                            <Icons.TaskCheck className="h-4 w-4"/>
                                            Задачи
                                        </span>

                                        <span className="rounded-full px-2.5 py-1 text-sm font-bold t-accent"
                                              style={{background: 'var(--app-accent-subtle)'}}>
                                            {taskCount}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
