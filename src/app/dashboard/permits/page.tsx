import {createClient} from '@/lib/supabase/server'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import {parsePermitNotes} from '@/lib/permits'

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
}

export default async function PermitsPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    const {data: profile} = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : {data: null}
    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    const {data: projects} = await supabase
        .from('projects')
        .select('id, name, permits(id, permit_type, status, issued_at, expires_at, notes)')
        .order('name', {ascending: true})

    const grouped = (projects ?? []).filter((p) => (p.permits?.length ?? 0) > 0)

    return <div className="animate-in">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
            <div><h1 className="text-2xl font-black tracking-tight t-fg sm:text-3xl">Разрешения</h1><p className="mt-1 text-sm t-muted">Список разрешений по проектам</p></div>
            {isAdmin && <Link href="/dashboard/projects" className="btn-primary self-stretch justify-center py-3 sm:self-auto"><Icons.Plus className="h-4 w-4"/>Новое разрешение</Link>}
        </div>

        {grouped.length ? <div className="space-y-7">{grouped.map((project)=><section key={project.id} className="space-y-3"><div className="px-1 flex items-center justify-between"><h2 className="text-lg font-bold t-fg sm:text-xl">{project.name}</h2><Link href={`/dashboard/projects/${project.id}/permits/new`} className="text-xs t-accent font-semibold">Добавить</Link></div><div className="grid gap-3">{project.permits?.map((permit)=>{const status=permitStatusLabels[permit.status] ?? permitStatusLabels.pending;const meta=parsePermitNotes(permit.notes);return <Link key={permit.id} href={`/dashboard/permits/${permit.id}`} className="glass-card group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5" style={{borderColor:'var(--app-border)'}}><div className="min-w-0 flex-1"><p className="text-base font-bold t-fg">{permit.permit_type}</p><p className="mt-1 text-xs t-muted">{permit.issued_at ? `с ${new Date(permit.issued_at).toLocaleDateString('ru-RU')}` : 'Дата начала не указана'}{permit.expires_at ? ` • до ${new Date(permit.expires_at).toLocaleDateString('ru-RU')}` : ''}</p>{typeof meta.employeeCount === 'number' && <p className="mt-1 text-xs t-muted">Сотрудников: {meta.employeeCount}</p>}{meta.documents?.length ? <p className="mt-1 truncate text-xs t-muted">Файлы: {meta.documents.map((d)=>d.name).join(', ')}</p> : null}</div><div className="flex items-center gap-2"><span className={`chip ${status.chipClass}`}>{status.label}</span><Icons.ArrowRight className="h-4 w-4 t-subtle"/></div></Link>})}</div></section>)}</div> : <div className="section-card text-center py-16">Нет разрешений</div>}
    </div>
}
