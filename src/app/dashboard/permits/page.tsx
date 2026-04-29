import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import {parsePermitNotes} from '@/lib/permits'
import PermitCardDocs from '@/components/PermitCardDocs'

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
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

    const grouped = (projects ?? []).filter((p) => (p.permits?.length ?? 0) > 0)
    const totalPermits = grouped.reduce((acc, p) => acc + (p.permits?.length ?? 0), 0)

    return (
        <div className="animate-in">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Разрешения</h1>
                    <p className="mt-1 text-sm t-muted">
                        {totalPermits} разрешений по {grouped.length} проектам
                    </p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/permits/new"
                        className="btn-primary self-stretch justify-center py-3 sm:self-auto"
                    >
                        <Icons.Plus className="h-4 w-4"/>
                        Новое разрешение
                    </Link>
                )}
            </div>

            {grouped.length ? (
                <div className="space-y-8">
                    {grouped.map((project) => (
                        <section key={project.id}>
                            {/* Project header */}
                            <div className="mb-3 flex items-center gap-3 px-1">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                    style={{background: 'var(--app-accent-subtle)'}}
                                >
                                    <Icons.Projects className="h-4 w-4 t-accent"/>
                                </div>
                                <Link
                                    href={`/dashboard/projects/${project.id}`}
                                    className="text-base font-bold t-fg transition-opacity hover:opacity-70 sm:text-lg"
                                >
                                    {project.name}
                                </Link>
                                <span
                                    className="rounded-full px-2 py-0.5 text-[15px] font-semibold t-accent"
                                    style={{background: 'var(--app-accent-subtle)'}}
                                >
                                    {project.permits?.length}
                                </span>
                            </div>

                            {/* Permits grid */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {project.permits?.map((permit) => {
                                    const status = permitStatusLabels[permit.status] ?? permitStatusLabels.pending
                                    const meta = parsePermitNotes(permit.notes)
                                    const isExpired = permit.status === 'expired'
                                    const daysLeft = permit.expires_at
                                        ? (new Date(permit.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        : null
                                    const isExpiringSoon =
                                        daysLeft !== null && daysLeft > 0 && daysLeft <= 14 && !isExpired
                                    const docs = meta.documents ?? []

                                    return (
                                        <div
                                            key={permit.id}
                                            className="glass-card flex flex-col overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                            style={{
                                                borderColor: isExpired
                                                    ? 'var(--status-danger-border)'
                                                    : isExpiringSoon
                                                        ? 'var(--status-warning-border)'
                                                        : undefined,
                                            }}
                                        >
                                            <Link
                                                href={`/dashboard/permits/${permit.id}`}
                                                className="flex flex-1 flex-col gap-4 p-4"
                                            >
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-medium uppercase tracking-wide t-subtle">
                                                            Тип разрешения
                                                        </p>

                                                        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug t-fg">
                                                            {permit.permit_type}
                                                        </h3>
                                                    </div>

                                                    <span className={`chip shrink-0 ${status.chipClass}`}>
                {status.label}
            </span>
                                                </div>

                                                {/* Dates block */}
                                                <div
                                                    className="grid grid-cols-2 gap-3 rounded-xl p-3"
                                                    style={{background: 'var(--app-surface-2)'}}
                                                >
                                                    <div>
                                                        <p className="text-[11px] t-subtle">Дата начала</p>
                                                        <p className="mt-1 text-sm font-semibold t-fg">
                                                            {permit.issued_at
                                                                ? new Date(permit.issued_at).toLocaleDateString('ru-RU')
                                                                : 'Не указана'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[11px] t-subtle">Дата окончания</p>
                                                        <p
                                                            className="mt-1 text-sm font-semibold"
                                                            style={{
                                                                color: isExpired
                                                                    ? 'var(--status-danger-text)'
                                                                    : isExpiringSoon
                                                                        ? 'var(--status-warning-text)'
                                                                        : undefined,
                                                            }}
                                                        >
                                                            {permit.expires_at
                                                                ? new Date(permit.expires_at).toLocaleDateString('ru-RU')
                                                                : 'Не указана'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Warning */}
                                                {(isExpired || isExpiringSoon) && (
                                                    <div
                                                        className="rounded-xl px-3 py-2 text-xs font-medium"
                                                        style={{
                                                            color: isExpired
                                                                ? 'var(--status-danger-text)'
                                                                : 'var(--status-warning-text)',
                                                            background: isExpired
                                                                ? 'var(--status-danger-bg)'
                                                                : 'var(--status-warning-bg)',
                                                        }}
                                                    >
                                                        {isExpired
                                                            ? 'Разрешение истекло'
                                                            : `Скоро истекает · осталось ${Math.ceil(daysLeft!)} дн.`}
                                                    </div>
                                                )}

                                                {/* Details */}
                                            </Link>

                                            <div className="border-t" style={{borderColor: 'var(--app-border)'}}>
                                                <PermitCardDocs documents={docs}/>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="section-card flex flex-col items-center justify-center py-16 text-center sm:py-24">
                    <div
                        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full t-subtle"
                        style={{background: 'var(--app-surface-2)'}}
                    >
                        <Icons.File className="h-8 w-8"/>
                    </div>
                    <p className="mb-1 text-base font-bold t-fg sm:text-lg">Разрешений пока нет</p>
                    <p className="text-sm t-subtle">Нажмите «Новое разрешение», чтобы добавить первое</p>
                    {isAdmin && (
                        <Link href="/dashboard/permits/new" className="btn-primary mt-6">
                            <Icons.Plus className="h-4 w-4"/>
                            Новое разрешение
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
