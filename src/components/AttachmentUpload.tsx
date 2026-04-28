'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Icons } from './Icons'

export default function AttachmentUpload({ taskId }: { taskId: string }) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)

        const ext = file.name.split('.').pop()
        const path = `${taskId}/${Date.now()}.${ext}`

        const { data, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(path, file)

        if (!uploadError && data) {
            const {
                data: { publicUrl },
            } = supabase.storage.from('attachments').getPublicUrl(data.path)

            const { error: insertError } = await supabase.from('attachments').insert({
                task_id: taskId,
                file_url: publicUrl,
                file_name: file.name,
                file_type: file.type,
            })

            if (insertError) {
                setError(insertError.message)
            } else {
                router.refresh()
            }
        } else if (uploadError) {
            setError(uploadError.message)
        }

        setUploading(false)
        e.target.value = ''
    }

    return (
        <div className="flex flex-col gap-2">
            <label
                className={`group inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/5 hover:text-cyan-300 ${
                    uploading ? 'pointer-events-none opacity-60' : ''
                }`}
            >
                {uploading ? (
                    <Icons.Loader className="h-4 w-4 animate-spin" />
                ) : (
                    <Icons.Upload className="h-4 w-4 transition-colors group-hover:text-cyan-300" />
                )}
                {uploading ? 'Загружаем...' : 'Прикрепить файл'}
                <input
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </label>
            {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                </p>
            )}
        </div>
    )
}
