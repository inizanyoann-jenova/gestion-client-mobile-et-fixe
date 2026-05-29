import type { DashboardKpis as DashboardKpisType } from '@/lib/validations/dashboard'

interface KpiCardProps {
  label: string
  value: number
  icon: string
  colorClass: string
}

function KpiCard({ label, value, icon, colorClass }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-300 mt-1">{label}</div>
    </div>
  )
}

interface DashboardKpisProps {
  kpis: DashboardKpisType
}

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard label="Clients actifs" value={kpis.clients_actifs} icon="🏢" colorClass="bg-sky-500/20" />
      <KpiCard label="Projets en cours" value={kpis.projets_en_cours} icon="🔧" colorClass="bg-violet-500/20" />
      <KpiCard label="Tâches urgentes" value={kpis.taches_urgentes} icon="⚡" colorClass="bg-red-500/20" />
      <KpiCard label="Devis" value={kpis.documents_devis} icon="📄" colorClass="bg-amber-500/20" />
    </div>
  )
}
