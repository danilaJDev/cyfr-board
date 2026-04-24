import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TaskStatusSelect from '@/components/TaskStatusSelect'
import AttachmentUpload from '@/components/AttachmentUpload'

const taskStatusLabels: Record<string, { label: string; color: string }> = {
    open:        { label: 'Открыта',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    in_progress: { label: 'В работе',  color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    done:        { label: 'Выполнена', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    cancelled:   { label: 'Отменена',  color: 'bg-red-500/10 text-red-400 border-red-500/20' },
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
    const supabase = createClient()

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
        <div className="max-w-2xl">
            <Link
                href={`/dashboard/projects/${projectId}`}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition"
            >
                <span>←</span>
                {task.project?.name}
            </Link>

            {/* Заголовок */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-xl font-bold text-white leading-snug">{task.title}</h1>
                <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
            </div>

            {/* Мета */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">Статус</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ts.color}`}>
            {ts.label}
          </span>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">Дедлайн</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : '—'}
                    </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">Создана</p>
                    <p className="text-white text-sm font-medium">
                        {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </p>
                </div>
            </div>

            {/* Ответственные */}
            {task.task_assignees?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                    <p className="text-gray-400 text-xs mb-3">Ответственные</p>
                    <div className="flex flex-wrap gap-2">
                        {task.task_assignees.map((a: Assignee) => (
                            <div key={a.user.id} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5">
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                    {a.user.full_name?.[0] ?? '?'}
                                </div>
                                <span className="text-white text-sm">{a.user.full_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Описание */}
            {task.description && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                    <p className="text-gray-400 text-xs mb-2">Описание</p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
                </div>
            )}

            {/* Примечания */}
            {task.notes && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                    <p className="text-gray-400 text-xs mb-2">Примечания</p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{task.notes}</p>
                </div>
            )}

            {/* Вложения */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-gray-400">📎</span>
                    <p className="text-gray-400 text-xs">Файлы и документы</p>
                </div>

                {task.attachments?.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {task.attachments.map((file: Attachment) => (
                            <a
                                key={file.id}
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2.5 transition"
                            >
                                <span className="shrink-0 text-gray-400">📎</span>
                                <span className="text-white text-sm truncate">{file.file_name}</span>
                            </a>
                        ))}
                    </div>
                )}

                <AttachmentUpload taskId={task.id} />
            </div>
        </div>
    )
}
