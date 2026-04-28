import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

const statusLabels: Record<string, { label: string; tone: string }> = {
  active: { label: 'Активный', tone: 'status-success' },
  completed: { label: 'Завершён', tone: 'status-info' },
  on_hold: { label: 'На паузе', tone: 'status-warning' },
  cancelled: { label: 'Отменён', tone: 'status-danger' },
}

const typeLabels: Record<string, string> = {
  FITOUT: 'Fitout',
  Maintenance: 'Maintenance',
  Other: 'Other',
}

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select(
      `
    *,
    manager:profiles!projects_manager_id_fkey(full_name),
    creator:profiles!projects_created_by_fkey(full_name),
    tasks(count)
  `,
    )
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  return (
    <div className="animate-in">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Проекты</h1>
          <p className="mt-1 text-sm text-muted">{projects?.length ?? 0} объектов под управлением</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/projects/new" className="btn-primary w-full sm:w-auto">
            <Icons.Plus className="h-5 w-5" />
            Новый проект
          </Link>
        )}
      </div>

      {!projects?.length ? (
        <div className="section-card flex flex-col items-center justify-center py-16 text-center sm:py-24">
          <div className="surface-soft mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-muted">
            <Icons.Projects className="h-8 w-8" />
          </div>
          <p className="mb-1 text-lg font-semibold">Проектов пока нет</p>
          <p className="text-sm text-muted">Создайте первый объект, чтобы начать работу</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const status = statusLabels[project.status] ?? statusLabels.active
            const taskCount = project.tasks?.[0]?.count ?? 0

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="section-card transition hover:-translate-y-0.5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className={`chip ${status.tone}`}>{status.label}</span>
                  <span className="chip surface-soft text-muted">Открыть</span>
                </div>

                <h3 className="mb-4 line-clamp-2 text-lg font-semibold">{project.name}</h3>

                <div className="space-y-2 border-t pt-4 text-sm" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between gap-3 text-muted">
                    <span className="flex items-center gap-2"><Icons.File className="h-4 w-4" />Тип</span>
                    <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{typeLabels[project.type] ?? project.type ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-muted">
                    <span className="flex items-center gap-2"><Icons.User className="h-4 w-4" />Менеджер</span>
                    <span className="max-w-[170px] truncate font-medium" style={{ color: 'var(--text-primary)' }}>{project.manager?.full_name ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-muted">
                    <span className="flex items-center gap-2"><Icons.TaskCheck className="h-4 w-4" />Задачи</span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>{taskCount}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
