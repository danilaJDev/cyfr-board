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
    title,
    backHref,
    initialValues,
    loading,
    error,
    submitLabel,
    onSubmit,
}: {
    title: string
    backHref: string
    initialValues: PermitFormValues
    loading: boolean
    error: string
    submitLabel: string
    onSubmit: (payload: { permit_type: string; status: string; issued_at: string | null; expires_at: string | null; notes: string | null }) => Promise<void>
}) {
    const [form, setForm] = useState(initialValues)
    const setField = (field: keyof PermitFormValues, value: string) => setForm((prev) => ({...prev, [field]: value}))
    const shouldShowEmployeeCount = EMPLOYEE_COUNT_PERMIT_TYPES.includes(form.permit_type)

    const handleDocumentChange = (index: number, field: keyof PermitDocument, value: string) => {
        setForm((prev) => ({
            ...prev,
            documents: prev.documents.map((item, i) => (i === index ? {...item, [field]: value} : item)),
        }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const documents = form.documents.filter((doc) => doc.name.trim() && doc.url.trim())
        const notes = serializePermitNotes({
            notes: form.notes.trim() || undefined,
            employeeCount: shouldShowEmployeeCount && form.employee_count ? Number(form.employee_count) : undefined,
            documents,
        })

        await onSubmit({
            permit_type: form.permit_type,
            status: form.status,
            issued_at: form.issued_at || null,
            expires_at: form.expires_at || null,
            notes,
        })
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link href={backHref} className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent">
                    <Icons.ArrowLeft className="h-4 w-4"/>Назад
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">{title}</h1>
            </div>
            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input className="input-base" required value={form.permit_type} onChange={(e) => setField('permit_type', e.target.value)} placeholder="Тип разрешения"/>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <select className="input-base" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                            <option value="pending">В процессе</option><option value="received">Получено</option><option value="expired">Истекло</option>
                        </select>
                        <input type="date" className="input-base" value={form.issued_at} onChange={(e) => setField('issued_at', e.target.value)}/>
                    </div>
                    <input type="date" className="input-base" value={form.expires_at} onChange={(e) => setField('expires_at', e.target.value)}/>
                    {shouldShowEmployeeCount && <input type="number" min={1} className="input-base" value={form.employee_count} onChange={(e) => setField('employee_count', e.target.value)} placeholder="Количество сотрудников"/>}
                    <textarea rows={3} className="input-base" value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Примечания"/>
                    <div className="space-y-3 rounded-xl border p-4" style={{borderColor: 'var(--app-border)'}}>
                        <div className="flex items-center justify-between"><p className="text-sm font-semibold t-fg">Документы</p><button type="button" className="btn-secondary py-2 text-xs" onClick={() => setForm((prev) => ({...prev, documents: [...prev.documents, {name: '', url: ''}]}))}><Icons.Plus className="h-3.5 w-3.5"/>Добавить</button></div>
                        {form.documents.map((doc, index) => <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-2"><input className="input-base" value={doc.name} onChange={(e)=>handleDocumentChange(index,'name',e.target.value)} placeholder="Название"/><input className="input-base" value={doc.url} onChange={(e)=>handleDocumentChange(index,'url',e.target.value)} placeholder="https://..."/></div>)}
                    </div>
                    {error && <p className="alert-error">{error}</p>}
                    <div className="flex justify-end"><button disabled={loading} className="btn-primary">{loading ? <><Icons.Loader className="h-4 w-4 animate-spin"/>Сохраняем...</> : submitLabel}</button></div>
                </form>
            </div>
        </div>
    )
}
