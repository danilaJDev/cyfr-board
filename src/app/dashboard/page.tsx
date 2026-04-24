import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    const [{ count: projectsCount }, { count: tasksCount }, { count: openTasksCount }] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ])

    const stats = [
        { label: 'Всего проектов',  value: projectsCount ?? 0, color: 'text-blue-400' },
        { label: 'Всего задач',     value: tasksCount ?? 0,    color: 'text-purple-400' },
        { label: 'Открытых задач',  value: openTasksCount ?? 0, color: 'text-amber-400' },
    ]

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">Дашборд</h1>
            <p className="text-gray-400 mb-8">Добро пожаловать в CYFR FITOUT</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {stats.map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <p className="text-gray-400 text-sm mb-1">{label}</p>
                        <p className={`text-4xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}