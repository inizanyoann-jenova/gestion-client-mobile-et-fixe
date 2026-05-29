'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Interaction {
  id: string
  type: string
  date: string
  resume: string
  suite_a_donner: string | null
  projet_id: string | null
}

const TYPE_LABEL: Record<string, string> = {
  appel: 'Appel', email: 'Email', visite: 'Visite', reunion: 'Réunion', autre: 'Autre',
}
const TYPE_COLOR: Record<string, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

interface ClientEchangesProps {
  clientId: string
}

export function ClientEchanges({ clientId }: ClientEchangesProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/interactions?client_id=${clientId}&page=1`)
      .then((r) => r.json())
      .then((data) => setInteractions(data.interactions ?? []))
      .catch(() => setInteractions([]))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">
          {interactions.length} échange{interactions.length !== 1 ? 's' : ''}
        </span>
        <Link href={`/echanges/nouveau?client=${clientId}`} className="text-sky-400 text-sm font-medium">
          + Nouvel échange
        </Link>
      </div>

      {interactions.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun échange enregistré</p>
      )}

      {interactions.map((interaction) => (
        <div key={interaction.id} className="bg-slate-900 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[interaction.type] ?? 'bg-slate-500/20 text-slate-400'}`}
            >
              {TYPE_LABEL[interaction.type] ?? interaction.type}
            </span>
            <span className="text-slate-500 text-xs ml-auto">
              {new Date(interaction.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-white text-sm line-clamp-2">{interaction.resume}</p>
          {interaction.suite_a_donner && (
            <p className="text-amber-400 text-xs mt-2">→ {interaction.suite_a_donner}</p>
          )}
        </div>
      ))}
    </div>
  )
}
