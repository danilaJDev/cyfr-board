import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/Icons'

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Админ', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  manager: { label: 'Менеджер', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  user: { label: 'Сотрудник', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
}

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, position, role')
    .order('full_name', { ascending: true })

  return (
    <div className="animate-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Команда</h1>
        <p className="mt-1 text-sm text-slate-400">
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
                className="group glass-card animate-in flex flex-col rounded-2xl p-5 sm:rounded-3xl sm:p-6"
                style={{ '--index': i } as React.CSSProperties}
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-base font-bold uppercase text-white shadow-lg sm:h-14 sm:w-14 sm:text-lg">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white transition-colors group-hover:text-cyan-300">
                      {member.full_name ?? 'Без имени'}
                    </p>
                    <span className={`mt-1 inline-flex chip ${role.color}`}>{role.label}</span>
                  </div>
                </div>

                <dl className="mt-2 flex-1 space-y-2.5 border-t border-white/5 pt-4 text-sm">
                  <ContactRow icon={<Icons.Mail className="h-4 w-4" />} label="Email" value={member.email} isLink={member.email ? `mailto:${member.email}` : null} />
                  <ContactRow icon={<Icons.Phone className="h-4 w-4" />} label="Телефон" value={member.phone} isLink={member.phone ? `tel:${member.phone}` : null} />
                  <ContactRow icon={<Icons.Briefcase className="h-4 w-4" />} label="Должность" value={member.position} />
                </dl>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="section-card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-500">
            <Icons.Team className="h-7 w-7" />
          </div>
          <p className="text-base font-bold text-white">Профили пока не созданы</p>
          <p className="mt-1 text-sm text-slate-500">Добавьте первых участников команды</p>
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
  const content = (
    <span className="max-w-[60%] truncate text-right font-medium text-white">
      {value ?? '—'}
    </span>
  )

  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-slate-400">
        <span className="text-slate-500">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0">
        {isLink && value ? (
          <a
            href={isLink}
            className="block max-w-full truncate text-right font-medium text-white transition hover:text-cyan-300"
          >
            {value}
          </a>
        ) : (
          content
        )}
      </dd>
    </div>
  )
}
