'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import {EMPLOYEE_COUNT_PERMIT_TYPES, PermitDocument, parsePermitNotes, serializePermitNotes} from '@/lib/permits'

export type PermitFormValues = {
    permit_type: string
    status: string
    issued_at: string
    expires_at: string
    notes: string
    employee_count: string
    documents: PermitDocument[]
}

export function permitValuesFromRecord(record: {
    permit_type?: string | null
    status?: string | null
    issued_at?: string | null
    expires_at?: string | null
    notes?: string | null
}): PermitFormValues {
    const meta = parsePermitNotes(record.notes ?? null)
    return {
        permit_type: record.permit_type ?? '',
        status: record.status ?? 'pending',
        issued_at: record.issued_at ? String(record.issued_at).slice(0, 10) : '',
        expires_at: record.expires_at ? String(record.expires_at).slice(0, 10) : '',
        notes: meta.notes ?? '',
        employee_count: meta.employeeCount ? String(meta.employeeCount) : '',
        documents: meta.documents?.length ? meta.documents : [{name: '', url: ''}],
    }
}

export default function PermitForm({
    title, backHref, initialValues, loading, error, submitLabel, onSubmit,
}: {
    title: string
    backHref: string
    initialValues: PermitFormValues
    loading: boolean
    error: string
    submitLabel: string
    onSubmit: (payload: {permit_type: string; status: string; issued_at: string | null; expires_at: string | null; notes: string | null}) => Promise<void>
}) {
    const [form, setForm] = useState(initialValues)
    const setField = (field: keyof PermitFormValues, value: string) => setForm((prev) => ({...prev, [field]: value}))
    const shouldShowEmployeeCount = EMPLOYEE_COUNT_PERMIT_TYPES.includes(form.permit_type)

    const handleDocumentChange = (index: number, field: keyof PermitDocument, value: string) => {
        setForm((prev) => ({...prev, documents: prev.documents.map((item, i) => i === index ? {...item, [field]: value} : item)}))
    }

    const removeDocument = (index: number) => {
        setForm((prev) => ({...prev, documents: prev.documents.filter((_, i) => i !== index)}))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const documents = form.documents.filter((doc) => doc.name.trim() && doc.url.trim())
        const notes = serializePermitNotes({
            notes: form.notes.trim() || undefined,
            employeeCount: shouldShowEmployeeCount && form.employee_count ? Number(form.employee_count) : undefined,
            documents,
        })
        await onSubmit({permit_type: form.permit_type, status: form.status, issued_at: form.issued_at || null, expires_at: form.expires_at || null, notes})
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link href={backHref} className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent">
                    <Icons.ArrowLeft className="h-4 w-4"/>
                    Назад
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">{title}</h1>
                <p className="mt-1 text-sm t-muted">Заполните информацию о разрешении</p>
            </div>
            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="permit_type" className="label-base">Тип разрешения *</label>
                        <input id="permit_type" className="input-base" required value={form.permit_type} onChange={(e) => setField('permit_type', e.target.value)} placeholder="Например: Contractor Access Permit"/>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="permit_status" className="label-base">Статус</label>
                            <div className="relative">
                                <select id="permit_status" className="input-base appearance-none pr-10" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                                    <option value="pending">В процессе</option>
                                    <option value="in_progress">В процессе</option>
                                    <option value="received">Получено</option>
                                    <option value="expired">Истекло</option>
                                </select>
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 t-muted">
                                    <Icons.ChevronDown className="h-4 w-4"/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="issued_at" className="label-base">Дата выдачи</label>
                            <input id="issued_at" type="date" className="input-base" value={form.issued_at} onChange={(e) => setField('issued_at', e.target.value)}/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="expires_at" className="label-base">Дата окончания</label>
                        <input id="expires_at" type="date" className="input-base" value={form.expires_at} onChange={(e) => setField('expires_at', e.target.value)}/>
                    </div>
                    {shouldShowEmployeeCount && (
                        <div>
                            <label htmlFor="employee_count" className="label-base">Количество сотрудников</label>
                            <input id="employee_count" type="number" min={1} className="input-base" value={form.employee_count} onChange={(e) => setField('employee_count', e.target.value)} placeholder="Например: 5"/>
                        </div>
                    )}
                    <div>
                        <label htmlFor="permit_notes" className="label-base">Примечания</label>
                        <textarea id="permit_notes" rows={3} className="input-base" value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Дополнительная информация..."/>
                    </div>
                    <div className="space-y-4 rounded-2xl border p-4" style={{borderColor: 'var(--app-border)', background: 'var(--app-surface-2)'}}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icons.Paperclip className="h-4 w-4 t-muted"/>
                                <p className="text-sm font-semibold t-fg">Документы</p>
                            </div>
                            <button type="button" className="btn-secondary py-1.5 text-xs" onClick={() => setForm((prev) => ({...prev, documents: [...prev.documents, {name: '', url: ''}]}))}>
                                <Icons.Plus className="h-3.5 w-3.5"/>Добавить
                            </button>
                        </div>
                        {form.documents.length === 0 && <p className="text-xs t-subtle">Нет прикреплённых документов</p>}
                        {form.documents.map((doc, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                                    <input className="input-base" value={doc.name} onChange={(e) => handleDocumentChange(index, 'name', e.target.value)} placeholder="Название документа" aria-label="Название документа"/>
                                    <input className="input-base" value={doc.url} onChange={(e) => handleDocumentChange(index, 'url', e.target.value)} placeholder="https://..." aria-label="Ссылка на документ"/>
                                </div>
                                <button type="button" onClick={() => removeDocument(index)} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200" style={{background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger-text)'}} aria-label="Удалить документ">
                                    <Icons.X className="h-4 w-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    {error && <div role="alert" className="alert-error">{error}</div>}
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link href={backHref} className="btn-secondary justify-center">Отмена</Link>
                        <button disabled={loading} className="btn-primary justify-center">
                            {loading ? <><Icons.Loader className="h-4 w-4 animate-spin"/>Сохраняем...</> : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
