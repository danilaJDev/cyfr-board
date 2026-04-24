'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AttachmentUpload({ taskId }: { taskId: string }) {
    const [uploading, setUploading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)

        const ext = file.name.split('.').pop()
        const path = `${taskId}/${Date.now()}.${ext}`

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(path, file)

        if (!error && data) {
            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(data.path)

            await supabase.from('attachments').insert({
                task_id: taskId,
                file_url: publicUrl,
                file_name: file.name,
                file_type: file.type,
            })

            router.refresh()
        }

        setUploading(false)
        e.target.value = ''
    }

    return (
        <label className="flex items-center gap-2 cursor-pointer text-blue-400 hover:text-blue-300 text-sm transition w-fit">
            <span>⬆</span>
            {uploading ? 'Загружаем...' : 'Прикрепить файл'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
    )
}