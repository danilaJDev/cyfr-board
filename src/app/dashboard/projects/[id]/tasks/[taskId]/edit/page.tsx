'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

type TeamMember = {
    id: string
    full_name: string | null
    role: string | null
}

export default function EditTaskPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const taskId = params.taskId as string
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [team, setTeam] = useState<TeamMember[]>([])
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

    const [form, setForm] = useState({
        title: '',
        description: '',
        notes: '',
        status: 'open',
        deadline: '',
    })

    useEffect(() => {
        const loadPage = async () => {
            const [{ data: members }, { data: task, error: taskError }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .order('full_name', { ascending: true }),
                supabase
                    .from('tasks')
                    .select('title, description, notes, status, deadline, task_assignees(user_id)')
                    .eq('id', taskId)
                    .single(),
            ])

            if (members) setTeam(members as TeamMember[])

            if (taskError || !task) {
                setError(taskError?.message ?? 'Не удалось загрузить задачу')
                setFetching(false)
                return
            }

            setForm({
                title: task.title ?? '',
                description: task.description ?? '',
                notes: task.notes ?? '',
                status: task.status ?? 'open',
                deadline: task.deadline ? String(task.deadline).slice(0, 10) : '',
            })
            setSelectedAssignees(
                task.task_assignees?.map((row: { user_id: string }) => row.user_id) ?? [],
            )
            setFetching(false)
        }

        loadPage()
    }, [supabase, taskId])

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const toggleAssignee = (id: string) =>
        setSelectedAssignees((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error: updateError } = await supabase
            .from('tasks')
            .update({
                title: form.title.trim(),
                description: form.description || null,
                notes: form.notes || null,
                status: form.status,
                deadline: form.deadline || null,
            })
            .eq('id', taskId)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        const { error: cleanupError } = await supabase
            .from('task_assignees')
            .delete()
            .eq('task_id', taskId)
        if (cleanupError) {
            setError(cleanupError.message)
            setLoading(false)
            return
        }

        if (selectedAssignees.length > 0) {
            const { error: insertError } = await supabase
                .from('task_assignees')
                .insert(
                    selectedAssignees.map((userId) => ({ task_id: taskId, user_id: userId })),
                )

            if (insertError) {
                setError(insertError.message)
                setLoading(false)
                return
            }
        }

        router.push(`/dashboard/projects/${projectId}/tasks/${taskId}`)
        router.refresh()
    }

    if (fetching) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Icons.Loader className="h-8 w-8 animate-spin t-accent" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link
                    href={`/dashboard/projects/${projectId}/tasks/${taskId}`}
                    className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent"
                >
                    <Icons.ArrowLeft className="h-4 w-4" />
                    Назад к задаче
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">
                    Изменить задачу
                </h1>
            </div>

            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="title" className="label-base">
                            Название *
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            className="input-base"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="label-base">
                            Описание
                        </label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            rows={4}
                            className="input-base"
                        />
                    </div>

                    <div>
                        <label htmlFor="notes" className="label-base">
                            Примечания
                        </label>
                        <textarea
                            id="notes"
                            value={form.notes}
                            onChange={(e) => set('notes', e.target.value)}
                            rows={2}
                            className="input-base"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="label-base">
                                Статус
                            </label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(e) => set('status', e.target.value)}
                                className="input-base"
                            >
                                <option value="open">Открыта</option>
                                <option value="in_progress">В работе</option>
                                <option value="done">Выполнена</option>
                                <option value="cancelled">Отменена</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="deadline" className="label-base">
                                Дедлайн
                            </label>
                            <input
                                id="deadline"
                                type="date"
                                value={form.deadline}
                                onChange={(e) => set('deadline', e.target.value)}
                                className="input-base"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label-base">Ответственные</label>
                        {team.length === 0 ? (
                            <p className="rounded-xl border border-dashed px-4 py-3 text-xs t-subtle" style={{ borderColor: 'var(--app-border)' }}>
                                Нет доступных сотрудников
                            </p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {team.map((member) => {
                                    const checked = selectedAssignees.includes(member.id)
                                    return (
                                        <label
                                            key={member.id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                                                checked
                                                    ? 'border-[var(--app-accent-ring)] bg-[var(--app-accent-subtle)] ring-2 ring-[var(--app-accent-ring)]'
                                                    : 'glass-card rounded-xl'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={checked}
                                                onChange={() => toggleAssignee(member.id)}
                                            />
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase text-white" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}>
                                                {member.full_name?.[0] ?? '?'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium t-fg">
                                                    {member.full_name ?? 'Без имени'}
                                                </p>
                                                <p className="truncate text-xs capitalize t-muted">
                                                    {member.role}
                                                </p>
                                            </div>
                                            <div
                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                                    checked
                                                        ? 'border-cyan-400 bg-cyan-400'
                                                        : 'border-slate-600'
                                                }`}
                                                aria-hidden
                                            >
                                                {checked && (
                                                    <Icons.Check className="h-3 w-3" style={{ color: "var(--app-bg)" }} />
                                                )}
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="alert-error"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link
                            href={`/dashboard/projects/${projectId}/tasks/${taskId}`}
                            className="btn-secondary justify-center"
                        >
                            Отмена
                        </Link>
                        <button type="submit" disabled={loading} className="btn-primary justify-center">
                            {loading ? (
                                <>
                                    <Icons.Loader className="h-4 w-4 animate-spin" />
                                    Сохраняем...
                                </>
                            ) : (
                                <>
                                    <Icons.Check className="h-4 w-4" />
                                    Сохранить изменения
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
