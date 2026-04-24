'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Удалить проект и все связанные задачи? Это действие нельзя отменить.')) return

    setLoading(true)
    setError('')

    const { data: taskIds } = await supabase.from('tasks').select('id').eq('project_id', projectId)
    const ids = taskIds?.map((task) => task.id) ?? []

    if (ids.length > 0) {
      const { error: assigneesError } = await supabase.from('task_assignees').delete().in('task_id', ids)
      if (assigneesError) {
        setError(assigneesError.message)
        setLoading(false)
        return
      }

      const { error: attachmentsError } = await supabase.from('attachments').delete().in('task_id', ids)
      if (attachmentsError) {
        setError(attachmentsError.message)
        setLoading(false)
        return
      }

      const { error: tasksError } = await supabase.from('tasks').delete().eq('project_id', projectId)
      if (tasksError) {
        setError(tasksError.message)
        setLoading(false)
        return
      }
    }

    const { error: permitsError } = await supabase.from('permits').delete().eq('project_id', projectId)
    if (permitsError) {
      setError(permitsError.message)
      setLoading(false)
      return
    }

    const { error: projectError } = await supabase.from('projects').delete().eq('id', projectId)
    if (projectError) {
      setError(projectError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/projects')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:opacity-60"
      >
        {loading ? 'Удаляем...' : 'Удалить проект'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
