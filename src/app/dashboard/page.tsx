import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/Icons'
import Link from 'next/link'

const taskStatusLabel: Record<string, string> = {
  open: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

const taskStatusHint: Record<string, string> = {
  open: 'Только создана, исполнитель ещё не начал работу',
  in_progress: 'Исполнитель уже работает над задачей',
  done: 'Задача полностью завершена',
  cancelled: 'Задача закрыта без выполнения',
}

const projectStatusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Активный', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  completed: { label: 'Завершён', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  on_hold: { label: 'На паузе', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  cancelled: { label: 'Отменён', color: 'bg-red-500/10 text-red-300 border-red-500/20' },
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
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl text-balance">
          Дашборд
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <StatCard
          title="Активных проектов"
          value={projectsCount ?? 0}
          icon={<Icons.Projects className="h-5 w-5 sm:h-6 sm:w-6" />}
          color="text-cyan-300"
          accent="bg-cyan-500/10"
          trend="Под управлением"
        />
        <StatCard
          title="Всего задач"
          value={tasksCount ?? 0}
          icon={<Icons.Tasks className="h-5 w-5 sm:h-6 sm:w-6" />}
          color="text-indigo-300"
          accent="bg-indigo-500/10"
          trend={`${completionPercent}% выполнено`}
        />
        <StatCard
          title="Срочные / Просрочены"
          value={overdueCount}
          icon={<Icons.AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
          color={overdueCount > 0 ? 'text-red-300' : 'text-emerald-300'}
          accent={overdueCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}
          trend={overdueCount > 0 ? 'Требует внимания' : 'Все по графику'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="section-card lg:col-span-1">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">Статусы задач</h2>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                Распределение по последним {totalRecent} задачам
              </p>
            </div>
            <Icons.Tasks className="h-5 w-5 text-slate-500" />
          </div>
          <div className="space-y-3">
            {statusBuckets.map((status) => {
              const max = Math.max(totalRecent, 1)
              const percent = Math.min((status.count / max) * 100, 100)
              return (
                <div
                  key={status.key}
                  className="rounded-xl border border-white/5 bg-slate-900/40 p-3 sm:p-3.5"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white sm:text-base">{status.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-400 sm:text-[13px]">
                        {taskStatusHint[status.key]}
                      </p>
                    </div>
                    <span className="rounded-md bg-white/5 px-2 py-1 text-sm font-semibold text-cyan-300">
                      {status.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        status.key === 'done'
                          ? 'bg-emerald-500'
                          : status.key === 'in_progress'
                          ? 'bg-cyan-500'
                          : status.key === 'cancelled'
                          ? 'bg-slate-600'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-xs text-slate-500">{Math.round(percent)}%</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="section-card lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white sm:text-xl">Последние проекты</h2>
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
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
                    className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.06]"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className={`chip ${status.color}`}>{status.label}</span>
                        <Icons.ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-400" />
                      </div>
                      <p className="line-clamp-2 text-base font-bold leading-6 text-white transition group-hover:text-cyan-300 sm:text-lg">
                        {project.name}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
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
  color,
  accent,
  trend,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  accent: string
  trend: string
}) {
  return (
    <article className="section-card group transition hover:-translate-y-0.5 hover:border-cyan-400/20">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors sm:h-12 sm:w-12 ${accent}`}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
          {trend}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-slate-300 sm:text-base">{title}</p>
        <p className={`mt-1 text-3xl font-black tracking-tight sm:text-4xl ${color}`}>{value}</p>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-500">
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}
