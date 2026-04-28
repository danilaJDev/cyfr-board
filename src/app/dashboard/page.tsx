import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/Icons'
import Link from 'next/link'

const taskStatusLabel: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

const projectStatusLabels: Record<string, { label: string; tone: string }> = {
  active: { label: 'Активный', tone: 'status-success' },
  completed: { label: 'Завершён', tone: 'status-info' },
  on_hold: { label: 'На паузе', tone: 'status-warning' },
  cancelled: { label: 'Отменён', tone: 'status-danger' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ count: projectsCount }, { count: tasksCount }, { data: recentTasks }, { data: projects }] =
    await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase
        .from('tasks')
        .select('id, title, status, deadline, created_at, project:projects(name)')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('projects').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(6),
    ])

  const statusBuckets = Object.keys(taskStatusLabel).map((key) => ({
    key,
    label: taskStatusLabel[key],
    count: recentTasks?.filter((task) => task.status === key).length ?? 0,
  }))

  const overdueCount =
    recentTasks?.filter((task) => task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done').length ?? 0

  const totalRecent = recentTasks?.length ?? 0
  const doneCount = recentTasks?.filter((t) => t.status === 'done').length ?? 0
  const completionPercent = totalRecent > 0 ? Math.round((doneCount / totalRecent) * 100) : 0

  return (
    <div className="animate-in space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Командный центр</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">Единый обзор проектов, задач и приоритетов команды.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Активных проектов" value={projectsCount ?? 0} icon={<Icons.Projects className="h-5 w-5" />} trend="Под управлением" />
        <StatCard title="Всего задач" value={tasksCount ?? 0} icon={<Icons.Tasks className="h-5 w-5" />} trend={`${completionPercent}% выполнено`} />
        <StatCard title="Срочные / Просрочены" value={overdueCount} icon={<Icons.AlertTriangle className="h-5 w-5" />} trend={overdueCount > 0 ? 'Требует внимания' : 'В норме'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="section-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Статусы задач</h2>
            <Icons.Tasks className="h-5 w-5 text-muted" />
          </div>
          <div className="space-y-4">
            {statusBuckets.map((status) => {
              const max = Math.max(totalRecent, 1)
              const percent = Math.min((status.count / max) * 100, 100)
              return (
                <div key={status.key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted">{status.label}</span>
                    <span className="font-semibold">{status.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="section-card xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Последние проекты</h2>
            <Link href="/dashboard/projects" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              Все
            </Link>
          </div>
          {projects?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => {
                const status = projectStatusLabels[project.status] ?? projectStatusLabels.active
                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="surface-soft flex flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-0.5">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className={`chip ${status.tone}`}>{status.label}</span>
                        <Icons.ArrowRight className="h-4 w-4 text-muted" />
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold sm:text-base">{project.name}</p>
                    </div>
                    <p className="mt-3 text-xs text-muted">{new Date(project.created_at).toLocaleDateString('ru-RU')}</p>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState title="Проектов ещё нет" description="Создайте первый объект, чтобы начать работу" icon={<Icons.Projects className="h-7 w-7" />} />
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, trend }: { title: string; value: number; icon: React.ReactNode; trend: string }) {
  return (
    <article className="section-card">
      <div className="flex items-center justify-between">
        <div className="surface-soft flex h-11 w-11 items-center justify-center rounded-xl">{icon}</div>
        <span className="text-xs text-muted">{trend}</span>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted">{title}</p>
        <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--primary)' }}>{value}</p>
      </div>
    </article>
  )
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="surface-soft flex flex-col items-center justify-center rounded-2xl py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--surface)' }}>
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  )
}
