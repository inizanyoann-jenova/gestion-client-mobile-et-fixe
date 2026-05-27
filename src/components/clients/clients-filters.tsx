'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useRef } from 'react'

interface ClientsFiltersProps {
  search: string
  statut: string
  secteur: string
}

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'actif', label: 'Actifs' },
  { value: 'prospect', label: 'Prospects' },
  { value: 'inactif', label: 'Inactifs' },
]

const SECTEURS = [
  { value: '', label: 'Tous' },
  { value: 'courants_forts', label: '⚡' },
  { value: 'courants_faibles', label: '📡' },
  { value: 'photovoltaique', label: '☀️' },
  { value: 'mixte', label: '🔧' },
]

export function ClientsFilters({ search, statut, secteur }: ClientsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const current = { search, statut, secteur, ...updates }
      const params = new URLSearchParams()
      if (current.search) params.set('search', current.search)
      if (current.statut) params.set('statut', current.statut)
      if (current.secteur) params.set('secteur', current.secteur)
      router.push(`${pathname}?${params.toString()}`)
    },
    [search, statut, secteur, router, pathname]
  )

  return (
    <div className="space-y-3">
      <input
        type="search"
        defaultValue={search}
        onChange={(e) => {
          clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(
            () => updateParams({ search: e.target.value }),
            400
          )
        }}
        placeholder="Rechercher un client…"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUTS.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams({ statut: s.value })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statut === s.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1 self-stretch" />
        {SECTEURS.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams({ secteur: s.value })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              secteur === s.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
