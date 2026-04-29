'use client'

import {useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'

const options = [
    {value: 'open', label: 'Открыта'},
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
                className="btn-secondary py-2.5 w-full appearance-none pr-10"
                style={{minWidth: '140px'}}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>

            {/* Стрелка */}
            <div className="pointer-events-none absolute inset-y-0 right-[10px] flex items-center">
                <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
        </div>
    )
}
