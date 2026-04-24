import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import { Icons } from '@/components/Icons'

const statusLabels: Record<string, { label: string; color: string }> = {
    active:      { label: 'Активный',    color: 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' },
    completed:   { label: 'Завершён',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' },
    on_hold:     { label: 'На паузе',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' },
    cancelled:   { label: 'Отменён',     color: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' },
}

const taskStatusLabels: Record<string, { label: string; color: string }> = {
    open:        { label: 'Открыта',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    in_progress: { label: 'В работе',    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    done:        { label: 'Выполнена',   color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    cancelled:   { label: 'Отменена',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: project } = await supabase
        .from('projects')
        .select(`
      *,
      manager:profiles(full_name),
      tasks(
        id, title, status, deadline,
        task_assignees(user:profiles(full_name))
      ),
      permits(*)
    `)
        .eq('id', id)
        .single()

    if (!project) notFound()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
    const status = statusLabels[project.status] ?? statusLabels.active

    return (
        <div className="animate-in">
            <Link
                href="/dashboard/projects"
                className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
                <Icons.ChevronLeft className="h-4 w-4" />
                Назад к проектам
            </Link>

            {/* Заголовок */}
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black leading-snug text-white lg:text-4xl">{project.name}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                            {status.label}
                        </span>
                        {project.type && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {project.type}
                            </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2">
                        <Link
                            href={`/dashboard/projects/${id}/edit`}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 active:scale-95"
                        >
                            Изменить
                        </Link>
                        <Link
                            href={`/dashboard/projects/${id}/tasks/new`}
                            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 active:scale-95"
                        >
                            <Icons.Plus className="h-4 w-4" />
                            Задача
                        </Link>
                    </div>
                )}
            </div>

            {/* Инфо */}
            <div className="glass-card mb-8 grid grid-cols-1 gap-5 rounded-3xl p-6 sm:grid-cols-3">
                <div className="flex flex-col">
                    <p className="mb-1 text-xs text-slate-400">Руководитель проекта</p>
                    <p className="font-medium text-white">{project.manager?.full_name ?? '—'}</p>
                </div>
                <div className="flex flex-col">
                    <p className="mb-1 text-xs text-slate-400">Дата договора</p>
                    <p className="font-medium text-white">
                        {project.contract_signed_at ? new Date(project.contract_signed_at).toLocaleDateString('ru-RU') : '—'}
                    </p>
                </div>
                <div className="flex flex-col">
                    <p className="mb-1 text-xs text-slate-400">Создан</p>
                    <p className="font-medium text-white">{new Date(project.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
            </div>

            {isAdmin && (
                <div className="mb-8 flex justify-end">
                    <DeleteProjectButton projectId={id} />
                </div>
            )}

            {/* Разрешения */}
            <div className="mb-10">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                        <Icons.File className="h-5 w-5 text-slate-500" />
                        Разрешения ({project.permits?.length ?? 0})
                    </h2>
                    {isAdmin && (
                        <Link
                            href={`/dashboard/projects/${id}/permits/new`}
                            className="flex items-center gap-1 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            <Icons.Plus className="h-4 w-4" />
                            Добавить
                        </Link>
                    )}
                </div>

                {!project.permits?.length ? (
                    <div className="glass-card rounded-3xl py-16 text-center">
                        <p className="text-slate-500 font-medium">Разрешений пока нет.</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {project.permits.map((permit: any) => (
                            <div key={permit.id} className="glass-card flex items-center justify-between gap-4 rounded-2xl p-4">
                                <div>
                                    <p className="text-sm font-medium text-white">{permit.permit_type}</p>
                                    {permit.notes && <p className="mt-0.5 text-xs text-slate-400">{permit.notes}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                        permit.status === 'received' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            permit.status === 'expired' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                        {permit.status === 'received' ? 'Получено' : permit.status === 'expired' ? 'Истекло' : 'В процессе'}
                                    </span>
                                    {permit.expires_at && (
                                        <p className="mt-1 text-xs text-slate-500">до {new Date(permit.expires_at).toLocaleDateString('ru-RU')}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Задачи */}
            <div>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                        <Icons.Tasks className="h-5 w-5 text-slate-500" />
                        Задачи ({project.tasks?.length ?? 0})
                    </h2>
                    {isAdmin && (
                        <Link
                            href={`/dashboard/projects/${id}/tasks/new`}
                            className="flex items-center gap-1 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            <Icons.Plus className="h-4 w-4" />
                            Добавить задачу
                        </Link>
                    )}
                </div>

                {!project.tasks?.length ? (
                    <div className="glass-card rounded-3xl py-16 text-center">
                        <p className="text-slate-500 font-medium">Задач пока нет.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {project.tasks.map((task: any) => {
                            const ts = taskStatusLabels[task.status] ?? taskStatusLabels.open
                            const assignees = task.task_assignees?.map((a: any) => a.user?.full_name).filter(Boolean)
                            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

                            return (
                                <Link
                                    key={task.id}
                                    href={`/dashboard/projects/${id}/tasks/${task.id}`}
                                    className="group glass-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400`}>
                                            <Icons.TaskCheck className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                                                {task.title}
                                            </p>
                                            {assignees?.length > 0 && (
                                                <p className="mt-0.5 text-xs text-slate-500 truncate">{assignees.join(', ')}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                                        {task.deadline && (
                                            <div className="text-right">
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                                                    Дедлайн
                                                </p>
                                                <p className={`text-xs font-medium ${isOverdue ? 'text-red-400 font-bold' : 'text-white'}`}>
                                                    {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                                </p>
                                            </div>
                                        )}
                                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ts.color}`}>
                                            {ts.label}
                                        </span>
                                        <Icons.ChevronLeft className="hidden h-5 w-5 rotate-180 text-slate-700 transition group-hover:text-cyan-400 sm:block" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}