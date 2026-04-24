import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const taskStatusLabels: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select('id, title, status, deadline, project_id, project:projects(name), task_assignees(user:profiles(full_name))')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: tasks } = await query

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Все задачи</h1>
          <p className="mt-1 text-sm text-slate-400">Контроль задач по всем проектам</p>
        </div>

        <form className="flex gap-2">
          <select
            name="status"
            defaultValue={status ?? 'all'}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="all">Все статусы</option>
            <option value="open">Открыта</option>
            <option value="in_progress">В работе</option>
            <option value="done">Выполнена</option>
            <option value="cancelled">Отменена</option>
          </select>
          <button className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">Фильтр</button>
        </form>
      </div>

      <div className="space-y-2">
        {tasks?.map((task) => {
          const assignees = task.task_assignees?.map((item: any) => item.user?.full_name).filter(Boolean) ?? []
          const projectName = Array.isArray(task.project) ? task.project[0]?.name : (task.project as any)?.name

          return (
            <Link
              key={task.id}
              href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`}
              className="block rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-white/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{projectName ?? 'Без проекта'}</p>
                  {assignees.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">Ответственные: {assignees.join(', ')}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-cyan-300">{taskStatusLabels[task.status] ?? task.status}</p>
                  {task.deadline && (
                    <p className="mt-1 text-xs text-slate-500">
                      Дедлайн: {new Date(task.deadline).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}

        {!tasks?.length && <p className="text-sm text-slate-500">Задач пока нет.</p>}
      </div>
    </div>
  )
}
