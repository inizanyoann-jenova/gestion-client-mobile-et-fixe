import type { FinancesKpisData } from '@/lib/supabase/finance-types'

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface KpiCardProps { label: string; value: string; icon: string; colorClass: string }

function KpiCard({ label, value, icon, colorClass }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-white truncate">{value}</div>
      <div className="text-xs text-slate-300 mt-1">{label}</div>
    </div>
  )
}

export function FinancesKpis({ kpis }: { kpis: FinancesKpisData }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard label="Devis en cours" value={eur(kpis.devis_en_cours_montant)} icon="📋" colorClass="bg-sky-500/20" />
      <KpiCard label="CA facturé (année)" value={eur(kpis.ca_facture_annee)} icon="💰" colorClass="bg-emerald-500/20" />
      <KpiCard label="Impayés" value={eur(kpis.montant_impaye)} icon="⏳" colorClass="bg-amber-500/20" />
      <KpiCard label="En retard" value={String(kpis.factures_en_retard)} icon="🚨" colorClass="bg-red-500/20" />
    </div>
  )
}
