'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

interface TachesFiltersProps {
  search: string
  statut: string
  priorite: string
}

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'a_faire', label: 'À faire' },
  { value: 'fait', label: 'Faits' },
]

const PRIORITES = [
  { value: '', label: 'Toutes' },
  { value: 'haute', label: '🔴 Haute' },
  { value: 'normale', label: '🟡 Normale' },
  { value: 'basse', label: '⚪ Basse' },
]

export function TachesFilters({ search, statut, priorite }: TachesFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => updateParam('search', e.target.value), 350)
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Rechercher une tâche…"
        defaultValue={search}
        onChange={handleSearch}
        className="w-full bg-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex gap-2 flex-wrap">
        {STATUTS.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam('statut', s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statut === s.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1" />
        {PRIORITES.map((p) => (
          <button
            key={p.value}
            onClick={() => updateParam('priorite', p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              priorite === p.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
