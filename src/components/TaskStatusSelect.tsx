'use client'

import {useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'
import {Icons} from './Icons'

const options = [
    {value: 'in_progress', label: 'В работе'},
    {value: 'done', label: 'Выполнена'},
    {value: 'cancelled', label: 'Отменена'},
]

export default function TaskStatusSelect({
                                             taskId,
                                             currentStatus,
                                         }: {
    taskId: string
    currentStatus: string
}) {
    const [status, setStatus] = useState(currentStatus)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleChange = async (newStatus: string) => {
        setLoading(true)
        setStatus(newStatus)
        await supabase.from('tasks').update({status: newStatus}).eq('id', taskId)
        setLoading(false)
        router.refresh()
    }

    return (
        <div className="relative">
            <select
                value={status}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                aria-label="Изменить статус задачи"
                className="input-base appearance-none pr-10 py-2.5 font-semibold"
                style={{minWidth: '140px'}}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <div
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 t-muted"
            >
                {loading ? (
                    <Icons.Loader className="h-4 w-4 animate-spin"/>
                ) : (
                    <Icons.ChevronDown className="h-4 w-4"/>
                )}
            </div>
        </div>
    )
}
