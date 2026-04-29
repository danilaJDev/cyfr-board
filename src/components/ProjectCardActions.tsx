'use client'

import Link from 'next/link'
import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {Icons} from './Icons'

const iconBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--app-border)',
    background: 'var(--app-surface)',
    color: 'var(--app-muted)',
    transition: 'all 0.2s',
    backdropFilter: 'blur(8px)',
}

export default function ProjectCardActions({projectId}: { projectId: string }) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Удалить проект и связанные задачи?')) return
        setLoading(true)
        const {data: taskIds} = await supabase.from('tasks').select('id').eq('project_id', projectId)
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
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            <Link
                href={`/dashboard/projects/${projectId}`}
                style={iconBtnBase}
                title="Открыть"
                aria-label="Открыть проект"
                onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--app-accent-ring)'
                    el.style.background = 'var(--app-accent-subtle)'
                    el.style.color = 'var(--app-accent-text)'
                }}
                onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--app-border)'
                    el.style.background = 'var(--app-surface)'
                    el.style.color = 'var(--app-muted)'
                }}
            >
                <Icons.Eye className="h-4 w-4"/>
            </Link>
            <Link
                href={`/dashboard/projects/${projectId}/edit`}
                style={iconBtnBase}
                title="Изменить"
                aria-label="Изменить проект"
                onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--app-border-strong)'
                    el.style.color = 'var(--app-fg)'
                }}
                onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--app-border)'
                    el.style.color = 'var(--app-muted)'
                }}
            >
                <Icons.Edit className="h-4 w-4"/>
            </Link>
            <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{...iconBtnBase, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1}}
                title="Удалить"
                aria-label="Удалить проект"
                onMouseEnter={e => {
                    if (loading) return
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--status-danger-border)'
                    el.style.background = 'var(--status-danger-bg)'
                    el.style.color = 'var(--status-danger-text)'
                }}
                onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--app-border)'
                    el.style.background = 'var(--app-surface)'
                    el.style.color = 'var(--app-muted)'
                }}
            >
                {loading ? (
                    <Icons.Loader className="h-4 w-4 animate-spin"/>
                ) : (
                    <Icons.Trash className="h-4 w-4"/>
                )}
            </button>
        </div>
    )
}
