import type { DashboardKpis as DashboardKpisType } from '@/lib/validations/dashboard'

interface KpiCardProps {
  label: string
  value: number
  icon: string
  borderClass: string
}

function KpiCard({ label, value, icon, borderClass }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 bg-slate-900 border border-slate-800 border-l-4 ${borderClass}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

interface DashboardKpisProps {
  kpis: DashboardKpisType
}

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard label="Clients actifs" value={kpis.clients_actifs} icon="🏢" borderClass="border-l-sky-500" />
      <KpiCard label="Projets en cours" value={kpis.projets_en_cours} icon="🔧" borderClass="border-l-violet-500" />
      <KpiCard label="Tâches urgentes" value={kpis.taches_urgentes} icon="⚡" borderClass="border-l-red-500" />
      <KpiCard label="Devis" value={kpis.documents_devis} icon="📄" borderClass="border-l-amber-500" />
    </div>
  )
}
