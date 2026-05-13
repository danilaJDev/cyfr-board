import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import ProjectsExplorer, {type ProjectListItem} from '@/components/ProjectsExplorer'

export default async function ProjectsPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    const {data: projects} = await supabase
        .from('projects')
        .select(`
      *,
      manager:profiles!projects_manager_id_fkey(full_name),
      project_assignees(user:profiles(full_name)),
      creator:profiles!projects_created_by_fkey(full_name),
      tasks(count)
    `)
        .order('created_at', {ascending: false})

    const {data: profile} = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
    const normalizedProjects: ProjectListItem[] = (projects ?? []).map((project) => {
        const assignees = project.project_assignees
            ?.map((a: { user?: { full_name?: string } | null }) => a.user?.full_name)
            .filter((name: string | undefined): name is string => Boolean(name)) ?? []

        return {
            id: project.id,
            name: project.name,
            status: project.status,
            type: project.type,
            created_at: project.created_at,
            manager: project.manager?.full_name ?? project.creator?.full_name ?? null,
            assignees,
            taskCount: project.tasks?.[0]?.count ?? 0,
        }
    })

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Проекты</h1>
                    <p className="mt-1 text-sm t-muted">
                        Всего проектов: {projects?.length ?? 0}
                    </p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/projects/new"
                        className="btn-primary self-stretch justify-center py-3 sm:self-auto"
                    >
                        <Icons.Plus className="h-4 w-4"/>
                        Новый проект
                    </Link>
                )}
            </div>

            <ProjectsExplorer projects={normalizedProjects} isAdmin={isAdmin}/>
        </div>
    )
}
