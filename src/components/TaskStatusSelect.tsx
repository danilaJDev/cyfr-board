'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const options = [
    { value: 'open',        label: 'Открыта',   color: 'text-blue-400' },
    { value: 'in_progress', label: 'В работе',  color: 'text-purple-400' },
    { value: 'done',        label: 'Выполнена', color: 'text-green-400' },
    { value: 'cancelled',   label: 'Отменена',  color: 'text-red-400' },
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
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
        setLoading(false)
        router.refresh()
    }

    const current = options.find(o => o.value === status)

    return (
        <select
            value={status}
            onChange={e => handleChange(e.target.value)}
            disabled={loading}
            className={`bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 transition shrink-0 ${current?.color}`}
        >
            {options.map(o => (
                <option key={o.value} value={o.value} className="text-white">
                    {o.label}
                </option>
            ))}
        </select>
    )
}