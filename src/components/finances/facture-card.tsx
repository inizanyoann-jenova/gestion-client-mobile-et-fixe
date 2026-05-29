import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Facture, StatutFacture } from '@/lib/supabase/finance-types'

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const STATUT_VARIANT: Record<StatutFacture, BadgeVariant> = {
  émise: 'info',
  payée: 'success',
  en_retard: 'danger',
}

const STATUT_LABEL: Record<StatutFacture, string> = {
  émise: 'Émise',
  payée: 'Payée',
  en_retard: 'En retard',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface FactureCardProps { facture: Facture; clientNom: string }

export function FactureCard({ facture, clientNom }: FactureCardProps) {
  return (
    <Link
      href={`/finances/factures/${facture.id}`}
      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{facture.numero}</p>
          <p className="text-slate-400 text-sm mt-0.5 truncate">{clientNom}</p>
        </div>
        <Badge label={STATUT_LABEL[facture.statut]} variant={STATUT_VARIANT[facture.statut]} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-white font-bold">{eur(Number(facture.montant_ttc))}</p>
        <p className="text-slate-500 text-xs">Échéance : {facture.date_echeance}</p>
      </div>
    </Link>
  )
}
