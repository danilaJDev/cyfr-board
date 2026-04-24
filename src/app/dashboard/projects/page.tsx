import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const statusLabels: Record<string, { label: string; color: string }> = {
    active:    { label: 'Активный',   color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    completed: { label: 'Завершён',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    on_hold:   { label: 'На паузе',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    cancelled: { label: 'Отменён',    color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const typeLabels: Record<string, string> = {
    FITOUT:      'Fitout',
    Maintenance: 'Maintenance',
    Other:       'Other',
}

export default async function ProjectsPage() {
    const supabase = await createClient()

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
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Проекты</h1>
                    <p className="text-gray-400 text-sm mt-1">{projects?.length ?? 0} объектов</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/projects/new"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl transition text-sm"
                    >
                        <span>＋</span>
                        Новый проект
                    </Link>
                )}
            </div>

            {!projects?.length ? (
                <div className="text-center py-24 text-gray-500">
                    <p className="text-lg mb-1">Проектов пока нет</p>
                    <p className="text-sm">Создайте первый объект</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map((project) => {
                        const status = statusLabels[project.status] ?? statusLabels.active
                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h2 className="text-white font-semibold text-sm leading-snug group-hover:text-blue-400 transition line-clamp-2">
                                        {project.name}
                                    </h2>
                                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${status.color}`}>
                    {status.label}
                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-400">
                                    {project.type && (
                                        <p>Тип: <span className="text-gray-300">{typeLabels[project.type] ?? project.type}</span></p>
                                    )}
                                    {project.manager?.full_name && (
                                        <p>РП: <span className="text-gray-300">{project.manager.full_name}</span></p>
                                    )}
                                    {project.contract_signed_at && (
                                        <p>Договор: <span className="text-gray-300">
                      {new Date(project.contract_signed_at).toLocaleDateString('ru-RU')}
                    </span></p>
                                    )}
                                    <p>Задач: <span className="text-gray-300">{project.tasks?.[0]?.count ?? 0}</span></p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}