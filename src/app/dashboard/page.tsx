import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/Icons'
import Link from 'next/link'

const taskStatusLabel: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
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
        .limit(6),
      supabase.from('projects').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(6),
    ])

  const statusBuckets = Object.keys(taskStatusLabel).map((key) => ({
    key,
    label: taskStatusLabel[key],
    count: recentTasks?.filter((task) => task.status === key).length ?? 0,
  }))

  const overdueCount = recentTasks?.filter(
    (task) => task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done',
  ).length ?? 0

  return (
    <div className="space-y-10 animate-in">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">
          Командный <span className="text-cyan-400">центр</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-400">
          Общий статус проектов и задач CYFR FITOUT. Все показатели обновляются в реальном времени.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
            title="Активных проектов" 
            value={projectsCount ?? 0} 
            icon={<Icons.Projects className="h-6 w-6" />}
            color="text-cyan-400"
            trend="+2 за неделю"
        />
        <StatCard 
            title="Всего задач" 
            value={tasksCount ?? 0} 
            icon={<Icons.Tasks className="h-6 w-6" />}
            color="text-indigo-400"
            trend="85% выполнение"
        />
        <StatCard 
            title="Срочные / Просрочены" 
            value={overdueCount} 
            icon={<Icons.Calendar className="h-6 w-6" />}
            color={overdueCount > 0 ? "text-red-400" : "text-green-400"}
            trend={overdueCount > 0 ? "Требует внимания" : "Все по графику"}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="glass-card rounded-3xl p-6 lg:col-span-1">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Статистика задач</h2>
            <Icons.Tasks className="h-5 w-5 text-slate-500" />
          </div>
          <div className="space-y-5">
            {statusBuckets.map((status) => (
              <div key={status.key}>
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span className="text-slate-300">{status.label}</span>
                  <span className="text-white">{status.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                        status.key === 'done' ? 'bg-green-500' :
                        status.key === 'in_progress' ? 'bg-cyan-500' :
                        status.key === 'cancelled' ? 'bg-slate-600' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((status.count / Math.max(recentTasks?.length || 1, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Последние проекты</h2>
            <Link href="/dashboard/projects" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition">
                Смотреть все →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {projects?.map((project) => (
              <Link 
                key={project.id} 
                href={`/dashboard/projects/${project.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold">{project.status}</span>
                        <Icons.ChevronLeft className="h-4 w-4 rotate-180 text-slate-600 group-hover:text-cyan-400 transition" />
                    </div>
                    <p className="font-bold text-white group-hover:text-cyan-400 transition">{project.name}</p>
                </div>
                <p className="mt-4 text-[11px] text-slate-500">
                  {new Date(project.created_at).toLocaleDateString('ru-RU')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, trend }: { title: string; value: number; icon: React.ReactNode; color: string; trend: string }) {
  return (
    <article className="glass-card group rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl bg-white/5 p-3 text-white transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{trend}</span>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className={`mt-1 text-4xl font-black ${color} tracking-tight`}>{value}</p>
      </div>
    </article>
  )
}

