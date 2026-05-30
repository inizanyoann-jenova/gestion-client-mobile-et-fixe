import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardKpis } from '@/components/dashboard/dashboard-kpis'
import { TachesAujourdhui } from '@/components/dashboard/taches-aujourd-hui'
import { ProjetsRecents } from '@/components/dashboard/projets-recents'
import { AlertesIntelligentes } from '@/components/dashboard/alertes-intelligentes'
import { FabCreate } from '@/components/dashboard/fab-create'
import { Skeleton } from '@/components/ui/skeleton'
import type { TacheLite, ProjetLite } from '@/lib/validations/dashboard'
import type { AlerteDevis, AlerteClient } from '@/components/dashboard/alertes-intelligentes'

async function DashboardContent() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]!
  const tomorrowStr = new Date(today.getTime() + 86_400_000).toISOString().split('T')[0]!
  const il7JoursStr = new Date(today.getTime() - 7 * 86_400_000).toISOString().split('T')[0]!
  const il60JoursStr = new Date(today.getTime() - 60 * 86_400_000).toISOString()

  const [
    clientsRes,
    projetsEnCoursRes,
    tachesUrgentesRes,
    devisRes,
    tachesDuJourRes,
    projetsRecentsRes,
    devisSansReponseRes,
    interactionsRecentesRes,
    clientsActifsRes,
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
    // Alertes : devis envoyés > 7j sans réponse
    supabase
      .from('devis')
      .select('id, numero, date_emission, client:clients(id, nom)')
      .eq('statut', 'envoyé')
      .lt('date_emission', il7JoursStr)
      .order('date_emission', { ascending: true })
      .limit(5),
    // Alertes : interactions récentes (60j) pour détecter clients dormants
    supabase
      .from('interactions')
      .select('client_id, date')
      .gte('date', il60JoursStr)
      .not('client_id', 'is', null),
    // Tous les clients actifs pour la comparaison dormants
    supabase
      .from('clients')
      .select('id, nom')
      .eq('statut', 'actif')
      .limit(100),
  ])

  const kpis = {
    clients_actifs: clientsRes.count ?? 0,
    projets_en_cours: projetsEnCoursRes.count ?? 0,
    taches_urgentes: tachesUrgentesRes.count ?? 0,
    documents_devis: devisRes.count ?? 0,
  }

  // Build devis alerts
  const devisSansReponse: AlerteDevis[] = (devisSansReponseRes.data ?? []).map((d) => {
    const client = d.client as unknown as { nom: string } | null
    const joursAttente = Math.floor(
      (today.getTime() - new Date(d.date_emission).getTime()) / 86_400_000
    )
    return { id: d.id, numero: d.numero, clientNom: client?.nom ?? 'Client', joursAttente }
  })

  // Build clients dormants alerts
  const clientsAvecEchangeRecent = new Set(
    (interactionsRecentesRes.data ?? []).map((i) => i.client_id).filter(Boolean)
  )
  const clientsDormants: AlerteClient[] = (clientsActifsRes.data ?? [])
    .filter((c) => !clientsAvecEchangeRecent.has(c.id))
    .slice(0, 3)
    .map((c) => ({ id: c.id, nom: c.nom, joursDormant: 60 }))

  return (
    <div className="space-y-6">
      <DashboardKpis kpis={kpis} />

      {(devisSansReponse.length > 0 || clientsDormants.length > 0) && (
        <AlertesIntelligentes
          devisSansReponse={devisSansReponse}
          clientsDormants={clientsDormants}
        />
      )}

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
      <div className="bg-gradient-to-r from-sky-900 to-sky-700 rounded-2xl p-4 mb-6 flex justify-between items-center">
        <div>
          <p className="text-sky-200 text-xs">Bonjour 👋</p>
          <h1 className="text-white text-xl font-bold">ATEXIA CRM</h1>
        </div>
        <span className="text-white/80 text-2xl font-black tracking-tighter" aria-hidden="true">AX</span>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
      <FabCreate />
    </div>
  )
}
