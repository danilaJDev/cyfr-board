'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

export default function EditProjectPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '',
        type: 'FITOUT',
        status: 'active',
        contract_signed_at: '',
    })

    useEffect(() => {
        supabase
            .from('projects')
            .select('name, type, status, contract_signed_at')
            .eq('id', projectId)
            .single()
            .then(({ data, error: fetchError }) => {
                if (fetchError || !data) {
                    setError(fetchError?.message ?? 'Не удалось загрузить проект')
                    setFetching(false)
                    return
                }

                setForm({
                    name: data.name ?? '',
                    type: data.type ?? 'FITOUT',
                    status: data.status ?? 'active',
                    contract_signed_at: data.contract_signed_at
                        ? String(data.contract_signed_at).slice(0, 10)
                        : '',
                })
                setFetching(false)
            })
    }, [projectId, supabase])

    const set = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error: updateError } = await supabase
            .from('projects')
            .update({
                name: form.name.trim(),
                type: form.type,
                status: form.status,
                contract_signed_at: form.contract_signed_at || null,
            })
            .eq('id', projectId)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/projects/${projectId}`)
        router.refresh()
    }

    if (fetching) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Icons.Loader className="h-8 w-8 animate-spin t-accent" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link
                    href={`/dashboard/projects/${projectId}`}
                    className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent"
                >
                    <Icons.ArrowLeft className="h-4 w-4" />
                    Назад к проекту
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">
                    Изменить проект
                </h1>
            </div>

            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="label-base">
                            Название объекта *
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            className="input-base"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="type" className="label-base">
                                Вид проекта
                            </label>
                            <select
                                id="type"
                                value={form.type}
                                onChange={(e) => set('type', e.target.value)}
                                className="input-base"
                            >
                                <option value="FITOUT">FITOUT</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="status" className="label-base">
                                Статус
                            </label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(e) => set('status', e.target.value)}
                                className="input-base"
                            >
                                <option value="active">Активный</option>
                                <option value="on_hold">На паузе</option>
                                <option value="completed">Завершён</option>
                                <option value="cancelled">Отменён</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="contract_signed_at" className="label-base">
                            Дата подписания договора
                        </label>
                        <input
                            id="contract_signed_at"
                            type="date"
                            value={form.contract_signed_at}
                            onChange={(e) => set('contract_signed_at', e.target.value)}
                            className="input-base"
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="alert-error"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link
                            href={`/dashboard/projects/${projectId}`}
                            className="btn-secondary justify-center"
                        >
                            Отмена
                        </Link>
                        <button type="submit" disabled={loading} className="btn-primary justify-center">
                            {loading ? (
                                <>
                                    <Icons.Loader className="h-4 w-4 animate-spin" />
                                    Сохраняем...
                                </>
                            ) : (
                                <>
                                    <Icons.Check className="h-4 w-4" />
                                    Сохранить изменения
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
