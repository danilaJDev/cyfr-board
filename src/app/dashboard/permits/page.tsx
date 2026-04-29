import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

type PermitDocument = { name: string; url: string }

type PermitMeta = {
    notes?: string
    employeeCount?: number | null
    documents?: PermitDocument[]
}

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
}

function parsePermitNotes(rawNotes: string | null): PermitMeta {
    if (!rawNotes) return {}
    if (!rawNotes.startsWith('__PERMIT_META__')) return {notes: rawNotes}

    try {
        const parsed = JSON.parse(rawNotes.replace('__PERMIT_META__', '')) as PermitMeta
        return {
            notes: parsed.notes,
            employeeCount: parsed.employeeCount ?? null,
            documents: parsed.documents ?? [],
        }
    } catch {
        return {notes: rawNotes}
    }
}

export default async function PermitsPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    const {data: profile} = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).single()
        : {data: null}

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    const {data: projects} = await supabase
        .from('projects')
        .select('id, name, permits(id, permit_type, status, issued_at, expires_at, notes)')
        .order('name', {ascending: true})

    const groupedProjects = (projects ?? []).filter((project) => (project.permits?.length ?? 0) > 0)

    return (
        <div className="animate-in">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Разрешения</h1>
                    <p className="mt-1 text-sm t-muted">Современная карточка по каждому разрешению и документам</p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/projects" className="btn-primary self-stretch justify-center py-3 sm:self-auto">
                        <Icons.Plus className="h-4 w-4"/>
                        Новое разрешение
                    </Link>
                )}
            </div>

            {groupedProjects.length ? (
                <div className="space-y-6">
                    {groupedProjects.map((project) => (
                        <section key={project.id} className="section-card">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold t-fg">{project.name}</h2>
                                <Link
                                    href={`/dashboard/projects/${project.id}/permits/new`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold t-accent transition-opacity hover:opacity-75"
                                >
                                    Добавить
                                    <Icons.Plus className="h-4 w-4"/>
                                </Link>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {project.permits?.map((permit) => {
                                    const status = permitStatusLabels[permit.status] ?? permitStatusLabels.in_progress
                                    const permitMeta = parsePermitNotes(permit.notes)
                                    return (
                                        <Link key={permit.id} href={`/dashboard/projects/${project.id}`} className="glass-card rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-bold t-fg">{permit.permit_type}</p>
                                                <span className={`chip ${status.chipClass}`}>{status.label}</span>
                                            </div>

                                            <div className="mt-3 grid gap-1 text-[11px] t-subtle">
                                                {permit.issued_at && <p>Начало: {new Date(permit.issued_at).toLocaleDateString('ru-RU')}</p>}
                                                {permit.expires_at && <p>Окончание: {new Date(permit.expires_at).toLocaleDateString('ru-RU')}</p>}
                                                {typeof permitMeta.employeeCount === 'number' && (
                                                    <p>Количество сотрудников: <span className="font-semibold t-fg">{permitMeta.employeeCount}</span></p>
                                                )}
                                            </div>

                                            {permitMeta.notes && (
                                                <p className="mt-3 line-clamp-2 text-xs t-muted">{permitMeta.notes}</p>
                                            )}

                                            {!!permitMeta.documents?.length && (
                                                <div className="mt-3 space-y-1 border-t pt-3" style={{borderColor: 'var(--app-border)'}}>
                                                    {permitMeta.documents.map((doc) => (
                                                        <a
                                                            key={`${permit.id}-${doc.url}`}
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(event) => event.stopPropagation()}
                                                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs t-accent transition hover:bg-black/5"
                                                        >
                                                            <span className="truncate">{doc.name}</span>
                                                            <Icons.Eye className="h-4 w-4 shrink-0"/>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </Link>
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
