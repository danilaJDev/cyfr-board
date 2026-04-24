import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProjectCardActions from '@/components/ProjectCardActions'
import { Icons } from '@/components/Icons'

const statusLabels: Record<string, { label: string; color: string }> = {
    active:    { label: 'Активный',   color: 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' },
    completed: { label: 'Завершён',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' },
    on_hold:   { label: 'На паузе',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' },
    cancelled: { label: 'Отменён',    color: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' },
}

const typeLabels: Record<string, string> = {
    FITOUT:      'Fitout',
    Maintenance: 'Maintenance',
    Other:       'Other',
}

export default async function ProjectsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: projects } = await supabase
        .from('projects')
        .select(`
      *,
      manager:profiles(full_name),
      tasks(count)
    `)
        .order('created_at', { ascending: false })

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    return (
        <div className="animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Проекты</h1>
                    <p className="text-slate-400 text-sm mt-1">{projects?.length ?? 0} объектов под управлением</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/projects/new"
                        className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                    >
                        <Icons.Plus className="h-5 w-5" />
                        Новый проект
                    </Link>
                )}
            </div>

            {!projects?.length ? (
                <div className="glass-card rounded-3xl py-24 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-slate-500 mb-4">
                        <Icons.Projects className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-bold text-white mb-1">Проектов пока нет</p>
                    <p className="text-sm text-slate-500">Создайте первый объект, чтобы начать работу</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const status = statusLabels[project.status] ?? statusLabels.active
                        const taskCount = project.tasks?.[0]?.count ?? 0
                        return (
                            <div
                                key={project.id}
                                className="group glass-card rounded-3xl p-6 relative overflow-hidden"
                            >
                                {/* Background Highlight */}
                                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
                                
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                                        {status.label}
                                    </span>
                                    {isAdmin && <ProjectCardActions projectId={project.id} />}
                                </div>

                                <Link
                                    href={`/dashboard/projects/${project.id}`}
                                    className="block mb-6"
                                >
                                    <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white group-hover:text-cyan-400 transition-colors">
                                        {project.name}
                                    </h3>
                                </Link>

                                <div className="space-y-3 border-t border-white/5 pt-5 text-sm">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <Icons.File className="h-4 w-4" />
                                            Тип
                                        </span>
                                        <span className="text-white font-medium">{typeLabels[project.type] ?? project.type ?? '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <Icons.Team className="h-4 w-4" />
                                            Менеджер
                                        </span>
                                        <span className="text-white font-medium truncate max-w-[120px]">
                                            {project.manager?.full_name ?? '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <Icons.TaskCheck className="h-4 w-4" />
                                            Задачи
                                        </span>
                                        <span className="text-cyan-400 font-bold">{taskCount}</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/dashboard/projects/${project.id}`}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    Детали проекта
                                    <Icons.ChevronLeft className="h-4 w-4 rotate-180" />
                                </Link>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}