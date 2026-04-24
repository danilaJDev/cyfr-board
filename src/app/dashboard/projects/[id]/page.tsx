import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Clock } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string }> = {
    active:      { label: 'Активный',    color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    completed:   { label: 'Завершён',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    on_hold:     { label: 'На паузе',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    cancelled:   { label: 'Отменён',     color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const taskStatusLabels: Record<string, { label: string; color: string }> = {
    open:        { label: 'Открыта',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    in_progress: { label: 'В работе',    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    done:        { label: 'Выполнена',   color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    cancelled:   { label: 'Отменена',    color: 'bg-red-500/10 text-red-400 border-red-500/20' },
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
        <div>
            <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition"
            >
                <ArrowLeft size={16} />
                Назад к проектам
            </Link>

            {/* Заголовок */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white leading-snug">{project.name}</h1>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${status.color}`}>
              {status.label}
            </span>
                        {project.type && (
                            <span className="text-xs px-2.5 py-1 rounded-full border border-gray-700 text-gray-400">
                {project.type}
              </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <Link
                        href={`/dashboard/projects/${id}/edit`}
                        className="shrink-0 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-xl transition"
                    >
                        Редактировать
                    </Link>
                )}
            </div>

            {/* Инфо */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Руководитель проекта', value: project.manager?.full_name ?? '—' },
                    { label: 'Дата договора', value: project.contract_signed_at ? new Date(project.contract_signed_at).toLocaleDateString('ru-RU') : '—' },
                    { label: 'Создан', value: new Date(project.created_at).toLocaleDateString('ru-RU') },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <p className="text-white font-medium text-sm">{value}</p>
                    </div>
                ))}
            </div>

            {/* Разрешения */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        Разрешения
                    </h2>
                    {isAdmin && (
                        <Link
                            href={`/dashboard/projects/${id}/permits/new`}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                        >
                            <Plus size={14} />
                            Добавить
                        </Link>
                    )}
                </div>

                {!project.permits?.length ? (
                    <p className="text-gray-500 text-sm">Разрешений нет</p>
                ) : (
                    <div className="space-y-2">
                        {project.permits.map((permit: any) => (
                            <div key={permit.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-white text-sm font-medium">{permit.permit_type}</p>
                                    {permit.notes && <p className="text-gray-400 text-xs mt-0.5">{permit.notes}</p>}
                                </div>
                                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      permit.status === 'received' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          permit.status === 'expired'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {permit.status === 'received' ? 'Получено' : permit.status === 'expired' ? 'Истекло' : 'В процессе'}
                  </span>
                                    {permit.expires_at && (
                                        <p className="text-gray-500 text-xs mt-1">до {new Date(permit.expires_at).toLocaleDateString('ru-RU')}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Задачи */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        Задачи ({project.tasks?.length ?? 0})
                    </h2>
                    {isAdmin && (
                        <Link
                            href={`/dashboard/projects/${id}/tasks/new`}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                        >
                            <Plus size={14} />
                            Добавить задачу
                        </Link>
                    )}
                </div>

                {!project.tasks?.length ? (
                    <p className="text-gray-500 text-sm">Задач пока нет</p>
                ) : (
                    <div className="space-y-2">
                        {project.tasks.map((task: any) => {
                            const ts = taskStatusLabels[task.status] ?? taskStatusLabels.open
                            const assignees = task.task_assignees?.map((a: any) => a.user?.full_name).filter(Boolean)
                            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

                            return (
                                <Link
                                    key={task.id}
                                    href={`/dashboard/projects/${id}/tasks/${task.id}`}
                                    className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium group-hover:text-blue-400 transition truncate">
                                            {task.title}
                                        </p>
                                        {assignees?.length > 0 && (
                                            <p className="text-gray-400 text-xs mt-0.5 truncate">{assignees.join(', ')}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {task.deadline && (
                                            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                      </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${ts.color}`}>
                      {ts.label}
                    </span>
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