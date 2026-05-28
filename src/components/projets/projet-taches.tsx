'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TacheForm } from '@/components/taches/tache-form'
import type { Tache, PrioriteTask } from '@/lib/supabase/types'

interface ProjetTachesProps {
  taches: Tache[]
  projetId: string
}

const PRIORITE_COLOR: Record<PrioriteTask, string> = {
  haute: 'text-red-400',
  normale: 'text-amber-400',
  basse: 'text-slate-400',
}

const PRIORITE_LABEL: Record<PrioriteTask, string> = {
  haute: '↑ Haute',
  normale: '→ Normale',
  basse: '↓ Basse',
}

export function ProjetTaches({ taches: initialTaches, projetId }: ProjetTachesProps) {
  const router = useRouter()
  const [taches, setTaches] = useState(initialTaches)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggle = async (tache: Tache) => {
    if (updating === tache.id) return

    const newStatut = tache.statut === 'a_faire' ? 'fait' : 'a_faire'
    setTaches((prev) =>
      prev.map((t) => (t.id === tache.id ? { ...t, statut: newStatut } : t))
    )
    setUpdating(tache.id)

    try {
      const res = await fetch(`/api/taches/${tache.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      if (!res.ok) {
        setTaches((prev) =>
          prev.map((t) => (t.id === tache.id ? { ...t, statut: tache.statut } : t))
        )
      } else {
        router.refresh()
      }
    } catch {
      setTaches((prev) =>
        prev.map((t) => (t.id === tache.id ? { ...t, statut: tache.statut } : t))
      )
    } finally {
      setUpdating(null)
    }
  }

  const sorted = [...taches].sort((a, b) => {
    if (a.statut !== b.statut) return a.statut === 'a_faire' ? -1 : 1
    const prioriteOrder: Record<PrioriteTask, number> = { haute: 0, normale: 1, basse: 2 }
    if (a.priorite !== b.priorite) return prioriteOrder[a.priorite] - prioriteOrder[b.priorite]
    if (a.date_echeance && b.date_echeance)
      return new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime()
    if (a.date_echeance) return -1
    if (b.date_echeance) return 1
    return 0
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">
          {taches.filter((t) => t.statut === 'a_faire').length} à faire
        </span>
        <TacheForm projetId={projetId} />
      </div>

      {sorted.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucune tâche</p>
      )}

      {sorted.map((tache) => (
        <div
          key={tache.id}
          className={`flex items-start gap-3 bg-slate-900 rounded-xl p-3 ${
            tache.statut === 'fait' ? 'opacity-60' : ''
          }`}
        >
          <button
            onClick={() => handleToggle(tache)}
            disabled={updating === tache.id}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              tache.statut === 'fait'
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-500 hover:border-sky-400'
            }`}
          >
            {tache.statut === 'fait' && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${tache.statut === 'fait' ? 'line-through text-slate-500' : 'text-white'}`}>
              {tache.titre}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs ${PRIORITE_COLOR[tache.priorite]}`}>
                {PRIORITE_LABEL[tache.priorite]}
              </span>
              {tache.date_echeance && (
                <span className="text-slate-500 text-xs">
                  {new Date(tache.date_echeance).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
