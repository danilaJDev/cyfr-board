import { createClient } from '@/lib/supabase/server'

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, position, role')
    .order('full_name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Команда</h1>
      <p className="mt-1 text-sm text-slate-400">Сотрудники, роли, контакты</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members?.map((member) => (
          <article key={member.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-semibold text-white">{member.full_name ?? 'Без имени'}</p>
            <p className="mt-1 text-xs capitalize text-cyan-300">{member.role}</p>
            <dl className="mt-3 space-y-1 text-xs text-slate-400">
              <div>
                <dt className="inline text-slate-500">Email: </dt>
                <dd className="inline">{member.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Телефон: </dt>
                <dd className="inline">{member.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Должность: </dt>
                <dd className="inline">{member.position ?? '—'}</dd>
              </div>
            </dl>
          </article>
        ))}

        {!members?.length && <p className="text-sm text-slate-500">Профили пока не созданы.</p>}
      </div>
    </div>
  )
}
