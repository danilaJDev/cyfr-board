import {createClient} from '@/lib/supabase/server'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import {parsePermitNotes} from '@/lib/permits'

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
}

export default async function PermitPage({params}: { params: Promise<{ permitId: string }> }) {
    const {permitId} = await params
    const supabase = await createClient()

    const {data: {user}} = await supabase.auth.getUser()
    const {data: profile} = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).single()
        : {data: null}
    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    const {data: permit} = await supabase
        .from('permits')
        .select('*, project:projects(id, name)')
        .eq('id', permitId)
        .single()

    if (!permit) notFound()

    const meta = parsePermitNotes(permit.notes)
    const status = permitStatusLabels[permit.status] ?? permitStatusLabels.pending
    const isExpired = permit.status === 'expired'
    const daysLeft = permit.expires_at
        ? (new Date(permit.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        : null
    const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 14 && !isExpired

    return (
        <div className="animate-in">
            <Link
                href="/dashboard/permits"
                className="mb-5 inline-flex items-center gap-2 text-sm t-muted transition-opacity hover:opacity-75 hover:t-accent"
            >
                <Icons.ArrowLeft className="h-4 w-4"/>
                Назад к разрешениям
            </Link>

            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-black leading-tight t-fg sm:text-3xl lg:text-4xl text-balance">
                        {permit.permit_type}
                    </h1>
                    {permit.project && (
                        <Link
                            href={`/dashboard/projects/${permit.project.id}`}
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium t-muted transition-opacity hover:opacity-75 hover:t-accent"
                        >
                            <Icons.Projects className="h-4 w-4"/>
                            {permit.project.name}
                        </Link>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`chip ${status.chipClass}`}>{status.label}</span>
                        {isExpiringSoon && (
                            <span className="chip status-warning">
                                <Icons.AlertTriangle className="h-3 w-3"/>
                                {`Истекает через ${Math.ceil(daysLeft!)} дн.`}
                            </span>
                        )}
                        {isExpired && (
                            <span className="chip status-danger">
                                <Icons.AlertTriangle className="h-3 w-3"/>
                                Истекло
                            </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <Link
                        href={`/dashboard/permits/${permit.id}/edit`}
                        className="btn-secondary shrink-0 self-start"
                    >
                        <Icons.Edit className="h-4 w-4"/>
                        Изменить
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-5 lg:col-span-2">
                    {meta.notes && (
                        <div className="section-card">
                            <h2 className="mb-3 text-base font-bold t-fg">Примечания</h2>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed t-muted">
                                {meta.notes}
                            </p>
                        </div>
                    )}

                    {meta.documents && meta.documents.length > 0 && (
                        <div className="section-card">
                            <div className="mb-4 flex items-center gap-2">
                                <Icons.Paperclip className="h-5 w-5 t-subtle"/>
                                <h2 className="text-base font-bold t-fg">
                                    Документы
                                    <span className="ml-1 t-subtle">({meta.documents.length})</span>
                                </h2>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {meta.documents.map((doc) => (
                                    <a
                                        key={doc.url}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group glass-card flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:-translate-y-0.5"
                                    >
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg t-subtle"
                                            style={{background: 'var(--app-surface-2)'}}
                                        >
                                            <Icons.File className="h-4 w-4"/>
                                        </div>
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium t-fg">
                                            {doc.name}
                                        </span>
                                        <Icons.Eye className="h-4 w-4 t-subtle opacity-50 transition-opacity group-hover:opacity-100"/>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-5 lg:col-span-1">
                    <div className="section-card">
                        <h3 className="mb-4 text-base font-bold t-fg">Детали</h3>
                        <div className="space-y-3.5">
                            <InfoRow
                                icon={<Icons.Calendar className="h-4 w-4"/>}
                                label="Дата выдачи"
                                value={
                                    permit.issued_at
                                        ? new Date(permit.issued_at).toLocaleDateString('ru-RU')
                                        : null
                                }
                            />
                            <InfoRow
                                icon={<Icons.Clock className="h-4 w-4"/>}
                                label="Дата окончания"
                                value={
                                    permit.expires_at
                                        ? new Date(permit.expires_at).toLocaleDateString('ru-RU')
                                        : null
                                }
                                danger={isExpired}
                                warning={isExpiringSoon}
                            />
                            {typeof meta.employeeCount === 'number' && (
                                <InfoRow
                                    icon={<Icons.Team className="h-4 w-4"/>}
                                    label="Сотрудников"
                                    value={String(meta.employeeCount)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoRow({
    icon,
    label,
    value,
    danger,
    warning,
}: {
    icon: React.ReactNode
    label: string
    value: string | null | undefined
    danger?: boolean
    warning?: boolean
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg t-muted"
                style={{background: 'var(--app-surface-2)'}}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide t-subtle">{label}</p>
                <p
                    className="truncate font-medium"
                    style={{
                        color: danger
                            ? 'var(--status-danger-text)'
                            : warning
                                ? 'var(--status-warning-text)'
                                : 'var(--app-fg)',
                    }}
                >
                    {value ?? '—'}
                </p>
            </div>
        </div>
    )
}
