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
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path)

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
        className={`group inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          uploading ? 'pointer-events-none opacity-60' : ''
        }`}
        style={{
          borderColor: 'var(--app-border-strong)',
          background: 'var(--app-surface-2)',
          color: 'var(--app-muted)',
        }}
      >
        {uploading ? (
          <Icons.Loader className="h-4 w-4 animate-spin t-accent" />
        ) : (
          <Icons.Upload className="h-4 w-4" />
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
        <p className="alert-error text-xs py-2">
          {error}
        </p>
      )}
    </div>
  )
}
