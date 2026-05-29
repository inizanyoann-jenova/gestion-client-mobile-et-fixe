import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardKpis } from '@/components/dashboard/dashboard-kpis'
import { TachesAujourdhui } from '@/components/dashboard/taches-aujourd-hui'
import { ProjetsRecents } from '@/components/dashboard/projets-recents'
import { FabCreate } from '@/components/dashboard/fab-create'
import { Skeleton } from '@/components/ui/skeleton'
import type { TacheLite, ProjetLite } from '@/lib/validations/dashboard'

async function DashboardContent() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = new Date(today.getTime() + 86_400_000).toISOString().split('T')[0]

  const [
    clientsRes,
    projetsEnCoursRes,
    tachesUrgentesRes,
    devisRes,
    tachesDuJourRes,
    projetsRecentsRes,
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    supabase.from('projets').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
    supabase.from('taches').select('*', { count: 'exact', head: true }).eq('priorite', 'haute').eq('statut', 'a_faire'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('type', 'devis'),
    supabase
      .from('taches')
      .select('id, titre, priorite, date_echeance, client:clients(id, nom), projet:projets(id, titre)')
      .eq('statut', 'a_faire')
      .gte('date_echeance', `${todayStr}T00:00:00.000Z`)
      .lt('date_echeance', `${tomorrowStr}T00:00:00.000Z`)
      .order('priorite', { ascending: true })
      .limit(5),
    supabase
      .from('projets')
      .select('id, titre, statut, avancement, updated_at, client:clients(id, nom)')
      .neq('statut', 'termine')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const kpis = {
    clients_actifs: clientsRes.count ?? 0,
    projets_en_cours: projetsEnCoursRes.count ?? 0,
    taches_urgentes: tachesUrgentesRes.count ?? 0,
    documents_devis: devisRes.count ?? 0,
  }

  return (
    <div className="space-y-6">
      <DashboardKpis kpis={kpis} />

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Tâches du jour
        </h2>
        <TachesAujourdhui taches={(tachesDuJourRes.data ?? []) as unknown as TacheLite[]} />
      </section>

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Projets récents
        </h2>
        <ProjetsRecents projets={(projetsRecentsRes.data ?? []) as unknown as ProjetLite[]} />
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <p className="text-slate-400 text-sm">Bonjour 👋</p>
        <h1 className="text-xl font-bold text-white">ATEXIA</h1>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
      <FabCreate />
    </div>
  )
}
