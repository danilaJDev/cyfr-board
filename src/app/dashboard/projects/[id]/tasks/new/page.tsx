'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NewTaskPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [team, setTeam] = useState<any[]>([])
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

    const [form, setForm] = useState({
        title: '',
        description: '',
        notes: '',
        status: 'open',
        deadline: '',
    })

    useEffect(() => {
        supabase.from('profiles').select('id, full_name, role').then(({ data }) => {
            if (data) setTeam(data)
        })
    }, [])

    const set = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }))

    const toggleAssignee = (id: string) =>
        setSelectedAssignees(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

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

        // Назначаем ответственных
        if (selectedAssignees.length > 0) {
            await supabase.from('task_assignees').insert(
                selectedAssignees.map(userId => ({ task_id: task.id, user_id: userId }))
            )
        }

        router.push(`/dashboard/projects/${projectId}/tasks/${task.id}`)
    }

    return (
        <div className="max-w-xl">
            <Link
                href={`/dashboard/projects/${projectId}`}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition"
            >
                <span>←</span>
                Назад к проекту
            </Link>

            <h1 className="text-2xl font-bold text-white mb-8">Новая задача</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Название *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => set('title', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        placeholder="Получить NOC от управляющей компании"
                        required
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Описание</label>
                    <textarea
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        rows={3}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                        placeholder="Подробное описание задачи..."
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Примечания</label>
                    <textarea
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        rows={2}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                        placeholder="Доп. заметки..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-1.5 block">Статус</label>
                        <select
                            value={form.status}
                            onChange={e => set('status', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                        >
                            <option value="open">Открыта</option>
                            <option value="in_progress">В работе</option>
                            <option value="done">Выполнена</option>
                            <option value="cancelled">Отменена</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-1.5 block">Дедлайн</label>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={e => set('deadline', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Ответственные */}
                <div>
                    <label className="text-gray-400 text-sm mb-2 block">Ответственные</label>
                    <div className="space-y-2">
                        {team.map(member => (
                            <label
                                key={member.id}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                                    selectedAssignees.includes(member.id)
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedAssignees.includes(member.id)}
                                    onChange={() => toggleAssignee(member.id)}
                                />
                                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {member.full_name?.[0] ?? '?'}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">{member.full_name ?? 'Без имени'}</p>
                                    <p className="text-gray-400 text-xs capitalize">{member.role}</p>
                                </div>
                                {selectedAssignees.includes(member.id) && (
                                    <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition"
                >
                    {loading ? 'Создаём...' : 'Создать задачу'}
                </button>
            </form>
        </div>
    )
}