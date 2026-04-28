import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/Icons'
import ProjectTabs from '@/components/ProjectTabs'
import DeleteProjectButton from '@/components/DeleteProjectButton'

const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: 'Активный', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    completed: { label: 'Завершён', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    on_hold: { label: 'На паузе', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    cancelled: { label: 'Отменён', color: 'bg-red-500/10 text-red-300 border-red-500/20' },
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(
            `
            *,
            manager:profiles!projects_manager_id_fkey(full_name),
            creator:profiles!projects_created_by_fkey(full_name),
            tasks(id, title, status, deadline, task_assignees(user:profiles(full_name))),
            permits(*)
        `,
        )
        .eq('id', id)
        .single()

    if (projectError || !project) {
        notFound()
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()
    const { data: profile } = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).single()
        : { data: null }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
    const status = statusLabels[project.status] ?? statusLabels.active

    return (
        <div className="animate-in">
            <Link
                href="/dashboard/projects"
                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
            >
                <Icons.ArrowLeft className="h-4 w-4" />
                Назад к проектам
            </Link>

            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl text-balance">
                        {project.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`chip ${status.color}`}>{status.label}</span>
                        {project.type && (
                            <span className="chip border-white/10 bg-white/5 text-slate-300">
                                {project.type}
                            </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link
                            href={`/dashboard/projects/${id}/edit`}
                            className="btn-secondary py-2.5"
                        >
                            <Icons.Edit className="h-4 w-4" />
                            <span>Изменить</span>
                        </Link>
                    </div>
                )}
            </div>

            <div className="section-card mb-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                    icon={<Icons.User className="h-4 w-4 text-slate-400" />}
                    label="Руководитель"
                    value={project.manager?.full_name}
                />
                <InfoItem
                    icon={<Icons.Calendar className="h-4 w-4 text-slate-400" />}
                    label="Дата договора"
                    value={
                        project.contract_signed_at
                            ? new Date(project.contract_signed_at).toLocaleDateString('ru-RU')
                            : null
                    }
                />
                <InfoItem
                    icon={<Icons.Clock className="h-4 w-4 text-slate-400" />}
                    label="Создан"
                    value={new Date(project.created_at).toLocaleDateString('ru-RU')}
                />
            </div>

            <ProjectTabs project={project} isAdmin={isAdmin} />

            {isAdmin && (
                <div className="mt-10 flex justify-end border-t border-white/10 pt-6">
                    <DeleteProjectButton projectId={id} />
                </div>
            )}
        </div>
    )
}

function InfoItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: string | null | undefined
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>
                <p className="truncate font-medium text-white">{value ?? '—'}</p>
            </div>
        </div>
    )
}
