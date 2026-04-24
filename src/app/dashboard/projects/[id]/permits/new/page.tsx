'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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

  const setField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

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
    <div className="max-w-xl">
      <Link href={`/dashboard/projects/${params.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400">
        ← Назад к проекту
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-white">Новое разрешение</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Тип разрешения</label>
          <input
            type="text"
            required
            value={form.permit_type}
            onChange={(e) => setField('permit_type', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            placeholder="NOC, DCD approval, DEWA permit..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Статус</label>
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="pending">В процессе</option>
              <option value="received">Получено</option>
              <option value="expired">Истекло</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Дата выдачи</label>
            <input
              type="date"
              value={form.issued_at}
              onChange={(e) => setField('issued_at', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Срок действия</label>
          <input
            type="date"
            value={form.expires_at}
            onChange={(e) => setField('expires_at', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Примечания</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />
        </div>

        {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {loading ? 'Сохраняем...' : 'Добавить разрешение'}
        </button>
      </form>
    </div>
  )
}
