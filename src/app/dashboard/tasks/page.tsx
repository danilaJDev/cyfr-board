import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

const taskStatusLabels: Record<string, { label: string; tone: string }> = {
  open: { label: 'Открыта', tone: 'status-info' },
  in_progress: { label: 'В работе', tone: 'status-warning' },
  done: { label: 'Выполнена', tone: 'status-success' },
  cancelled: { label: 'Отменена', tone: 'status-danger' },
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

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const currentStatus = status ?? 'all'
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('id, title, status, deadline, project_id, project:projects(name), task_assignees(user:profiles(full_name))')
    .order('created_at', { ascending: false })

  if (currentStatus && currentStatus !== 'all') {
    query = query.eq('status', currentStatus)
  }

  const { data: tasks } = await query

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Все задачи</h1>
        <p className="mt-1 text-sm text-muted">Контроль сроков, статусов и ответственных по каждому проекту.</p>
      </div>

      <div className="mb-6 -mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-2">
          {filters.map((f) => {
            const active = f.value === currentStatus
            const href = f.value === 'all' ? '/dashboard/tasks' : `/dashboard/tasks?status=${f.value}`
            return (
              <Link
                key={f.value}
                href={href}
                className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                style={{
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  borderColor: active ? 'var(--primary)' : 'var(--border)',
                }}
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
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

            return (
              <Link key={task.id} href={`/dashboard/projects/${task.project_id}/tasks/${task.id}`} className="section-card flex flex-col gap-3 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  <div className="surface-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted sm:h-12 sm:w-12">
                    <Icons.TaskCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span style={{ color: 'var(--primary)' }}>{projectName ?? 'Без проекта'}</span>
                      {assignees.length > 0 && <><span aria-hidden>•</span><span className="truncate">{assignees.join(', ')}</span></>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-3 sm:border-0 sm:pt-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-wider text-muted">Дедлайн</p>
                    <p className="text-sm font-medium" style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : 'Не установлен'}
                    </p>
                  </div>

                  <span className={`chip ${statusConfig.tone}`}>{statusConfig.label}</span>

                  <Icons.ChevronRight className="hidden h-5 w-5 text-muted sm:block" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="section-card flex flex-col items-center justify-center py-16 text-center">
          <div className="surface-soft mb-3 flex h-14 w-14 items-center justify-center rounded-full text-muted">
            <Icons.Tasks className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold">Задач не найдено</p>
          <p className="mt-1 text-sm text-muted">Попробуйте изменить фильтр или создайте новую задачу</p>
        </div>
      )}
    </div>
  )
}
