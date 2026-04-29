import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
}

export default async function PermitsPage() {
    const supabase = await createClient()

    const {data: projects} = await supabase
        .from('projects')
        .select('id, name, permits(id, permit_type, status, expires_at, notes)')
        .order('name', {ascending: true})

    const groupedProjects = (projects ?? []).filter((project) => (project.permits?.length ?? 0) > 0)

    return (
        <div className="animate-in">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Разрешения</h1>
                <p className="mt-1 text-sm t-muted">Разрешения сгруппированы по проектам</p>
            </div>

            {groupedProjects.length ? (
                <div className="space-y-6">
                    {groupedProjects.map((project) => (
                        <section key={project.id} className="section-card">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold t-fg">{project.name}</h2>
                                <Link
                                    href={`/dashboard/projects/${project.id}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold t-accent transition-opacity hover:opacity-75"
                                >
                                    Открыть проект
                                    <Icons.ArrowRight className="h-4 w-4"/>
                                </Link>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {project.permits?.map((permit) => {
                                    const status = permitStatusLabels[permit.status] ?? permitStatusLabels.in_progress
                                    return (
                                        <div key={permit.id} className="glass-card rounded-2xl p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="truncate text-sm font-bold t-fg">{permit.permit_type}</p>
                                                <span className={`chip ${status.chipClass}`}>{status.label}</span>
                                            </div>
                                            {permit.notes && (
                                                <p className="mt-2 line-clamp-2 text-xs t-muted">{permit.notes}</p>
                                            )}
                                            {permit.expires_at && (
                                                <p className="mt-3 text-[11px] t-subtle">
                                                    Действует до {new Date(permit.expires_at).toLocaleDateString('ru-RU')}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="section-card flex flex-col items-center justify-center py-16 text-center">
                    <div
                        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle"
                        style={{background: 'var(--app-surface-2)'}}
                    >
                        <Icons.File className="h-7 w-7"/>
                    </div>
                    <p className="text-base font-bold t-fg">Разрешения не найдены</p>
                    <p className="mt-1 text-sm t-subtle">Добавьте разрешения в карточках проектов</p>
                </div>
            )}
        </div>
    )
}
