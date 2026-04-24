'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

    const set = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: form.name,
                type: form.type,
                status: form.status,
                contract_signed_at: form.contract_signed_at || null,
                manager_id: user?.id,
            })
            .select()
            .single()

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push(`/dashboard/projects/${data.id}`)
        }
    }

    return (
        <div className="max-w-xl">
            <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition"
            >
                <ArrowLeft size={16} />
                Назад к проектам
            </Link>

            <h1 className="text-2xl font-bold text-white mb-8">Новый проект</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Название объекта *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        placeholder="Office 1801, VISION TOWER-1, Business Bay"
                        required
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Вид проекта</label>
                    <select
                        value={form.type}
                        onChange={e => set('type', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    >
                        <option value="FITOUT">FITOUT</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Статус</label>
                    <select
                        value={form.status}
                        onChange={e => set('status', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    >
                        <option value="active">Активный</option>
                        <option value="on_hold">На паузе</option>
                        <option value="completed">Завершён</option>
                        <option value="cancelled">Отменён</option>
                    </select>
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Дата подписания договора</label>
                    <input
                        type="date"
                        value={form.contract_signed_at}
                        onChange={e => set('contract_signed_at', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition"
                >
                    {loading ? 'Создаём...' : 'Создать проект'}
                </button>
            </form>
        </div>
    )
}