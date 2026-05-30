import { createClient } from '@/lib/supabase/server'
import { PlanningCalendar } from '@/components/planning/planning-calendar'
import { SearchModal } from '@/components/search/search-modal'
import { normalizeEvents } from '@/lib/planning/normalize-events'
import type { PlanningData } from '@/lib/planning/types'

function getDateRange(): { from: string; to: string; initialMonth: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return {
    from: from.toISOString().split('T')[0] ?? '',
    to: to.toISOString().split('T')[0] ?? '',
    initialMonth,
  }
}

export default async function PlanningPage() {
  const supabase = await createClient()
  const { from, to, initialMonth } = getDateRange()

  const [tachesRes, interactionsRes, devisRes, facturesRes] = await Promise.all([
    supabase
      .from('taches')
      .select('id, titre, date_echeance, statut')
      .not('statut', 'eq', 'terminée')
      .gte('date_echeance', from)
      .lte('date_echeance', to),
    supabase
      .from('interactions')
      .select('id, type, resume, date')
      .eq('type', 'visite')
      .gte('date', from)
      .lte('date', to),
    supabase
      .from('devis')
      .select('id, numero, statut, date_validite')
      .in('statut', ['brouillon', 'envoyé'])
      .gte('date_validite', from)
      .lte('date_validite', to),
    supabase
      .from('factures')
      .select('id, numero, statut, date_echeance')
      .in('statut', ['émise', 'en_retard'])
      .gte('date_echeance', from)
      .lte('date_echeance', to),
  ])

  const data: PlanningData = {
    taches: tachesRes.data ?? [],
    interactions: interactionsRes.data ?? [],
    devis: (devisRes.data ?? []) as PlanningData['devis'],
    factures: (facturesRes.data ?? []) as PlanningData['factures'],
  }

  const events = normalizeEvents(data)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Planning</h1>
        <SearchModal />
      </div>
      <PlanningCalendar initialMonth={initialMonth} events={events} />
    </div>
  )
}
