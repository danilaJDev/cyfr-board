'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        name: '',
        type: 'FITOUT',
        status: 'active',
        contract_signed_at: '',
    })

    const set = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        setError('')

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            setError('Сессия не найдена. Пожалуйста, войдите заново.')
            setLoading(false)
            router.push('/auth/login')
            return
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: form.name.trim(),
                type: form.type,
                status: form.status,
                contract_signed_at: form.contract_signed_at || null,

                // creator должен быть обязательно, потому что projects.created_by NOT NULL
                created_by: user.id,

                // временно делаем текущего пользователя менеджером проекта
                manager_id: user.id,
            })
            .select('id')
            .single()

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/projects/${data.id}`)
        router.refresh()
    }

    return (
        <div className="max-w-xl">
            <Link
                href="/dashboard/projects"
                className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
            >
                <span>←</span>
                Назад к проектам
            </Link>

            <h1 className="mb-8 text-2xl font-bold text-white">Новый проект</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                        Название объекта *
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 transition focus:border-blue-500 focus:outline-none"
                        placeholder="Office 1801, VISION TOWER-1, Business Bay"
                        required
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                        Вид проекта
                    </label>
                    <select
                        value={form.type}
                        onChange={(e) => set('type', e.target.value)}
                        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
                    >
                        <option value="FITOUT">FITOUT</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                        Статус
                    </label>
                    <select
                        value={form.status}
                        onChange={(e) => set('status', e.target.value)}
                        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
                    >
                        <option value="active">Активный</option>
                        <option value="on_hold">На паузе</option>
                        <option value="completed">Завершён</option>
                        <option value="cancelled">Отменён</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                        Дата подписания договора
                    </label>
                    <input
                        type="date"
                        value={form.contract_signed_at}
                        onChange={(e) => set('contract_signed_at', e.target.value)}
                        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Создаём...' : 'Создать проект'}
                </button>
            </form>
        </div>
    )
}