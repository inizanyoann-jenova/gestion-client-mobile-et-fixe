import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Client, Secteur, StatutClient } from '@/lib/supabase/types'

const STATUT_VARIANT: Record<StatutClient, 'success' | 'info' | 'neutral'> = {
  actif: 'success',
  prospect: 'info',
  inactif: 'neutral',
}

const STATUT_LABEL: Record<StatutClient, string> = {
  actif: 'Actif',
  prospect: 'Prospect',
  inactif: 'Inactif',
}

const SECTEUR_ICON: Record<Secteur, string> = {
  courants_forts: '⚡',
  courants_faibles: '📡',
  photovoltaique: '☀️',
  mixte: '🔧',
}

const SECTEUR_LABEL: Record<Secteur, string> = {
  courants_forts: 'Courants forts',
  courants_faibles: 'Courants faibles',
  photovoltaique: 'Photovoltaïque',
  mixte: 'Mixte',
}

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{client.nom}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {SECTEUR_ICON[client.secteur]} {SECTEUR_LABEL[client.secteur]}
          </p>
        </div>
        <Badge label={STATUT_LABEL[client.statut]} variant={STATUT_VARIANT[client.statut]} />
      </div>
      <p className="text-slate-500 text-xs mt-2">
        Client depuis{' '}
        {new Date(client.created_at).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        })}
      </p>
    </Link>
  )
}
