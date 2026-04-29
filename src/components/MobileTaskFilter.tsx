'use client'

import {useRouter} from 'next/navigation'

type Filter = { value: string; label: string }

export default function MobileTaskFilter({
    filters,
    currentStatus,
}: {
    filters: Filter[]
    currentStatus: string
}) {
    const router = useRouter()

    return (
        <div className="sm:hidden">
            <label htmlFor="task-status-filter" className="sr-only">Фильтр по статусу</label>
            <select
                id="task-status-filter"
                value={currentStatus}
                onChange={(e) => {
                    const value = e.target.value
                    router.push(value === 'all' ? '/dashboard/tasks' : `/dashboard/tasks?status=${value}`)
                }}
                className="input-base w-full"
            >
                {filters.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                ))}
            </select>
        </div>
    )
}
