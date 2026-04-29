'use client'

import {useState} from 'react'
import {Icons} from './Icons'
import type {PermitDocument} from '@/lib/permits'

export default function PermitCardDocs({documents}: { documents: PermitDocument[] }) {
    const [open, setOpen] = useState(false)

    if (documents.length === 0) return null

    return (
        <div className="border-t" style={{borderColor: 'var(--app-border)'}}>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpen((v) => !v)
                }}
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors"
                style={{
                    background: open ? 'var(--app-accent-subtle)' : 'transparent',
                    color: open ? 'var(--app-accent-text)' : 'var(--app-muted)',
                }}
            >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Icons.Paperclip className="h-3.5 w-3.5"/>
                    Документы · {documents.length}
                </span>
                <Icons.ChevronDown
                    className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                    style={{transform: open ? 'rotate(180deg)' : 'rotate(0deg)'}}
                />
            </button>

            {open && (
                <div
                    className="space-y-1 p-3"
                    onClick={(e) => e.stopPropagation()}
                >
                    {documents.map((doc, i) => (
                        <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all"
                            style={{
                                background: 'var(--app-surface-2)',
                                color: 'var(--app-fg)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                                style={{background: 'var(--app-accent-subtle)', color: 'var(--app-accent-text)'}}
                            >
                                <Icons.File className="h-3.5 w-3.5"/>
                            </div>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                                {doc.name || doc.url}
                            </span>
                            <Icons.Eye
                                className="h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100 t-accent"/>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
