'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Icons } from './Icons'

const options = [
    { value: 'open', label: 'Открыта', color: 'text-blue-300' },
    { value: 'in_progress', label: 'В работе', color: 'text-cyan-300' },
    { value: 'done', label: 'Выполнена', color: 'text-emerald-300' },
    { value: 'cancelled', label: 'Отменена', color: 'text-slate-300' },
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

    const current = options.find((o) => o.value === status)

    return (
        <div className="relative">
            <select
                value={status}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                aria-label="Изменить статус задачи"
                className={`appearance-none rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 pr-10 text-sm font-semibold transition outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 ${
                    current?.color ?? 'text-white'
                }`}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value} className="text-white">
                        {o.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {loading ? (
                    <Icons.Loader className="h-4 w-4 animate-spin" />
                ) : (
                    <Icons.ChevronDown className="h-4 w-4" />
                )}
            </div>
        </div>
    )
}
