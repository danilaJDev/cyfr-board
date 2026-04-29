import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/Icons'
import Link from 'next/link'

const taskStatusLabel: Record<string, string> = {
  open:        'Открыта',
  in_progress: 'В работе',
  done:        'Выполнена',
  cancelled:   'Отменена',
}

const projectStatusLabels: Record<string, { label: string; chipClass: string }> = {
  active:    { label: 'Активный', chipClass: 'status-success' },
  completed: { label: 'Завершён', chipClass: 'status-info'    },
  on_hold:   { label: 'На паузе', chipClass: 'status-warning' },
  cancelled: { label: 'Отменён',  chipClass: 'status-danger'  },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: projectsCount },
    { count: tasksCount },
    { data: recentTasks },
    { data: projects },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase
      .from('tasks')
      .select('id, title, status, deadline, created_at, project:projects(name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('projects')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const statusBuckets = Object.keys(taskStatusLabel).map((key) => ({
    key,
    label: taskStatusLabel[key],
    count: recentTasks?.filter((task) => task.status === key).length ?? 0,
  }))

  const overdueCount =
    recentTasks?.filter(
      (task) =>
        task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done',
    ).length ?? 0

  const totalRecent = recentTasks?.length ?? 0
  const doneCount = recentTasks?.filter((t) => t.status === 'done').length ?? 0
  const completionPercent = totalRecent > 0 ? Math.round((doneCount / totalRecent) * 100) : 0

  return (
    <div className="space-y-8 sm:space-y-10 animate-in">
      <header>
        <h1 className="text-3xl font-black tracking-tight t-fg sm:text-4xl text-balance">
          Дашборд
        </h1>
        <p className="mt-1 text-sm t-muted">Обзор проектов и задач</p>
      </header>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <StatCard
          title="Проекты"
          value={projectsCount ?? 0}
          icon={<Icons.Projects className="h-5 w-5" />}
          accentClass="status-accent"
          trend="Под управлением"
        />
        <StatCard
          title="Все задачи"
          value={tasksCount ?? 0}
          icon={<Icons.Tasks className="h-5 w-5" />}
          accentClass="status-info"
          trend={`${completionPercent}% выполнено`}
        />
        <StatCard
          title="Просрочено"
          value={overdueCount}
          icon={<Icons.AlertTriangle className="h-5 w-5" />}
          accentClass={overdueCount > 0 ? 'status-danger' : 'status-success'}
          trend={overdueCount > 0 ? 'Требует внимания' : 'Всё по графику'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task stats breakdown */}
        <section className="section-card lg:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold t-fg sm:text-lg">Статистика задач</h2>
            <Icons.Tasks className="h-5 w-5 t-subtle" />
          </div>
          <div className="space-y-4">
            {statusBuckets.map((status) => {
              const max = Math.max(totalRecent, 1)
              const percent = Math.min((status.count / max) * 100, 100)
              const barColor =
                status.key === 'done'        ? 'var(--status-success-text)' :
                status.key === 'in_progress' ? 'var(--app-accent-text)'     :
                status.key === 'cancelled'   ? 'var(--app-subtle)'          :
                                               'var(--status-info-text)'
              return (
                <div key={status.key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium t-muted">{status.label}</span>
                    <span className="font-bold t-fg">{status.count}</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--app-surface-2)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent projects */}
        <section className="section-card lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold t-fg sm:text-lg">Последние проекты</h2>
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold t-accent transition-opacity hover:opacity-75"
            >
              Все
              <Icons.ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {projects?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => {
                const status = projectStatusLabels[project.status] ?? projectStatusLabels.active
                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="group glass-card flex flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className={`chip ${status.chipClass}`}>{status.label}</span>
                        <Icons.ArrowRight className="h-4 w-4 t-subtle" />
                      </div>
                      <p className="line-clamp-2 text-sm font-bold t-fg sm:text-base">
                        {project.name}
                      </p>
                    </div>
                    <p className="mt-3 text-[11px] t-subtle">
                      {new Date(project.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="Проектов ещё нет"
              description="Создайте первый объект, чтобы начать работу"
              icon={<Icons.Projects className="h-7 w-7" />}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  accentClass,
  trend,
}: {
  title: string
  value: number
  icon: React.ReactNode
  accentClass: string
  trend: string
}) {
  return (
    <article className="section-card transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className={`chip ${accentClass} px-3 py-2 text-[13px]`}>
          {icon}
        </div>
        <span className="text-right text-sm font-medium t-muted">{trend}</span>
      </div>
      <div className="mt-5">
        <p className="text-sm font-semibold t-muted">{title}</p>
        <p className="mt-0.5 text-4xl font-black tracking-tight t-fg sm:text-5xl">{value}</p>
      </div>
    </article>
  )
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center"
      style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)' }}
    >
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle"
        style={{ background: 'var(--app-surface)' }}
      >
        {icon}
      </div>
      <p className="text-sm font-bold t-fg">{title}</p>
      <p className="mt-1 text-xs t-subtle">{description}</p>
    </div>
  )
}
