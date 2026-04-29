'use client'

import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

type Project = { id: string; name: string; status: string }
type TeamMember = { id: string; full_name: string | null; role: string | null }

const statusOptions = [
    {value: 'open', label: 'Открыта'},
    {value: 'in_progress', label: 'В работе'},
]

export default function NewTaskPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [projects, setProjects] = useState<Project[]>([])
    const [team, setTeam] = useState<TeamMember[]>([])
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

    const [form, setForm] = useState({
        project_id: '',
        title: '',
        description: '',
        notes: '',
        status: 'open',
        deadline: '',
    })

    useEffect(() => {
        Promise.all([
            supabase
                .from('projects')
                .select('id, name, status')
                .in('status', ['active', 'on_hold'])
                .order('name', {ascending: true}),
            supabase
                .from('profiles')
                .select('id, full_name, role')
                .order('full_name', {ascending: true}),
        ]).then(([{data: p}, {data: t}]) => {
            if (p) setProjects(p as Project[])
            if (t) setTeam(t as TeamMember[])
        })
    }, [supabase])

    const set = (field: string, value: string) =>
        setForm((prev) => ({...prev, [field]: value}))

    const toggleAssignee = (id: string) =>
        setSelectedAssignees((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.project_id) {
            setError('Выберите проект')
            return
        }
        setLoading(true)
        setError('')

        const {data: {user}} = await supabase.auth.getUser()

        const {data: task, error: taskError} = await supabase
            .from('tasks')
            .insert({
                project_id: form.project_id,
                title: form.title.trim(),
                description: form.description.trim() || null,
                notes: form.notes.trim() || null,
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
                .insert(selectedAssignees.map((userId) => ({task_id: task.id, user_id: userId})))
        }

        router.push(`/dashboard/projects/${form.project_id}/tasks/${task.id}`)
        router.refresh()
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link
                    href="/dashboard/tasks"
                    className="mb-4 inline-flex items-center gap-1.5 text-sm t-muted transition-opacity hover:opacity-75"
                >
                    <Icons.ArrowLeft className="h-4 w-4"/>
                    Назад к задачам
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Новая задача</h1>
                <p className="mt-1 text-sm t-muted">Выберите проект и заполните детали задачи</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project selector */}
                <div className="section-card">
                    <h2 className="mb-4 text-sm font-bold t-fg">Проект</h2>
                    {projects.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-6 text-center text-sm t-subtle"
                             style={{borderColor: 'var(--app-border)'}}>
                            Нет активных проектов
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {projects.map((project) => {
                                const active = form.project_id === project.id
                                return (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => set('project_id', project.id)}
                                        className="flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150"
                                        style={{
                                            borderColor: active ? 'var(--app-accent)' : 'var(--app-border)',
                                            background: active ? 'var(--app-accent-subtle)' : 'var(--app-surface-2)',
                                            boxShadow: active ? '0 0 0 2px var(--app-accent-ring)' : 'none',
                                        }}
                                    >
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                            style={{
                                                background: active ? 'var(--app-accent)' : 'var(--app-surface)',
                                                color: active ? 'var(--app-accent-fg)' : 'var(--app-subtle)',
                                            }}
                                        >
                                            <Icons.Projects className="h-4 w-4"/>
                                        </div>
                                        <span
                                            className="min-w-0 flex-1 truncate text-sm font-medium"
                                            style={{color: active ? 'var(--app-accent-text)' : 'var(--app-fg)'}}
                                        >
                                            {project.name}
                                        </span>
                                        {active && <Icons.Check className="h-4 w-4 shrink-0 t-accent"/>}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Task details */}
                <div className="section-card space-y-5">
                    <h2 className="text-sm font-bold t-fg">Детали задачи</h2>

                    <div>
                        <label htmlFor="title" className="label-base">Название *</label>
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
                        <label htmlFor="description" className="label-base">Описание</label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            rows={3}
                            className="input-base"
                            placeholder="Подробное описание задачи..."
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="task_status" className="label-base">Статус</label>
                            <div className="relative">
                                <select
                                    id="task_status"
                                    value={form.status}
                                    onChange={(e) => set('status', e.target.value)}
                                    className="input-base appearance-none pr-10"
                                >
                                    {statusOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 t-muted">
                                    <Icons.ChevronDown className="h-4 w-4"/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="deadline" className="label-base">Дедлайн</label>
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
                        <label htmlFor="notes" className="label-base">Примечания</label>
                        <textarea
                            id="notes"
                            value={form.notes}
                            onChange={(e) => set('notes', e.target.value)}
                            rows={2}
                            className="input-base"
                            placeholder="Доп. заметки..."
                        />
                    </div>
                </div>

                {/* Assignees */}
                <div className="section-card">
                    <h2 className="mb-4 text-sm font-bold t-fg">Ответственные</h2>
                    {team.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-6 text-center text-sm t-subtle"
                             style={{borderColor: 'var(--app-border)'}}>
                            Нет доступных сотрудников
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {team.map((member) => {
                                const checked = selectedAssignees.includes(member.id)
                                return (
                                    <label
                                        key={member.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-150"
                                        style={{
                                            borderColor: checked ? 'var(--app-accent)' : 'var(--app-border)',
                                            background: checked ? 'var(--app-accent-subtle)' : 'var(--app-surface-2)',
                                            boxShadow: checked ? '0 0 0 2px var(--app-accent-ring)' : 'none',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={checked}
                                            onChange={() => toggleAssignee(member.id)}
                                        />
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase text-white"
                                            style={{background: 'linear-gradient(135deg, var(--app-accent) 0%, #6366F1 100%)'}}
                                        >
                                            {member.full_name?.[0] ?? '?'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium t-fg">
                                                {member.full_name ?? 'Без имени'}
                                            </p>
                                            <p className="truncate text-xs capitalize t-muted">{member.role}</p>
                                        </div>
                                        <div
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                                            style={{
                                                borderColor: checked ? 'var(--app-accent)' : 'var(--app-border-strong)',
                                                background: checked ? 'var(--app-accent)' : 'transparent',
                                            }}
                                        >
                                            {checked && <Icons.Check className="h-3 w-3" style={{color: 'var(--app-accent-fg)'}}/>}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </div>

                {error && <div role="alert" className="alert-error">{error}</div>}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link href="/dashboard/tasks" className="btn-secondary justify-center">
                        Отмена
                    </Link>
                    <button type="submit" disabled={loading} className="btn-primary justify-center">
                        {loading ? (
                            <><Icons.Loader className="h-4 w-4 animate-spin"/>Создаём...</>
                        ) : (
                            <><Icons.Plus className="h-4 w-4"/>Создать задачу</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
