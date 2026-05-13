'use client'

import {useMemo, useState} from 'react'
import type {CSSProperties} from 'react'
import Link from 'next/link'
import {Icons} from '@/components/Icons'

export type ProjectListItem = {
    id: string
    name: string
    status: string
    type?: string | null
    created_at?: string | null
    manager?: string | null
    assignees: string[]
    taskCount: number
}

const statusLabels: Record<string, { label: string; chipClass: string }> = {
    active: {label: 'Активный', chipClass: 'status-success'},
    completed: {label: 'Завершён', chipClass: 'status-info'},
    on_hold: {label: 'На паузе', chipClass: 'status-warning'},
    cancelled: {label: 'Отменён', chipClass: 'status-danger'},
}

const typeLabels: Record<string, string> = {
    FITOUT: 'Fitout',
    Maintenance: 'Maintenance',
    Other: 'Other',
}

const statusFilters = [
    {value: 'all', label: 'Все'},
    {value: 'active', label: 'Активные'},
    {value: 'on_hold', label: 'Пауза'},
    {value: 'completed', label: 'Завершённые'},
]

export default function ProjectsExplorer({
    projects,
    isAdmin,
}: {
    projects: ProjectListItem[]
    isAdmin: boolean
}) {
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState('all')
    const [type, setType] = useState('all')

    const availableTypes = useMemo(
        () => Array.from(new Set(projects.map((project) => project.type).filter(Boolean))) as string[],
        [projects],
    )

    const filteredProjects = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        return projects.filter((project) => {
            const matchesStatus = status === 'all' || project.status === status
            const matchesType = type === 'all' || project.type === type
            const searchable = [
                project.name,
                project.manager ?? '',
                ...project.assignees,
            ].join(' ').toLowerCase()

            return matchesStatus && matchesType && (!normalizedQuery || searchable.includes(normalizedQuery))
        })
    }, [projects, query, status, type])

    if (!projects.length) {
        return (
            <div className="section-card flex flex-col items-center justify-center py-16 text-center sm:py-24">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full t-subtle" style={{background: 'var(--app-surface-2)'}}>
                    <Icons.Projects className="h-8 w-8"/>
                </div>
                <p className="mb-1 text-base font-bold t-fg sm:text-lg">Проектов пока нет</p>
                <p className="text-sm t-subtle">Создайте первый объект, чтобы начать работу</p>
                {isAdmin && (
                    <Link href="/dashboard/projects/new" className="btn-primary mt-6">
                        <Icons.Plus className="h-4 w-4"/>
                        Создать проект
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="section-card space-y-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                    <label className="relative block">
                        <span className="sr-only">Поиск проектов</span>
                        <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 t-subtle"/>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="input-base pl-10"
                            placeholder="Поиск по проекту или ответственному"
                        />
                    </label>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {statusFilters.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setStatus(item.value)}
                                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${status === item.value ? 'status-accent' : ''}`}
                                style={status === item.value ? undefined : {background: 'var(--app-surface-2)', color: 'var(--app-muted)', border: '1px solid var(--app-border)'}}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <label className="relative block min-w-44">
                        <span className="sr-only">Тип проекта</span>
                        <select value={type} onChange={(event) => setType(event.target.value)} className="input-base appearance-none py-2.5 pr-10">
                            <option value="all">Все типы</option>
                            {availableTypes.map((value) => (
                                <option key={value} value={value}>{typeLabels[value] ?? value}</option>
                            ))}
                        </select>
                        <Icons.ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 t-subtle"/>
                    </label>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="chip status-neutral">{filteredProjects.length} показано</span>
                    <span className="chip status-success">{projects.filter((project) => project.status === 'active').length} активных</span>
                    <span className="chip status-warning">{projects.filter((project) => project.status === 'on_hold').length} на паузе</span>
                </div>
            </div>

            {filteredProjects.length ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index}/>
                    ))}
                </div>
            ) : (
                <div className="section-card flex flex-col items-center justify-center py-14 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full t-subtle" style={{background: 'var(--app-surface-2)'}}>
                        <Icons.Search className="h-7 w-7"/>
                    </div>
                    <p className="text-base font-bold t-fg">Ничего не найдено</p>
                    <p className="mt-1 text-sm t-subtle">Измените поиск или фильтры</p>
                </div>
            )}
        </div>
    )
}

function ProjectCard({project, index}: {project: ProjectListItem; index: number}) {
    const status = statusLabels[project.status] ?? statusLabels.active
    const previewAssignees = project.assignees.slice(0, 2)
    const moreAssigneesCount = Math.max(project.assignees.length - previewAssignees.length, 0)

    return (
        <Link
            href={`/dashboard/projects/${project.id}`}
            className="group glass-card animate-in relative block rounded-lg border p-5 transition-all hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] sm:p-6"
            style={{'--index': index, borderColor: 'var(--app-border)'} as CSSProperties}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <span className={`chip shrink-0 ${status.chipClass}`}>{status.label}</span>
                <span className="chip status-accent shrink-0 uppercase">{typeLabels[project.type ?? ''] ?? project.type ?? '-'}</span>
            </div>

            <h3 className="mb-5 line-clamp-2 text-lg font-bold leading-tight t-fg transition-colors group-hover:t-accent sm:text-[1.2rem]">
                {project.name}
            </h3>

            <div className="space-y-3 border-t pt-4 text-sm" style={{borderColor: 'var(--app-border)'}}>
                <div className="flex items-start justify-between gap-3">
                    <span className="mt-1 flex items-center gap-2 t-muted">
                        <Icons.User className="h-4 w-4"/>
                        Ответственные
                    </span>

                    {previewAssignees.length ? (
                        <div className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
                            {previewAssignees.map((name) => (
                                <span key={name} className="rounded-full px-2.5 py-1 text-xs font-medium t-fg" style={{background: 'var(--app-surface-2)'}}>
                                    {name}
                                </span>
                            ))}
                            {moreAssigneesCount > 0 && (
                                <span className="rounded-full px-2.5 py-1 text-xs font-semibold t-accent" style={{background: 'var(--app-accent-subtle)'}}>
                                    +{moreAssigneesCount}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="max-w-[60%] truncate text-right font-medium t-fg">{project.manager ?? '-'}</span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 t-muted">
                        <Icons.TaskCheck className="h-4 w-4"/>
                        Задачи
                    </span>

                    <span className="rounded-full px-2.5 py-1 text-sm font-bold t-accent" style={{background: 'var(--app-accent-subtle)'}}>
                        {project.taskCount}
                    </span>
                </div>
            </div>
        </Link>
    )
}
