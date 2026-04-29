'use client'

import {useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useParams, useRouter} from 'next/navigation'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

type PermitDocument = { name: string; url: string }

const employeeCountPermitTypes = ['Contractor Access Permit ALTERATIONS']

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
        employee_count: '',
    })

    const [documents, setDocuments] = useState<PermitDocument[]>([{name: '', url: ''}])

    const setField = (field: string, value: string) =>
        setForm((prev) => ({...prev, [field]: value}))

    const shouldShowEmployeeCount = employeeCountPermitTypes.includes(form.permit_type)

    const handleDocumentChange = (index: number, field: keyof PermitDocument, value: string) => {
        setDocuments((prev) => prev.map((item, i) => (i === index ? {...item, [field]: value} : item)))
    }

    const addDocumentRow = () => setDocuments((prev) => [...prev, {name: '', url: ''}])

    const serializeNotes = () => {
        const filteredDocs = documents.filter((doc) => doc.name.trim() && doc.url.trim())
        const payload = {
            notes: form.notes.trim() || undefined,
            employeeCount: shouldShowEmployeeCount && form.employee_count ? Number(form.employee_count) : undefined,
            documents: filteredDocs.length ? filteredDocs : undefined,
        }

        if (!payload.notes && !payload.employeeCount && !payload.documents) return null
        return `__PERMIT_META__${JSON.stringify(payload)}`
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        const {error: insertError} = await supabase.from('permits').insert({
            project_id: params.id,
            permit_type: form.permit_type,
            status: form.status,
            issued_at: form.issued_at || null,
            expires_at: form.expires_at || null,
            notes: serializeNotes(),
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
                    className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent"
                >
                    <Icons.ArrowLeft className="h-4 w-4"/>
                    Назад к проекту
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">
                    Новое разрешение
                </h1>
            </div>

            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="permit_type" className="label-base">Тип разрешения *</label>
                        <input id="permit_type" type="text" required value={form.permit_type} onChange={(e) => setField('permit_type', e.target.value)} className="input-base" placeholder="Contractor Access Permit ALTERATIONS"/>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="label-base">Статус</label>
                            <select id="status" value={form.status} onChange={(e) => setField('status', e.target.value)} className="input-base">
                                <option value="pending">В процессе</option>
                                <option value="received">Получено</option>
                                <option value="expired">Истекло</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="issued_at" className="label-base">Дата начала действия</label>
                            <input id="issued_at" type="date" value={form.issued_at} onChange={(e) => setField('issued_at', e.target.value)} className="input-base"/>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="expires_at" className="label-base">Дата окончания действия</label>
                        <input id="expires_at" type="date" value={form.expires_at} onChange={(e) => setField('expires_at', e.target.value)} className="input-base"/>
                    </div>

                    {shouldShowEmployeeCount && (
                        <div>
                            <label htmlFor="employee_count" className="label-base">Количество сотрудников</label>
                            <input id="employee_count" type="number" min={1} value={form.employee_count} onChange={(e) => setField('employee_count', e.target.value)} className="input-base" placeholder="Например, 14"/>
                        </div>
                    )}

                    <div>
                        <label htmlFor="notes" className="label-base">Примечания</label>
                        <textarea id="notes" rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} className="input-base" placeholder="Дополнительная информация..."/>
                    </div>

                    <div className="space-y-3 rounded-xl border p-4" style={{borderColor: 'var(--app-border)'}}>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold t-fg">Документы разрешения</p>
                            <button type="button" onClick={addDocumentRow} className="btn-secondary py-2 text-xs">
                                <Icons.Plus className="h-3.5 w-3.5"/>
                                Добавить файл
                            </button>
                        </div>
                        {documents.map((doc, index) => (
                            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input type="text" value={doc.name} onChange={(e) => handleDocumentChange(index, 'name', e.target.value)} className="input-base" placeholder="Название файла"/>
                                <input type="url" value={doc.url} onChange={(e) => handleDocumentChange(index, 'url', e.target.value)} className="input-base" placeholder="https://...pdf"/>
                            </div>
                        ))}
                    </div>

                    {error && (<p role="alert" className="alert-error">{error}</p>)}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link href={`/dashboard/projects/${params.id}`} className="btn-secondary justify-center">Отмена</Link>
                        <button type="submit" disabled={loading} className="btn-primary justify-center">
                            {loading ? <><Icons.Loader className="h-4 w-4 animate-spin"/>Сохраняем...</> : <><Icons.Plus className="h-4 w-4"/>Добавить разрешение</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
