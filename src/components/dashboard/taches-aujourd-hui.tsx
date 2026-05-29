import Link from 'next/link'
import type { TacheLite } from '@/lib/validations/dashboard'

const PRIORITE_BORDER: Record<string, string> = {
  haute: 'border-l-red-500',
  normale: 'border-l-amber-500',
  basse: 'border-l-slate-500',
}

interface TachesAujourdhuiProps {
  taches: TacheLite[]
}

export function TachesAujourdhui({ taches }: TachesAujourdhuiProps) {
  if (taches.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">
        Aucune tâche pour aujourd&apos;hui 🎉
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {taches.map((tache) => (
        <Link
          key={tache.id}
          href="/taches"
          className={`block bg-slate-800 rounded-lg p-3 border-l-4 ${PRIORITE_BORDER[tache.priorite] ?? 'border-l-slate-500'}`}
        >
          <p className="text-white text-sm font-medium line-clamp-1">{tache.titre}</p>
          {tache.client && (
            <p className="text-slate-400 text-xs mt-0.5">{tache.client.nom}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
