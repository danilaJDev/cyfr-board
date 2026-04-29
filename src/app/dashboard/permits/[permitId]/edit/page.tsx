'use client'

import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useParams, useRouter} from 'next/navigation'
import {Icons} from '@/components/Icons'
import PermitForm, {permitValuesFromRecord, PermitFormValues} from '@/components/PermitForm'

export default function EditPermitPage() {
    const {permitId} = useParams<{ permitId: string }>()
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [initial, setInitial] = useState<PermitFormValues | null>(null)

    useEffect(() => {
        const load = async () => {
            const {data, error: fetchError} = await supabase
                .from('permits')
                .select('*')
                .eq('id', permitId)
                .single()

            if (fetchError || !data) {
                setError(fetchError?.message ?? 'Не удалось загрузить разрешение')
                setFetching(false)
                return
            }

            setInitial(permitValuesFromRecord(data))
            setFetching(false)
        }

        load()
    }, [permitId, supabase])

    if (fetching) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Icons.Loader className="h-8 w-8 animate-spin t-accent"/>
            </div>
        )
    }

    if (error && !initial) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="alert-error">{error}</div>
            </div>
        )
    }

    if (!initial) return null

    return (
        <PermitForm
            title="Изменить разрешение"
            backHref={`/dashboard/permits/${permitId}`}
            initialValues={initial}
            loading={loading}
            error={error}
            submitLabel="Сохранить изменения"
            onSubmit={async (payload) => {
                setLoading(true)
                setError('')
                const {error: updateError} = await supabase
                    .from('permits')
                    .update(payload)
                    .eq('id', permitId)
                if (updateError) {
                    setError(updateError.message)
                    setLoading(false)
                    return
                }
                router.push(`/dashboard/permits/${permitId}`)
                router.refresh()
            }}
        />
    )
}
