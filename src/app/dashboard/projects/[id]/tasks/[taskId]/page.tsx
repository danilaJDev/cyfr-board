import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TaskStatusSelect from '@/components/TaskStatusSelect'
import AttachmentUpload from '@/components/AttachmentUpload'
import DeleteTaskButton from '@/components/DeleteTaskButton'
import { Icons } from '@/components/Icons'

const taskStatusLabels: Record<string, { label: string; color: string }> = {
    open:        { label: 'Открыта',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    in_progress: { label: 'В работе',  color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    done:        { label: 'Выполнена', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    cancelled:   { label: 'Отменена',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

interface Attachment {
    id: string;
    file_url: string;
    file_name: string;
}

interface Assignee {
    user: {
        id: string;
        full_name: string;
    };
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
        .select(`
      *,
      project:projects(id, name),
      task_assignees(user:profiles(id, full_name)),
      attachments(*)
    `)
        .eq('id', taskId)
        .single()

    if (!task) notFound()

    const ts = taskStatusLabels[task.status] ?? taskStatusLabels.open
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

    return (
        <div className="animate-in">
            <Link
                href={`/dashboard/projects/${projectId}`}
                className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
                <Icons.ChevronLeft className="h-4 w-4" />
                {task.project?.name}
            </Link>

            {/* Заголовок */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-black leading-snug text-white lg:text-4xl">{task.title}</h1>
                <div className="flex shrink-0 items-center gap-2">
                    <Link
                        href={`/dashboard/projects/${projectId}/tasks/${taskId}/edit`}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 active:scale-95"
                    >
                        Изменить
                    </Link>
                    <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
                </div>
            </div>

            {/* Мета */}
            <div className="glass-card mb-8 grid grid-cols-2 gap-5 rounded-3xl p-6 sm:grid-cols-3">
                <div className="flex flex-col">
                    <p className="mb-1 text-xs text-slate-400">Статус</p>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ts.color}`}>
                        {ts.label}
                    </span>
                </div>
                <div className="flex flex-col">
                    <p className="mb-1 text-xs text-slate-400">Дедлайн</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : '—'}
                    </p>
                </div>
                <div className="flex flex-col">
                    <p className="mb-1 text-xs text-slate-400">Создана</p>
                    <p className="text-sm font-medium text-white">
                        {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </p>
                </div>
            </div>

            {/* Ответственные */}
            {task.task_assignees?.length > 0 && (
                <div className="glass-card mb-8 rounded-3xl p-6">
                    <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">Ответственные</p>
                    <div className="flex flex-wrap gap-3">
                        {task.task_assignees.map((a: Assignee) => (
                            <div key={a.user.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                                    {a.user.full_name?.[0] ?? '?'}
                                </div>
                                <span className="text-sm font-medium text-white">{a.user.full_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Описание */}
            {task.description && (
                <div className="glass-card mb-8 rounded-3xl p-6">
                    <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">Описание</p>
                    <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{task.description}</p>
                </div>
            )}

            {/* Примечания */}
            {task.notes && (
                <div className="glass-card mb-8 rounded-3xl p-6">
                    <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">Примечания</p>
                    <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{task.notes}</p>
                </div>
            )}

            <div className="mb-8 flex justify-end">
                <DeleteTaskButton taskId={task.id} projectId={projectId} />
            </div>

            {/* Вложения */}
            <div className="glass-card rounded-3xl p-6">
                <div className="mb-5 flex items-center gap-3">
                    <Icons.Paperclip className="h-5 w-5 text-slate-500" />
                    <p className="text-xs uppercase tracking-widest text-slate-400">Вложения ({task.attachments?.length ?? 0})</p>
                </div>

                {task.attachments?.length > 0 && (
                    <div className="mb-5 grid gap-3 sm:grid-cols-2">
                        {task.attachments.map((file: Attachment) => (
                            <a
                                key={file.id}
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                            >
                                <Icons.File className="h-5 w-5 shrink-0 text-slate-400" />
                                <span className="text-sm font-medium text-white truncate">{file.file_name}</span>
                            </a>
                        ))}
                    </div>
                )}

                <AttachmentUpload taskId={task.id} />
            </div>
        </div>
    )
}
