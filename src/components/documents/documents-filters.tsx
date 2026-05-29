'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TypeDocument } from '@/lib/supabase/types'

const TYPE_FILTERS: { value: TypeDocument | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'devis', label: 'Devis' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'plan', label: 'Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

interface DocumentsFiltersProps {
  type: string
}

export function DocumentsFilters({ type: initType }: DocumentsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const push = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('type', value)
    else params.delete('type')
    params.delete('page')
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {TYPE_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => push(f.value)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            initType === f.value
              ? 'bg-sky-500 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
