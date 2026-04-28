'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icons } from './Icons'

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
    <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 transition-opacity">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 backdrop-blur-md transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-300"
        title="Открыть"
        aria-label="Открыть проект"
      >
        <Icons.Eye className="h-4 w-4" />
      </Link>
      <Link
        href={`/dashboard/projects/${projectId}/edit`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        title="Изменить"
        aria-label="Изменить проект"
      >
        <Icons.Edit className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 backdrop-blur-md transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
        title="Удалить"
        aria-label="Удалить проект"
      >
        {loading ? (
          <Icons.Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.Trash className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
