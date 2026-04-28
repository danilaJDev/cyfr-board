'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

export default function NewPermitPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        permit_type: '',
        status: 'pending',
        issued_at: '',
        expires_at: '',
        notes: '',
    })

    const setField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('permits').insert({
            project_id: params.id,
            permit_type: form.permit_type,
            status: form.status,
            issued_at: form.issued_at || null,
            expires_at: form.expires_at || null,
            notes: form.notes || null,
            created_by: user?.id,
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/projects/${params.id}`)
        router.refresh()
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link
                    href={`/dashboard/projects/${params.id}`}
                    className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
                >
                    <Icons.ArrowLeft className="h-4 w-4" />
                    Назад к проекту
                </Link>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Новое разрешение
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Зафиксируйте разрешения и сроки действия
                </p>
            </div>

            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="permit_type" className="label-base">
                            Тип разрешения *
                        </label>
                        <input
                            id="permit_type"
                            type="text"
                            required
                            value={form.permit_type}
                            onChange={(e) => setField('permit_type', e.target.value)}
                            className="input-base"
                            placeholder="NOC, DCD approval, DEWA permit..."
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="label-base">
                                Статус
                            </label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(e) => setField('status', e.target.value)}
                                className="input-base"
                            >
                                <option value="pending">В процессе</option>
                                <option value="received">Получено</option>
                                <option value="expired">Истекло</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="issued_at" className="label-base">
                                Дата выдачи
                            </label>
                            <input
                                id="issued_at"
                                type="date"
                                value={form.issued_at}
                                onChange={(e) => setField('issued_at', e.target.value)}
                                className="input-base"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="expires_at" className="label-base">
                            Срок действия
                        </label>
                        <input
                            id="expires_at"
                            type="date"
                            value={form.expires_at}
                            onChange={(e) => setField('expires_at', e.target.value)}
                            className="input-base"
                        />
                    </div>

                    <div>
                        <label htmlFor="notes" className="label-base">
                            Примечания
                        </label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setField('notes', e.target.value)}
                            className="input-base"
                            placeholder="Дополнительная информация..."
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                        >
                            {error}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link
                            href={`/dashboard/projects/${params.id}`}
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
                                    <Icons.Plus className="h-4 w-4" />
                                    Добавить разрешение
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
