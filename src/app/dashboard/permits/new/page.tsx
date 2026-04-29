'use client'

import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import {EMPLOYEE_COUNT_PERMIT_TYPES, PermitDocument, parsePermitNotes, serializePermitNotes} from '@/lib/permits'

type Project = { id: string; name: string; status: string }

const permitStatusOptions = [
    {value: 'pending', label: 'В процессе'},
    {value: 'in_progress', label: 'В процессе (активно)'},
    {value: 'received', label: 'Получено'},
    {value: 'expired', label: 'Истекло'},
]

export default function NewPermitPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [projects, setProjects] = useState<Project[]>([])

    const [form, setForm] = useState({
        project_id: '',
        permit_type: '',
        status: 'pending',
        issued_at: '',
        expires_at: '',
        notes: '',
        employee_count: '',
        documents: [{name: '', url: ''}] as PermitDocument[],
    })

    useEffect(() => {
        supabase
            .from('projects')
            .select('id, name, status')
            .in('status', ['active', 'on_hold'])
            .order('name', {ascending: true})
            .then(({data}) => {
                if (data) setProjects(data as Project[])
            })
    }, [supabase])

    const setField = (field: string, value: string) =>
        setForm((prev) => ({...prev, [field]: value}))

    const shouldShowEmployeeCount = EMPLOYEE_COUNT_PERMIT_TYPES.includes(form.permit_type)

    const handleDocumentChange = (index: number, field: keyof PermitDocument, value: string) => {
        setForm((prev) => ({
            ...prev,
            documents: prev.documents.map((item, i) => i === index ? {...item, [field]: value} : item),
        }))
    }

    const removeDocument = (index: number) => {
        setForm((prev) => ({...prev, documents: prev.documents.filter((_, i) => i !== index)}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.project_id) {
            setError('Выберите проект')
            return
        }
        setLoading(true)
        setError('')

        const {data: {user}} = await supabase.auth.getUser()
        const documents = form.documents.filter((doc) => doc.name.trim() && doc.url.trim())
        const notes = serializePermitNotes({
            notes: form.notes.trim() || undefined,
            employeeCount: shouldShowEmployeeCount && form.employee_count ? Number(form.employee_count) : undefined,
            documents,
        })

        const {data: permit, error: insertError} = await supabase
            .from('permits')
            .insert({
                project_id: form.project_id,
                permit_type: form.permit_type,
                status: form.status,
                issued_at: form.issued_at || null,
                expires_at: form.expires_at || null,
                notes,
                created_by: user?.id,
            })
            .select()
            .single()

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/permits/${permit.id}`)
        router.refresh()
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link
                    href="/dashboard/permits"
                    className="mb-4 inline-flex items-center gap-1.5 text-sm t-muted transition-opacity hover:opacity-75"
                >
                    <Icons.ArrowLeft className="h-4 w-4"/>
                    Назад к разрешениям
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Новое разрешение</h1>
                <p className="mt-1 text-sm t-muted">Выберите проект и заполните данные разрешения</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project selector */}
                <div className="section-card">
                    <h2 className="mb-4 text-sm font-bold t-fg">Проект</h2>
                    {projects.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-6 text-center text-sm t-subtle"
                             style={{borderColor: 'var(--app-border)'}}>
                            Нет активных проектов
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {projects.map((project) => {
                                const active = form.project_id === project.id
                                return (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => setField('project_id', project.id)}
                                        className="flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150"
                                        style={{
                                            borderColor: active ? 'var(--app-accent)' : 'var(--app-border)',
                                            background: active ? 'var(--app-accent-subtle)' : 'var(--app-surface-2)',
                                            boxShadow: active ? '0 0 0 2px var(--app-accent-ring)' : 'none',
                                        }}
                                    >
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                            style={{
                                                background: active ? 'var(--app-accent)' : 'var(--app-surface)',
                                                color: active ? 'var(--app-accent-fg)' : 'var(--app-subtle)',
                                            }}
                                        >
                                            <Icons.Projects className="h-4 w-4"/>
                                        </div>
                                        <span
                                            className="min-w-0 flex-1 truncate text-sm font-medium"
                                            style={{color: active ? 'var(--app-accent-text)' : 'var(--app-fg)'}}
                                        >
                                            {project.name}
                                        </span>
                                        {active && <Icons.Check className="h-4 w-4 shrink-0 t-accent"/>}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Permit details */}
                <div className="section-card space-y-5">
                    <h2 className="text-sm font-bold t-fg">Данные разрешения</h2>

                    <div>
                        <label htmlFor="permit_type" className="label-base">Название разрешения *</label>
                        <input
                            id="permit_type"
                            className="input-base"
                            required
                            value={form.permit_type}
                            onChange={(e) => setField('permit_type', e.target.value)}
                            placeholder="Например: Contractor Access Permit"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="permit_status" className="label-base">Статус</label>
                            <div className="relative">
                                <select
                                    id="permit_status"
                                    className="input-base appearance-none pr-10"
                                    value={form.status}
                                    onChange={(e) => setField('status', e.target.value)}
                                >
                                    {permitStatusOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 t-muted">
                                    <Icons.ChevronDown className="h-4 w-4"/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="issued_at" className="label-base">Дата выдачи</label>
                            <input
                                id="issued_at"
                                type="date"
                                className="input-base"
                                value={form.issued_at}
                                onChange={(e) => setField('issued_at', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="expires_at" className="label-base">Дата окончания</label>
                        <input
                            id="expires_at"
                            type="date"
                            className="input-base"
                            value={form.expires_at}
                            onChange={(e) => setField('expires_at', e.target.value)}
                        />
                    </div>

                    {shouldShowEmployeeCount && (
                        <div>
                            <label htmlFor="employee_count" className="label-base">Количество сотрудников</label>
                            <input
                                id="employee_count"
                                type="number"
                                min={1}
                                className="input-base"
                                value={form.employee_count}
                                onChange={(e) => setField('employee_count', e.target.value)}
                                placeholder="Например: 5"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="permit_notes" className="label-base">Примечания</label>
                        <textarea
                            id="permit_notes"
                            rows={3}
                            className="input-base"
                            value={form.notes}
                            onChange={(e) => setField('notes', e.target.value)}
                            placeholder="Дополнительная информация..."
                        />
                    </div>
                </div>

                {/* Documents */}
                <div className="section-card space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icons.Paperclip className="h-4 w-4 t-muted"/>
                            <h2 className="text-sm font-bold t-fg">Документы</h2>
                        </div>
                        <button
                            type="button"
                            className="btn-secondary py-1.5 text-xs"
                            onClick={() =>
                                setForm((prev) => ({...prev, documents: [...prev.documents, {name: '', url: ''}]}))
                            }
                        >
                            <Icons.Plus className="h-3.5 w-3.5"/>Добавить
                        </button>
                    </div>
                    {form.documents.length === 0 && (
                        <p className="text-xs t-subtle">Нет прикреплённых документов</p>
                    )}
                    {form.documents.map((doc, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                    className="input-base"
                                    value={doc.name}
                                    onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                                    placeholder="Название документа"
                                    aria-label="Название документа"
                                />
                                <input
                                    className="input-base"
                                    value={doc.url}
                                    onChange={(e) => handleDocumentChange(index, 'url', e.target.value)}
                                    placeholder="https://..."
                                    aria-label="Ссылка на документ"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
                                style={{
                                    background: 'var(--status-danger-bg)',
                                    border: '1px solid var(--status-danger-border)',
                                    color: 'var(--status-danger-text)',
                                }}
                                aria-label="Удалить документ"
                            >
                                <Icons.X className="h-4 w-4"/>
                            </button>
                        </div>
                    ))}
                </div>

                {error && <div role="alert" className="alert-error">{error}</div>}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link href="/dashboard/permits" className="btn-secondary justify-center">
                        Отмена
                    </Link>
                    <button type="submit" disabled={loading} className="btn-primary justify-center">
                        {loading ? (
                            <><Icons.Loader className="h-4 w-4 animate-spin"/>Сохраняем...</>
                        ) : (
                            <><Icons.Plus className="h-4 w-4"/>Добавить разрешение</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
