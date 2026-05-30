import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ClientForm } from './client-form'
import { DeleteClientButton } from './delete-client-button'
import type { Client, Secteur, StatutClient } from '@/lib/supabase/types'

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

interface ClientHeaderProps {
  client: Client
}

export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-sky-950 to-slate-900 border-b border-sky-800/50 px-4 pt-4 pb-5">
      <Link href="/clients" className="flex items-center gap-1 text-sky-400 text-sm mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Clients
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight">{client.nom}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {SECTEUR_ICON[client.secteur]} {SECTEUR_LABEL[client.secteur]}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {client.adresse ?? 'Adresse non renseignée'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge
            label={STATUT_LABEL[client.statut]}
            variant={STATUT_VARIANT[client.statut]}
          />
          <ClientForm mode="edit" client={client} />
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>
    </div>
  )
}
