import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Devis, StatutDevis } from '@/lib/supabase/finance-types'

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const STATUT_VARIANT: Record<StatutDevis, BadgeVariant> = {
  brouillon: 'neutral',
  envoyé: 'info',
  accepté: 'success',
  refusé: 'danger',
  expiré: 'warning',
}

const STATUT_LABEL: Record<StatutDevis, string> = {
  brouillon: 'Brouillon',
  envoyé: 'Envoyé',
  accepté: 'Accepté',
  refusé: 'Refusé',
  expiré: 'Expiré',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface DevisCardProps { devis: Devis; clientNom: string }

export function DevisCard({ devis, clientNom }: DevisCardProps) {
  return (
    <Link
      href={`/finances/devis/${devis.id}`}
      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{devis.numero}</p>
          <p className="text-slate-400 text-sm mt-0.5 truncate">{clientNom}</p>
        </div>
        <Badge label={STATUT_LABEL[devis.statut]} variant={STATUT_VARIANT[devis.statut]} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-white font-bold">{eur(Number(devis.montant_ttc))}</p>
        <p className="text-slate-500 text-xs">Validité : {devis.date_validite}</p>
      </div>
    </Link>
  )
}
