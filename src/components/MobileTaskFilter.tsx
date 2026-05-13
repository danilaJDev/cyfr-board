'use client'

import {useRouter} from 'next/navigation'
import {Icons} from '@/components/Icons'

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
        <div className="sm:hidden relative">
            <label htmlFor="task-status-filter" className="sr-only">
                Фильтр по статусу
            </label>

            <select
                id="task-status-filter"
                value={currentStatus}
                onChange={(e) => {
                    const value = e.target.value
                    router.push(
                        value === 'all'
                            ? '/dashboard/tasks'
                            : `/dashboard/tasks?status=${value}`
                    )
                }}
                className="input-base w-full appearance-none pr-10"
            >
                {filters.map((f) => (
                    <option key={f.value} value={f.value}>
                        {f.label}
                    </option>
                ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-[10px] flex items-center">
                <Icons.ChevronDown className="h-4 w-4 t-subtle"/>
            </div>
        </div>
    )
}
