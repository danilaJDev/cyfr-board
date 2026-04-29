'use client'

import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {Icons} from './Icons'

export default function DeleteTaskButton({
                                             taskId,
                                             projectId,
                                         }: {
    taskId: string
    projectId: string
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (!confirm('Удалить задачу? Это действие нельзя отменить.')) return

        setLoading(true)
        setError('')

        const {error: assigneesError} = await supabase
            .from('task_assignees')
            .delete()
            .eq('task_id', taskId)
        if (assigneesError) {
            setError(assigneesError.message)
            setLoading(false)
            return
        }

        const {error: attachmentsError} = await supabase
            .from('attachments')
            .delete()
            .eq('task_id', taskId)
        if (attachmentsError) {
            setError(attachmentsError.message)
            setLoading(false)
            return
        }

        const {error: taskError} = await supabase.from('tasks').delete().eq('id', taskId)
        if (taskError) {
            setError(taskError.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/projects/${projectId}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn-danger"
            >
                {loading ? (
                    <Icons.Loader className="h-4 w-4 animate-spin"/>
                ) : (
                    <Icons.Trash className="h-4 w-4"/>
                )}
                {loading ? 'Удаляем...' : 'Удалить задачу'}
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    )
}
