'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

type TeamMember = {
    id: string
    full_name: string | null
    role: string | null
}

export default function NewTaskPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
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
        supabase
            .from('profiles')
            .select('id, full_name, role')
            .order('full_name', { ascending: true })
            .then(({ data }) => {
                if (data) setTeam(data as TeamMember[])
            })
    }, [supabase])

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

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                title: form.title,
                description: form.description || null,
                notes: form.notes || null,
                status: form.status,
                deadline: form.deadline || null,
                created_by: user?.id,
            })
            .select()
            .single()

        if (taskError) {
            setError(taskError.message)
            setLoading(false)
            return
        }

        if (selectedAssignees.length > 0) {
            await supabase
                .from('task_assignees')
                .insert(
                    selectedAssignees.map((userId) => ({ task_id: task.id, user_id: userId })),
                )
        }

        router.push(`/dashboard/projects/${projectId}/tasks/${task.id}`)
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link
                    href={`/dashboard/projects/${projectId}`}
                    className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent"
                >
                    <Icons.ArrowLeft className="h-4 w-4" />
                    Назад к проекту
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">
                    Новая задача
                </h1>
                <p className="mt-1 text-sm t-muted">Заполните детали новой задачи.</p>
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
                            placeholder="Получить NOC от управляющей компании"
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
                            placeholder="Подробное описание задачи..."
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
                            placeholder="Доп. заметки..."
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
                            href={`/dashboard/projects/${projectId}`}
                            className="btn-secondary justify-center"
                        >
                            Отмена
                        </Link>
                        <button type="submit" disabled={loading} className="btn-primary justify-center">
                            {loading ? (
                                <>
                                    <Icons.Loader className="h-4 w-4 animate-spin" />
                                    Создаём...
                                </>
                            ) : (
                                <>
                                    <Icons.Plus className="h-4 w-4" />
                                    Создать задачу
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
