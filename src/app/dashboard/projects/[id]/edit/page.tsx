'use client'

import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useParams, useRouter} from 'next/navigation'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

type TeamMember = {
    id: string
    full_name: string | null
    role: string | null
}

export default function EditProjectPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [team, setTeam] = useState<TeamMember[]>([])
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
    const [form, setForm] = useState({name: '', type: 'FITOUT', status: 'active', contract_signed_at: '', contract_number: ''})

    useEffect(() => {
        const loadPage = async () => {
            const [{data: members}, {data, error: fetchError}] = await Promise.all([
                supabase.from('profiles').select('id, full_name, role').order('full_name', {ascending: true}),
                supabase.from('projects').select('name, type, status, contract_signed_at, contract_number, manager_id, project_assignees(user_id)').eq('id', projectId).single(),
            ])

            if (members) setTeam(members as TeamMember[])

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
                contract_number: data.contract_number ?? '',
            })
            const assignees = data.project_assignees?.map((row: { user_id: string }) => row.user_id) ?? []
            setSelectedAssignees(assignees.length > 0 ? assignees : (data.manager_id ? [data.manager_id] : []))
            setFetching(false)
        }

        loadPage()
    }, [projectId, supabase])

    const set = (field: string, value: string) => setForm((prev) => ({...prev, [field]: value}))
    const toggleAssignee = (id: string) => setSelectedAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const {error: updateError} = await supabase.from('projects').update({
            name: form.name.trim(),
            type: form.type,
            status: form.status,
            contract_signed_at: form.contract_signed_at || null,
            contract_number: form.contract_number.trim() || null,
            manager_id: selectedAssignees[0] ?? null,
        }).eq('id', projectId)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        const {error: cleanupError} = await supabase.from('project_assignees').delete().eq('project_id', projectId)
        if (cleanupError) {
            setError(cleanupError.message)
            setLoading(false)
            return
        }

        if (selectedAssignees.length > 0) {
            const {error: insertError} = await supabase.from('project_assignees').insert(selectedAssignees.map((userId) => ({
                project_id: projectId,
                user_id: userId
            })))
            if (insertError) {
                setError(insertError.message)
                setLoading(false)
                return
            }
        }

        router.push(`/dashboard/projects/${projectId}`)
        router.refresh()
    }

    if (fetching) {
        return <div className="flex min-h-[40vh] items-center justify-center"><Icons.Loader
            className="h-8 w-8 animate-spin t-accent"/></div>
    }

    return (
        <div className="mx-auto max-w-2xl animate-in">
            <div className="mb-6 sm:mb-8">
                <Link href={`/dashboard/projects/${projectId}`}
                      className="mb-3 inline-flex items-center gap-2 text-sm t-muted transition hover:t-accent">
                    <Icons.ArrowLeft className="h-4 w-4"/>Назад к проекту
                </Link>
                <h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Изменить проект</h1>
            </div>
            <div className="section-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div><label htmlFor="name" className="label-base">Название проекта *</label><input id="name"
                                                                                                       type="text"
                                                                                                       value={form.name}
                                                                                                       onChange={(e) => set('name', e.target.value)}
                                                                                                       className="input-base"
                                                                                                       required/></div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="relative">
                            <label htmlFor="type" className="label-base">
                                Вид проекта
                            </label>

                            <div className="relative">
                                <select
                                    id="type"
                                    value={form.type}
                                    onChange={(e) => set('type', e.target.value)}
                                    className="input-base w-full appearance-none pr-10"
                                >
                                    <option value="FITOUT">FITOUT</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Technical supervision">Technical supervision</option>
                                    <option value="Other">Other</option>
                                </select>

                                {/* Стрелка */}
                                <div className="pointer-events-none absolute inset-y-0 right-[10px] flex items-center">
                                    <svg
                                        className="h-4 w-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <label htmlFor="status" className="label-base">
                                Статус
                            </label>

                            <div className="relative">
                                <select
                                    id="status"
                                    value={form.status}
                                    onChange={(e) => set('status', e.target.value)}
                                    className="input-base w-full appearance-none pr-10"
                                >
                                    <option value="active">Активный</option>
                                    <option value="on_hold">На паузе</option>
                                    <option value="completed">Завершён</option>
                                    <option value="cancelled">Отменён</option>
                                </select>

                                {/* Стрелка */}
                                <div className="pointer-events-none absolute inset-y-0 right-[10px] flex items-center">
                                    <svg
                                        className="h-4 w-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="contract_number" className="label-base">Номер договора</label>
                            <input id="contract_number" type="text" value={form.contract_number}
                                   onChange={(e) => set('contract_number', e.target.value)}
                                   className="input-base"/>
                        </div>
                        <div><label htmlFor="contract_signed_at" className="label-base">Дата подписания
                            договора</label><input id="contract_signed_at" type="date" value={form.contract_signed_at}
                                                   onChange={(e) => set('contract_signed_at', e.target.value)}
                                                   className="input-base"/></div>
                    </div>

                    <div>
                        <label className="label-base">Ответственные</label>
                        {team.length === 0 ? <p className="rounded-xl border border-dashed px-4 py-3 text-xs t-subtle"
                                                style={{borderColor: 'var(--app-border)'}}>Нет доступных
                            сотрудников</p> : (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {team.map((member) => {
                                    const checked = selectedAssignees.includes(member.id)
                                    return <label key={member.id}
                                                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-[var(--app-accent-ring)] bg-[var(--app-accent-subtle)] ring-2 ring-[var(--app-accent-ring)]' : 'glass-card rounded-xl'}`}>
                                        <input type="checkbox" className="hidden" checked={checked}
                                               onChange={() => toggleAssignee(member.id)}/>
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase text-white"
                                            style={{background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'}}>{member.full_name?.[0] ?? '?'}</div>
                                        <div className="min-w-0 flex-1"><p
                                            className="truncate text-sm font-medium t-fg">{member.full_name ?? 'Без имени'}</p>
                                            <p className="truncate text-xs capitalize t-muted">{member.role}</p></div>
                                        <div
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${checked ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'}`}
                                            aria-hidden>{checked &&
                                            <Icons.Check className="h-3 w-3" style={{color: 'var(--app-bg)'}}/>}</div>
                                    </label>
                                })}
                            </div>
                        )}
                    </div>
                    {error && <div role="alert" className="alert-error">{error}</div>}
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link href={`/dashboard/projects/${projectId}`}
                              className="btn-secondary justify-center">Отмена</Link>
                        <button type="submit" disabled={loading} className="btn-primary justify-center">{loading ? <>
                            <Icons.Loader className="h-4 w-4 animate-spin"/>Сохраняем...</> : <><Icons.Check
                            className="h-4 w-4"/>Сохранить изменения</>}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
