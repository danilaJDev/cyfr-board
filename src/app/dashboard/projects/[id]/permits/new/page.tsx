'use client'

import {useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useParams, useRouter} from 'next/navigation'
import PermitForm, {permitValuesFromRecord} from '@/components/PermitForm'

export default function NewPermitPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    return (
        <PermitForm
            title="Новое разрешение"
            backHref={`/dashboard/projects/${params.id}`}
            initialValues={permitValuesFromRecord({})}
            loading={loading}
            error={error}
            submitLabel="Добавить разрешение"
            onSubmit={async (payload) => {
                setLoading(true)
                setError('')
                const supabase = createClient()
                const {data: {user}} = await supabase.auth.getUser()
                const {error: insertError} = await supabase.from('permits').insert({project_id: params.id, created_by: user?.id, ...payload})
                if (insertError) {
                    setError(insertError.message)
                    setLoading(false)
                    return
                }
                router.push(`/dashboard/projects/${params.id}`)
                router.refresh()
            }}
        />
    )
}
