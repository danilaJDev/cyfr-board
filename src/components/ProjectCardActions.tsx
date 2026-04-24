'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ProjectCardActions({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Удалить проект и связанные задачи?')) return

    setLoading(true)

    const { data: taskIds } = await supabase.from('tasks').select('id').eq('project_id', projectId)
    const ids = taskIds?.map((task) => task.id) ?? []

    if (ids.length > 0) {
      await supabase.from('task_assignees').delete().in('task_id', ids)
      await supabase.from('attachments').delete().in('task_id', ids)
      await supabase.from('tasks').delete().eq('project_id', projectId)
    }

    await supabase.from('permits').delete().eq('project_id', projectId)
    await supabase.from('projects').delete().eq('id', projectId)

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition hover:border-gray-500 hover:text-white"
      >
        Открыть
      </Link>
      <Link
        href={`/dashboard/projects/${projectId}/edit`}
        className="rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs text-blue-300 transition hover:border-blue-400 hover:text-blue-200"
      >
        Изменить
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:opacity-60"
      >
        {loading ? 'Удаляем...' : 'Удалить'}
      </button>
    </div>
  )
}
