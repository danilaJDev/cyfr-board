import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

const taskStatusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Открыта', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'В работе', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  done: { label: 'Выполнена', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  cancelled: { label: 'Отменена', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('id, title, status, deadline, project_id, project:projects(name), task_assignees(user:profiles(full_name))')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: tasks } = await query

  return (
    <div className="animate-in">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Все задачи</h1>
          <p className="mt-1 text-sm text-slate-400">Полный контроль и мониторинг по всем объектам</p>
        </div>

        <form className="flex items-center gap-2">
          <div className="relative">
            <select
              name="status"
              defaultValue={status ?? 'all'}
              className="appearance-none rounded-2xl border border-white/10 bg-slate-900/50 pl-4 pr-10 py-2.5 text-sm font-medium text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Все статусы</option>
              <option value="open">Открыта</option>
              <option value="in_progress">В работе</option>
              <option value="done">Выполнена</option>
              <option value="cancelled">Отменена</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icons.ChevronLeft className="h-4 w-4 -rotate-90" />
            </div>
          </div>
          <button className="rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95">
            Применить
          </button>
        </form>
      </div>

      <div className="grid gap-3">
        {tasks?.map((task) => {
          const assignees = task.task_assignees?.map((item: any) => item.user?.full_name).filter(Boolean) ?? []
          const projectName = Array.isArray(task.project) ? task.project[0]?.name : (task.project as any)?.name
          const statusConfig = taskStatusLabels[task.status] ?? taskStatusLabels.open
          const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

          return (
            <Link
              key={task.id}
              href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`}
              className="group glass-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400`}>
                    <Icons.TaskCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-cyan-500/80">{projectName ?? 'Без проекта'}</span>
                    <span>•</span>
                    <span>{assignees.length > 0 ? assignees.join(', ') : 'Нет ответственных'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                <div className="text-right sm:block">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                    Дедлайн
                  </p>
                  <p className={`text-xs font-medium ${isOverdue ? 'text-red-400 font-bold' : 'text-white'}`}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : 'Не установлен'}
                  </p>
                </div>
                
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                
                <Icons.ChevronLeft className="hidden h-5 w-5 rotate-180 text-slate-700 group-hover:text-cyan-400 transition sm:block" />
              </div>
            </Link>
          )
        })}

        {!tasks?.length && (
            <div className="glass-card rounded-3xl py-20 text-center">
                <p className="text-slate-500 font-medium">Задач по вашему запросу не найдено.</p>
            </div>
        )}
      </div>
    </div>
  )
}

