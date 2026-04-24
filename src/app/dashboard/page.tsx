import { createClient } from '@/lib/supabase/server'

const taskStatusLabel: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export default async function DashboardPage() {
  const supabase = createClient()

  const [{ count: projectsCount }, { count: tasksCount }, { data: recentTasks }, { data: projects }] =
    await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase
        .from('tasks')
        .select('id, title, status, deadline, created_at, project:projects(name)')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('projects').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(6),
    ])

  const statusBuckets = Object.keys(taskStatusLabel).map((key) => ({
    key,
    label: taskStatusLabel[key],
    count: recentTasks?.filter((task) => task.status === key).length ?? 0,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="mt-2 text-slate-400">Общий статус проектов и задач CYFR FITOUT.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Проектов" value={projectsCount ?? 0} />
        <StatCard title="Всего задач" value={tasksCount ?? 0} />
        <StatCard
          title="Срочные задачи"
          value={
            recentTasks?.filter(
              (task) => task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done',
            ).length ?? 0
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <h2 className="font-semibold">Задачи по статусам (последние 6)</h2>
          <div className="mt-4 space-y-3">
            {statusBuckets.map((status) => (
              <div key={status.key}>
                <div className="mb-1 flex justify-between text-xs text-slate-300">
                  <span>{status.label}</span>
                  <span>{status.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-cyan-400"
                    style={{ width: `${Math.min((status.count / Math.max(recentTasks?.length || 1, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <h2 className="font-semibold">Последние проекты</h2>
          <ul className="mt-3 space-y-2">
            {projects?.map((project) => (
              <li key={project.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                <p className="font-medium text-white">{project.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {project.status} • {new Date(project.created_at).toLocaleDateString('ru-RU')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-cyan-300">{value}</p>
    </article>
  )
}
