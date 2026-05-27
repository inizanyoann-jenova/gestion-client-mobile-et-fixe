import { formatCurrency } from '@/lib/utils/currency'

interface ClientKpisProps {
  kpis: {
    ca_realise: number
    montant_attente: number
    nombre_projets: number
  }
}

export function ClientKpis({ kpis }: ClientKpisProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard
        label="CA réalisé"
        value={formatCurrency(kpis.ca_realise)}
        color="text-emerald-400"
      />
      <KpiCard
        label="En attente"
        value={formatCurrency(kpis.montant_attente)}
        color="text-amber-400"
      />
      <KpiCard
        label="Projets"
        value={String(kpis.nombre_projets)}
        color="text-sky-400"
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 text-center">
      <p className={`text-base font-bold ${color} leading-tight`}>{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  )
}
