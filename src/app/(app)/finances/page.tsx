import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FinancesKpis } from '@/components/finances/finances-kpis'
import { DevisCard } from '@/components/finances/devis-card'
import { FactureCard } from '@/components/finances/facture-card'
import type { FinancesKpisData, Devis, Facture } from '@/lib/supabase/finance-types'

async function getFinancesData(tab: string) {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const [devisEnCoursRes, caRes, impayeRes, enRetardRes] = await Promise.all([
    supabase.from('devis').select('montant_ttc').eq('statut', 'envoyé'),
    supabase.from('factures').select('montant_ttc').eq('statut', 'payée').gte('date_emission', `${currentYear}-01-01`),
    supabase.from('factures').select('montant_ttc').in('statut', ['émise', 'en_retard']),
    supabase.from('factures').select('id', { count: 'exact', head: true }).eq('statut', 'en_retard'),
  ])

  const kpis: FinancesKpisData = {
    devis_en_cours_montant: (devisEnCoursRes.data ?? []).reduce((s, d) => s + Number(d.montant_ttc), 0),
    ca_facture_annee: (caRes.data ?? []).reduce((s, d) => s + Number(d.montant_ttc), 0),
    montant_impaye: (impayeRes.data ?? []).reduce((s, d) => s + Number(d.montant_ttc), 0),
    factures_en_retard: enRetardRes.count ?? 0,
  }

  if (tab === 'factures') {
    const { data } = await supabase
      .from('factures')
      .select('*, client:clients(id, nom)')
      .order('created_at', { ascending: false })
      .limit(20)
    return { kpis, factures: (data ?? []) as unknown as (Facture & { client: { id: string; nom: string } })[], devis: [] }
  }

  const { data } = await supabase
    .from('devis')
    .select('*, client:clients(id, nom)')
    .order('created_at', { ascending: false })
    .limit(20)
  return { kpis, devis: (data ?? []) as unknown as (Devis & { client: { id: string; nom: string } })[], factures: [] }
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'factures' ? 'factures' : 'devis'
  const { kpis, devis, factures } = await getFinancesData(tab)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Finances</h1>
        <Link
          href="/finances/devis/nouveau"
          className="text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
        >
          + Devis
        </Link>
      </div>

      <FinancesKpis kpis={kpis} />

      <div className="flex gap-2 mt-6 mb-4">
        <Link
          href="/finances"
          className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
            tab === 'devis' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Devis
        </Link>
        <Link
          href="/finances?tab=factures"
          className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
            tab === 'factures' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Factures
        </Link>
      </div>

      {tab === 'devis' && (
        <div className="space-y-3">
          {devis.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucun devis</p>}
          {devis.map((d) => <DevisCard key={d.id} devis={d} clientNom={(d.client as { nom: string }).nom} />)}
        </div>
      )}

      {tab === 'factures' && (
        <div className="space-y-3">
          {factures.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucune facture</p>}
          {factures.map((f) => <FactureCard key={f.id} facture={f} clientNom={(f.client as { nom: string }).nom} />)}
        </div>
      )}
    </div>
  )
}
