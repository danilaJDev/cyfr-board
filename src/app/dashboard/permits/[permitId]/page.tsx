import {createClient} from '@/lib/supabase/server'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import {Icons} from '@/components/Icons'
import {parsePermitNotes} from '@/lib/permits'

const permitStatusLabels: Record<string, { label: string; chipClass: string }> = {
    received: {label: 'Получено', chipClass: 'status-success'},
    expired: {label: 'Истекло', chipClass: 'status-danger'},
    in_progress: {label: 'В процессе', chipClass: 'status-warning'},
    pending: {label: 'В процессе', chipClass: 'status-warning'},
}

export default async function PermitPage({params}: {params: Promise<{permitId:string}>}) {
  const {permitId}=await params
  const supabase = await createClient()
  const {data: permit} = await supabase.from('permits').select('*, project:projects(id,name)').eq('id', permitId).single()
  if(!permit) notFound()
  const meta=parsePermitNotes(permit.notes)
  const status = permitStatusLabels[permit.status] ?? permitStatusLabels.pending
  return <div className="animate-in">
    <Link href="/dashboard/permits" className="mb-5 inline-flex items-center gap-2 text-sm t-muted"><Icons.ArrowLeft className="h-4 w-4"/>Назад к разрешениям</Link>
    <div className="mb-6 flex items-start justify-between"><div><h1 className="text-2xl font-black t-fg sm:text-3xl">{permit.permit_type}</h1><p className="t-muted mt-1">{permit.project?.name}</p></div><Link href={`/dashboard/permits/${permit.id}/edit`} className="btn-secondary"><Icons.Edit className="h-4 w-4"/>Изменить</Link></div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="section-card lg:col-span-2 space-y-4"><span className={`chip ${status.chipClass}`}>{status.label}</span>{meta.notes && <p className="text-sm t-muted whitespace-pre-wrap">{meta.notes}</p>}
    {!!meta.documents?.length && <div className="grid gap-2 sm:grid-cols-2">{meta.documents.map((doc)=><a key={doc.url} href={doc.url} target="_blank" rel="noreferrer" className="glass-card rounded-xl px-3 py-2.5 flex items-center justify-between"><span className="truncate text-sm t-fg">{doc.name}</span><Icons.Eye className="h-4 w-4"/></a>)}</div>}</div>
    <div className="section-card"><h3 className="font-bold mb-3">Детали</h3><div className="space-y-2 text-sm t-muted"><p>Начало: {permit.issued_at ? new Date(permit.issued_at).toLocaleDateString('ru-RU') : '—'}</p><p>Окончание: {permit.expires_at ? new Date(permit.expires_at).toLocaleDateString('ru-RU') : '—'}</p><p>Сотрудников: {meta.employeeCount ?? '—'}</p></div></div></div>
  </div>
}
