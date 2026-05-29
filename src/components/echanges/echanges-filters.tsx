'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TypeInteraction } from '@/lib/supabase/types'

const TYPE_FILTERS: { value: TypeInteraction | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'appel', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'visite', label: 'Visite' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'autre', label: 'Autre' },
]

interface EchangesFiltersProps {
  search: string
  type: string
}

export function EchangesFilters({ search: initSearch, type: initType }: EchangesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const push = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push('search', val), 350)
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Rechercher dans les échanges…"
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => push('type', f.value)}
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
    </div>
  )
}
