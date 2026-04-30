export type PermitDocument = { name: string; url: string }

export type PermitMeta = {
    notes?: string
    employeeCount?: number | null
    documents?: PermitDocument[]
}

export const EMPLOYEE_COUNT_PERMIT_TYPES = ['Contractor Access Permit ALTERATIONS']

export function parsePermitNotes(rawNotes: string | null | undefined): PermitMeta {
    if (!rawNotes) return {}
    if (!rawNotes.startsWith('__PERMIT_META__')) return {notes: rawNotes}

    try {
        const parsed = JSON.parse(rawNotes.replace('__PERMIT_META__', '')) as PermitMeta
        return {
            notes: parsed.notes,
            employeeCount: parsed.employeeCount ?? null,
            documents: parsed.documents ?? [],
        }
    } catch {
        return {notes: rawNotes}
    }
}

export function serializePermitNotes(payload: PermitMeta): string | null {
    if (!payload.notes && !payload.employeeCount && !payload.documents?.length) return null
    return `__PERMIT_META__${JSON.stringify(payload)}`
}
