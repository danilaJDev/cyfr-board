import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/Icons'

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, position, role')
    .order('full_name', { ascending: true })

  return (
    <div className="animate-in">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight">Команда</h1>
        <p className="mt-1 text-sm text-slate-400">Управление сотрудниками, ролями и контактной информацией</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members?.map((member) => (
          <article key={member.id} className="glass-card group flex flex-col rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white shadow-lg">
                {member.full_name?.[0] ?? '?'}
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{member.full_name ?? 'Без имени'}</p>
                <p className="mt-0.5 text-xs capitalize text-slate-400">{member.role}</p>
              </div>
            </div>
            <dl className="flex-1 space-y-2 border-t border-white/5 pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-400"><Icons.Paperclip className="h-4 w-4" /> Email</dt>
                <dd className="text-white font-medium">{member.email ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-400"><Icons.Paperclip className="h-4 w-4" /> Телефон</dt>
                <dd className="text-white font-medium">{member.phone ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-400"><Icons.Paperclip className="h-4 w-4" /> Должность</dt>
                <dd className="text-white font-medium">{member.position ?? '—'}</dd>
              </div>
            </dl>
          </article>
        ))}

        {!members?.length && (
            <div className="glass-card rounded-3xl py-20 text-center col-span-full">
                <p className="text-slate-500 font-medium">Профили пока не созданы.</p>
            </div>
        )}
      </div>
    </div>
  )
}
