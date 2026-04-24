'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const taskId = params.taskId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
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
    const loadPage = async () => {
      const [{ data: members }, { data: task, error: taskError }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role'),
        supabase
          .from('tasks')
          .select('title, description, notes, status, deadline, task_assignees(user_id)')
          .eq('id', taskId)
          .single(),
      ])

      if (members) setTeam(members)

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
      setSelectedAssignees(task.task_assignees?.map((row: { user_id: string }) => row.user_id) ?? [])
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

    const { error: cleanupError } = await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (cleanupError) {
      setError(cleanupError.message)
      setLoading(false)
      return
    }

    if (selectedAssignees.length > 0) {
      const { error: insertError } = await supabase.from('task_assignees').insert(
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
    return <p className="text-sm text-gray-400">Загрузка задачи...</p>
  }

  return (
    <div className="max-w-xl">
      <Link
        href={`/dashboard/projects/${projectId}/tasks/${taskId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <span>←</span>
        Назад к задаче
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-white">Изменить задачу</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-gray-400">Название *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 transition focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-gray-400">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 transition focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-gray-400">Примечания</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 transition focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Статус</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
            >
              <option value="open">Открыта</option>
              <option value="in_progress">В работе</option>
              <option value="done">Выполнена</option>
              <option value="cancelled">Отменена</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Дедлайн</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">Ответственные</label>
          <div className="space-y-2">
            {team.map((member) => (
              <label
                key={member.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white">
                  {member.full_name?.[0] ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{member.full_name ?? 'Без имени'}</p>
                  <p className="text-xs capitalize text-gray-400">{member.role}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Сохраняем...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  )
}
