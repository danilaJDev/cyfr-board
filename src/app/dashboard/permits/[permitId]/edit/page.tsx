'use client'

import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useParams, useRouter} from 'next/navigation'
import PermitForm, {permitValuesFromRecord, PermitFormValues} from '@/components/PermitForm'

export default function EditPermitPage() {
  const {permitId}=useParams<{permitId:string}>()
  const router=useRouter()
  const supabase=createClient()
  const [loading,setLoading]=useState(false)
  const [fetching,setFetching]=useState(true)
  const [error,setError]=useState('')
  const [initial,setInitial]=useState<PermitFormValues | null>(null)

  useEffect(()=>{(async()=>{const {data,error}=await supabase.from('permits').select('*').eq('id',permitId).single();if(error||!data){setError(error?.message ?? 'Не удалось загрузить');setFetching(false);return;}setInitial(permitValuesFromRecord(data));setFetching(false)})()},[permitId,supabase])
  if(fetching || !initial) return <div className="flex min-h-[40vh] items-center justify-center">Загрузка...</div>

  return <PermitForm title="Изменить разрешение" backHref={`/dashboard/permits/${permitId}`} initialValues={initial} loading={loading} error={error} submitLabel="Сохранить" onSubmit={async(payload)=>{setLoading(true);setError('');const {error}=await supabase.from('permits').update(payload).eq('id',permitId);if(error){setError(error.message);setLoading(false);return;}router.push(`/dashboard/permits/${permitId}`);router.refresh();}}/>
}
