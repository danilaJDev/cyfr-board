import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TaskStatusSelect from '@/components/TaskStatusSelect'
import AttachmentUpload from '@/components/AttachmentUpload'
import DeleteTaskButton from '@/components/DeleteTaskButton'
import { Icons } from '@/components/Icons'

const taskStatusLabels: Record<string, { label: string; color: string }> = {
    open:        { label: 'Открыта',   color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    in_progress: { label: 'В работе',  color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
    done:        { label: 'Выполнена', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    cancelled:   { label: 'Отменена',  color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
}

interface Attachment {
    id: string
    file_url: string
    file_name: string
}

interface Assignee {
    user: {
        id: string
        full_name: string
    }
}

export default async function TaskPage({
                                           params,
                                       }: {
    params: Promise<{ id: string; taskId: string }>
}) {
    const { id: projectId, taskId } = await params
    const supabase = await createClient()

    const { data: task } = await supabase
        .from('tasks')
        .select(
            `
      *,
      project:projects(id, name),
      task_assignees(user:profiles(id, full_name)),
      attachments(*)
    `,
        )
        .eq('id', taskId)
        .single()

    if (!task) notFound()

    const ts = taskStatusLabels[task.status] ?? taskStatusLabels.open
    const isOverdue =
        task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

    return (
        <div className="animate-in">
            <Link
                href={`/dashboard/projects/${projectId}`}
                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
            >
                <Icons.ArrowLeft className="h-4 w-4" />
                <span className="truncate">{task.project?.name}</span>
            </Link>

            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl text-balance">
                        {task.title}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`chip ${ts.color}`}>{ts.label}</span>
                        {isOverdue && (
                            <span className="chip border-red-500/20 bg-red-500/10 text-red-300">
                                <Icons.AlertTriangle className="h-3 w-3" />
                                Просрочено
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                        href={`/dashboard/projects/${projectId}/tasks/${taskId}/edit`}
                        className="btn-secondary py-2.5"
                    >
                        <Icons.Edit className="h-4 w-4" />
                        <span>Изменить</span>
                    </Link>
                    <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-6 lg:col-span-2">
                    {task.description && (
                        <Section title="Описание">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                                {task.description}
                            </p>
                        </Section>
                    )}

                    {task.notes && (
                        <Section title="Примечания">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                                {task.notes}
                            </p>
                        </Section>
                    )}

                    <Section
                        title="Вложения"
                        icon={<Icons.Paperclip className="h-5 w-5 text-slate-500" />}
                        count={task.attachments?.length}
                    >
                        {task.attachments?.length > 0 && (
                            <div className="mb-4 grid gap-2 sm:grid-cols-2">
                                {task.attachments.map((file: Attachment) => (
                                    <a
                                        key={file.id}
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 transition hover:border-cyan-400/20 hover:bg-white/[0.06]"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-300">
                                            <Icons.File className="h-4 w-4" />
                                        </div>
                                        <span className="truncate text-sm font-medium text-white">
                                            {file.file_name}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                        <AttachmentUpload taskId={task.id} />
                    </Section>
                </div>

                <div className="space-y-5 lg:col-span-1">
                    <div className="section-card">
                        <h3 className="mb-4 text-base font-bold text-white">Детали</h3>
                        <div className="space-y-3.5 text-sm">
                            <InfoItem
                                icon={<Icons.Calendar className="h-4 w-4 text-slate-400" />}
                                label="Дедлайн"
                                value={
                                    task.deadline
                                        ? new Date(task.deadline).toLocaleDateString('ru-RU')
                                        : null
                                }
                                isOverdue={isOverdue}
                            />
                            <InfoItem
                                icon={<Icons.Clock className="h-4 w-4 text-slate-400" />}
                                label="Создана"
                                value={new Date(task.created_at).toLocaleDateString('ru-RU')}
                            />
                        </div>
                    </div>

                    {task.task_assignees?.length > 0 && (
                        <div className="section-card">
                            <h3 className="mb-4 text-base font-bold text-white">Ответственные</h3>
                            <div className="flex flex-col gap-3">
                                {task.task_assignees.map((a: Assignee) => (
                                    <div key={a.user.id} className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold uppercase text-white shadow-md">
                                            {a.user.full_name?.[0] ?? '?'}
                                        </div>
                                        <span className="truncate text-sm font-medium text-white">
                                            {a.user.full_name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-white/10 pt-5">
                        <DeleteTaskButton taskId={task.id} projectId={projectId} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function Section({
    title,
    icon,
    count,
    children,
}: {
    title: string
    icon?: React.ReactNode
    count?: number
    children: React.ReactNode
}) {
    return (
        <div className="section-card">
            <div className="mb-4 flex items-center gap-3">
                {icon}
                <h2 className="text-base font-bold text-white sm:text-lg">
                    {title}
                    {count !== undefined && (
                        <span className="ml-1 text-slate-500">({count})</span>
                    )}
                </h2>
            </div>
            {children}
        </div>
    )
}

function InfoItem({
    icon,
    label,
    value,
    isOverdue,
}: {
    icon: React.ReactNode
    label: string
    value: string | null | undefined
    isOverdue?: boolean
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>
                <p
                    className={`truncate font-medium ${
                        isOverdue ? 'text-red-400' : 'text-white'
                    }`}
                >
                    {value ?? '—'}
                </p>
            </div>
        </div>
    )
}
