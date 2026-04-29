import {createClient} from '@/lib/supabase/server'
import {Icons} from '@/components/Icons'

const roleLabels: Record<string, { label: string; chipClass: string }> = {
    admin: {label: 'Админ', chipClass: 'status-accent'},
    manager: {label: 'Менеджер', chipClass: 'status-info'},
    user: {label: 'Сотрудник', chipClass: 'status-neutral'},
}

export default async function TeamPage() {
    const supabase = await createClient()

    const {data: members} = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, position, role')
        .order('full_name', {ascending: true})

    return (
        <div className="animate-in">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Команда</h1>
                <p className="mt-1 text-sm t-muted">
                    {members?.length ?? 0} участников · роли и контактная информация
                </p>
            </div>

            {members?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {members.map((member, i) => {
                        const role = roleLabels[member.role ?? 'user'] ?? roleLabels.user
                        const initials =
                            member.full_name
                                ?.split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((p: string) => p[0]?.toUpperCase())
                                .join('') || '?'

                        return (
                            <article
                                key={member.id}
                                className="glass-card animate-in flex flex-col rounded-2xl p-5 sm:p-6"
                                style={{'--index': i} as React.CSSProperties}
                            >
                                <div className="mb-4 flex items-center gap-4">
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold uppercase text-white shadow-md sm:h-14 sm:w-14 sm:text-lg"
                                        style={{background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'}}
                                    >
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-bold t-fg">
                                            {member.full_name ?? 'Без имени'}
                                        </p>
                                        <span className={`mt-1 inline-flex chip ${role.chipClass}`}>
                      {role.label}
                    </span>
                                    </div>
                                </div>

                                <dl
                                    className="mt-2 flex-1 space-y-2.5 border-t pt-4 text-sm"
                                    style={{borderColor: 'var(--app-border)'}}
                                >
                                    <ContactRow
                                        icon={<Icons.Mail className="h-4 w-4"/>}
                                        label="Email"
                                        value={member.email}
                                        isLink={member.email ? `mailto:${member.email}` : null}
                                    />
                                    <ContactRow
                                        icon={<Icons.Phone className="h-4 w-4"/>}
                                        label="Телефон"
                                        value={member.phone}
                                        isLink={member.phone ? `tel:${member.phone}` : null}
                                    />
                                    <ContactRow
                                        icon={<Icons.Briefcase className="h-4 w-4"/>}
                                        label="Должность"
                                        value={member.position}
                                    />
                                </dl>
                            </article>
                        )
                    })}
                </div>
            ) : (
                <div className="section-card flex flex-col items-center justify-center py-16 text-center">
                    <div
                        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle"
                        style={{background: 'var(--app-surface-2)'}}
                    >
                        <Icons.Team className="h-7 w-7"/>
                    </div>
                    <p className="text-base font-bold t-fg">Профили пока не созданы</p>
                    <p className="mt-1 text-sm t-subtle">Добавьте первых участников команды</p>
                </div>
            )}
        </div>
    )
}

function ContactRow({
                        icon,
                        label,
                        value,
                        isLink,
                    }: {
    icon: React.ReactNode
    label: string
    value: string | null | undefined
    isLink?: string | null
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 t-subtle">
                {icon}
                <span className="t-muted">{label}</span>
            </dt>
            <dd className="min-w-0">
                {isLink && value ? (
                    <a
                        href={isLink}
                        className="block max-w-full truncate text-right text-sm font-medium t-fg transition-opacity hover:opacity-70"
                    >
                        {value}
                    </a>
                ) : (
                    <span className="block max-w-[60%] truncate text-right text-sm font-medium t-fg">
            {value ?? '—'}
          </span>
                )}
            </dd>
        </div>
    )
}
