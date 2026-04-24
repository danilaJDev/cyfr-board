'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
          contract_signed_at: data.contract_signed_at ? String(data.contract_signed_at).slice(0, 10) : '',
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
    return <p className="text-sm text-gray-400">Загрузка проекта...</p>
  }

  return (
    <div className="max-w-xl">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <span>←</span>
        Назад к проекту
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-white">Изменить проект</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-gray-400">Название объекта *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 transition focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-gray-400">Вид проекта</label>
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
          <label className="mb-1.5 block text-sm text-gray-400">Статус</label>
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
          <label className="mb-1.5 block text-sm text-gray-400">Дата подписания договора</label>
          <input
            type="date"
            value={form.contract_signed_at}
            onChange={(e) => set('contract_signed_at', e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Сохраняем...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  )
}
