import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

const taskStatusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Открыта', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  in_progress: { label: 'В работе', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  done: { label: 'Выполнена', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  cancelled: { label: 'Отменена', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
}

type AssigneeItem = { user?: { full_name?: string } | null }
type FilterItem = { value: string; label: string }

const filters: FilterItem[] = [
  { value: 'all', label: 'Все' },
  { value: 'open', label: 'Открытые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Выполненные' },
  { value: 'cancelled', label: 'Отменённые' },
]

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const currentStatus = status ?? 'all'
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(
      'id, title, status, deadline, project_id, project:projects(name), task_assignees(user:profiles(full_name))',
    )
    .order('created_at', { ascending: false })

  if (currentStatus && currentStatus !== 'all') {
    query = query.eq('status', currentStatus)
  }

  const { data: tasks } = await query

  return (
    <div className="animate-in">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Все задачи</h1>
          <p className="mt-1 text-sm text-slate-400">
            Полный контроль и мониторинг по всем объектам
          </p>
        </div>
      </div>

      {/* Filter chips - responsive scrollable on mobile */}
      <div className="mb-6 -mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-2">
          {filters.map((f) => {
            const active = f.value === currentStatus
            const href =
              f.value === 'all'
                ? '/dashboard/tasks'
                : `/dashboard/tasks?status=${f.value}`
            return (
              <Link
                key={f.value}
                href={href}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  active
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {tasks?.length ? (
        <div className="grid gap-3">
          {tasks.map((task) => {
            const rawAssignees: AssigneeItem[] = (task.task_assignees ?? []) as never
            const assignees: string[] = rawAssignees
                .map((item) => item?.user?.full_name ?? '')
                .filter((name): name is string => name.length > 0)
            const projectName = Array.isArray(task.project)
              ? task.project[0]?.name
              : (task.project as { name?: string } | null)?.name
            const statusConfig = taskStatusLabels[task.status] ?? taskStatusLabels.open
            const isOverdue =
              task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

            return (
              <Link
                key={task.id}
                href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`}
                className="group glass-card flex flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-300 sm:h-12 sm:w-12">
                    <Icons.TaskCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white transition-colors group-hover:text-cyan-300">
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-cyan-400/80">
                        {projectName ?? 'Без проекта'}
                      </span>
                      {assignees.length > 0 && (
                        <>
                          <span aria-hidden>•</span>
                          <span className="truncate">{assignees.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 sm:flex-row sm:gap-4 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isOverdue ? 'text-red-400' : 'text-slate-500'
                      }`}
                    >
                      Дедлайн
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isOverdue ? 'font-bold text-red-400' : 'text-white'
                      }`}
                    >
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString('ru-RU')
                        : 'Не установлен'}
                    </p>
                  </div>

                  <span className={`chip ${statusConfig.color}`}>{statusConfig.label}</span>

                  <Icons.ChevronRight className="hidden h-5 w-5 text-slate-700 transition group-hover:text-cyan-400 sm:block" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="section-card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-500">
            <Icons.Tasks className="h-7 w-7" />
          </div>
          <p className="text-base font-bold text-white">Задач не найдено</p>
          <p className="mt-1 text-sm text-slate-500">
            Попробуйте изменить фильтр или создайте новую задачу
          </p>
        </div>
      )}
    </div>
  )
}
