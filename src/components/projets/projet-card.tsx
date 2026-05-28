import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import type { Projet, StatutProjet, SecteurProjet } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }

const STATUT_LABEL: Record<StatutProjet, string> = {
  en_etude: 'En étude',
  en_cours: 'En cours',
  termine: 'Terminé',
  sav: 'SAV',
}

const STATUT_VARIANT: Record<StatutProjet, 'info' | 'warning' | 'success' | 'danger'> = {
  en_etude: 'info',
  en_cours: 'warning',
  termine: 'success',
  sav: 'danger',
}

const SECTEUR_ICON: Record<SecteurProjet, string> = {
  courants_forts: '⚡',
  courants_faibles: '📡',
  photovoltaique: '☀️',
}

interface ProjetCardProps {
  projet: ProjetAvecClient
}

export function ProjetCard({ projet }: ProjetCardProps) {
  const isSav = projet.statut === 'sav'

  return (
    <Link
      href={`/projets/${projet.id}`}
      className={`block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors ${
        isSav ? 'border border-red-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{projet.titre}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            <span aria-hidden="true">{SECTEUR_ICON[projet.secteur]} </span>
            <span>{projet.client.nom}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            label={STATUT_LABEL[projet.statut]}
            variant={STATUT_VARIANT[projet.statut]}
          />
          {isSav && (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Avancement</span>
          <span>{projet.avancement}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: `${projet.avancement}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        {projet.montant_devis ? (
          <span>{formatCurrency(projet.montant_devis)}</span>
        ) : (
          <span>Montant non renseigné</span>
        )}
        {projet.date_fin_estimee && (
          <span>
            Fin{' '}
            {new Date(projet.date_fin_estimee).toLocaleDateString('fr-FR', {
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </Link>
  )
}
