import Link from 'next/link'
import type { ProjetLite } from '@/lib/validations/dashboard'

const STATUT_BADGE: Record<string, string> = {
  en_cours: 'bg-amber-500/20 text-amber-400',
  en_etude: 'bg-sky-500/20 text-sky-400',
  sav: 'bg-red-500/20 text-red-400',
}

const STATUT_LABEL: Record<string, string> = {
  en_cours: 'En cours',
  en_etude: 'En étude',
  sav: 'SAV',
  termine: 'Terminé',
}

interface ProjetsRecentsProps {
  projets: ProjetLite[]
}

export function ProjetsRecents({ projets }: ProjetsRecentsProps) {
  if (projets.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">Aucun projet en cours</p>
    )
  }

  return (
    <div className="space-y-2">
      {projets.map((projet) => (
        <Link
          key={projet.id}
          href={`/projets/${projet.id}`}
          className="block bg-slate-800 rounded-lg p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium line-clamp-1">{projet.titre}</p>
              <p className="text-slate-400 text-xs mt-0.5">{projet.client.nom}</p>
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_BADGE[projet.statut] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {STATUT_LABEL[projet.statut] ?? projet.statut}
            </span>
          </div>
          <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${projet.avancement}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  )
}
