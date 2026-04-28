import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

const statusLabels: Record<string, { label: string; color: string }> = {
    active: {
        label: 'Активный',
        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
    completed: {
        label: 'Завершён',
        color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    },
    on_hold: {
        label: 'На паузе',
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
    cancelled: {
        label: 'Отменён',
        color: 'bg-red-500/10 text-red-300 border-red-500/20',
    },
}

const typeLabels: Record<string, string> = {
    FITOUT: 'Fitout',
    Maintenance: 'Maintenance',
    Other: 'Other',
}

export default async function ProjectsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: projects } = await supabase
        .from('projects')
        .select(
            `
    *,
    manager:profiles!projects_manager_id_fkey(full_name),
    creator:profiles!projects_created_by_fkey(full_name),
    tasks(count)
  `,
        )
        .order('created_at', { ascending: false })

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    return (
        <div className="animate-in">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                        Проекты
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {projects?.length ?? 0} объектов под управлением
                    </p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/projects/new"
                        className="btn-primary self-stretch py-3 text-sm sm:self-auto"
                    >
                        <Icons.Plus className="h-5 w-5" />
                        Новый проект
                    </Link>
                )}
            </div>

            {!projects?.length ? (
                <div className="section-card flex flex-col items-center justify-center py-16 text-center sm:py-24">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-slate-500">
                        <Icons.Projects className="h-8 w-8" />
                    </div>
                    <p className="mb-1 text-base font-bold text-white sm:text-lg">
                        Проектов пока нет
                    </p>
                    <p className="text-sm text-slate-500">
                        Создайте первый объект, чтобы начать работу
                    </p>
                    {isAdmin && (
                        <Link
                            href="/dashboard/projects/new"
                            className="btn-primary mt-6 py-2.5"
                        >
                            <Icons.Plus className="h-4 w-4" />
                            Создать проект
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project, i) => {
                        const status = statusLabels[project.status] ?? statusLabels.active
                        const taskCount = project.tasks?.[0]?.count ?? 0

                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className="group glass-card animate-in relative block overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 active:scale-[0.99] sm:rounded-3xl sm:p-6"
                                style={{ '--index': i } as React.CSSProperties}
                            >
                                <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl transition-colors group-hover:bg-cyan-500/15" />

                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <span className={`chip shrink-0 ${status.color}`}>
                                        {status.label}
                                    </span>
                                    <span className="chip border-white/10 bg-white/5 text-slate-400 transition group-hover:border-cyan-400/30 group-hover:text-cyan-300">
                                        Открыть
                                    </span>
                                </div>

                                <h3 className="mb-5 line-clamp-2 text-lg font-bold leading-tight text-white transition-colors group-hover:text-cyan-300 sm:text-xl">
                                    {project.name}
                                </h3>

                                <div className="space-y-2.5 border-t border-white/5 pt-4 text-sm">
                                    <div className="flex items-center justify-between gap-3 text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <Icons.File className="h-4 w-4" />
                                            Тип
                                        </span>
                                        <span className="truncate font-medium text-white">
                                            {typeLabels[project.type] ?? project.type ?? '—'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <Icons.User className="h-4 w-4" />
                                            Менеджер
                                        </span>
                                        <span className="max-w-[180px] truncate font-medium text-white">
                                            {project.manager?.full_name ?? '—'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <Icons.TaskCheck className="h-4 w-4" />
                                            Задачи
                                        </span>
                                        <span className="font-bold text-cyan-300">{taskCount}</span>
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
