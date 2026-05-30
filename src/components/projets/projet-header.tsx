import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ProjetForm } from './projet-form'
import { DeleteProjetButton } from './delete-projet-button'
import type { Projet, StatutProjet, SecteurProjet, TypeProjet } from '@/lib/supabase/types'

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

const TYPE_LABEL: Record<TypeProjet, string> = {
  installation: 'Installation',
  etude: 'Étude',
  maintenance: 'Maintenance',
  sav: 'SAV',
}

interface ProjetHeaderProps {
  projet: ProjetAvecClient
}

export function ProjetHeader({ projet }: ProjetHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-sky-950 to-slate-900 border-b border-sky-800/50 px-4 pt-4 pb-5">
      <Link href="/projets" className="flex items-center gap-1 text-sky-400 text-sm mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Projets
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight">{projet.titre}</h1>
          <Link
            href={`/clients/${projet.client.id}`}
            className="text-sky-400 text-sm mt-1 block"
          >
            {projet.client.nom} →
          </Link>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge label={STATUT_LABEL[projet.statut]} variant={STATUT_VARIANT[projet.statut]} />
            <span className="text-slate-400 text-xs">
              {SECTEUR_ICON[projet.secteur]}
            </span>
            <span className="text-slate-400 text-xs">{TYPE_LABEL[projet.type]}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Link
            href={`/projets/${projet.id}/chantier`}
            className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors"
          >
            ⛏ Sur chantier
          </Link>
          <ProjetForm mode="edit" projet={projet} />
          <DeleteProjetButton projetId={projet.id} />
        </div>
      </div>
    </div>
  )
}
