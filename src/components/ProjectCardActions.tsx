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
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
      <Link
        href={`/dashboard/projects/${projectId}/edit`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        title="Изменить"
      >
        <Icons.File className="h-5 w-5" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
        title="Удалить"
      >
        {loading ? <Icons.X className="h-5 w-5 animate-spin" /> : <Icons.X className="h-5 w-5" />}
      </button>
    </div>
  )
}
