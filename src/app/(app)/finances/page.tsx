import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FinancesKpis } from '@/components/finances/finances-kpis'
import { ExportExcelButton } from '@/components/finances/export-excel-button'
import { DevisCard } from '@/components/finances/devis-card'
import { FactureCard } from '@/components/finances/facture-card'
import { RapportFinancier } from '@/components/finances/rapport-financier'
import {
  buildCaMensuel,
  buildPipelineDevis,
  buildTopClients,
  calcTauxAcceptation,
} from '@/lib/utils/rapport'
import type { FinancesKpisData, Devis, Facture } from '@/lib/supabase/finance-types'
import type { RapportFinancierData } from '@/lib/validations/rapport'

type Tab = 'devis' | 'factures' | 'rapport'

async function getFinancesData(tab: Tab) {
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

  if (tab === 'rapport') {
    const date12MoisAgo = new Date()
    date12MoisAgo.setFullYear(date12MoisAgo.getFullYear() - 1)
    const dateMoins12Mois = date12MoisAgo.toISOString().split('T')[0]!

    const [facturesPayeesRes, tousDevisRes, topClientsRes] = await Promise.all([
      supabase
        .from('factures')
        .select('date_emission, montant_ttc')
        .eq('statut', 'payée')
        .gte('date_emission', dateMoins12Mois),
      supabase.from('devis').select('statut'),
      supabase
        .from('factures')
        .select('client_id, montant_ttc, client:clients(nom)')
        .eq('statut', 'payée'),
    ])

    const devisRows = tousDevisRes.data ?? []
    const rapport: RapportFinancierData = {
      caMensuel: buildCaMensuel(facturesPayeesRes.data ?? []),
      pipelineDevis: buildPipelineDevis(devisRows),
      topClients: buildTopClients(
        (topClientsRes.data ?? []) as unknown as {
          client_id: string
          montant_ttc: number
          client: { nom: string } | null
          date_emission: string
        }[]
      ),
      tauxAcceptation: calcTauxAcceptation(devisRows),
    }

    return { kpis, rapport, devis: [], factures: [] }
  }

  if (tab === 'factures') {
    const { data } = await supabase
      .from('factures')
      .select('*, client:clients(id, nom)')
      .order('created_at', { ascending: false })
      .limit(20)
    return {
      kpis,
      rapport: null,
      factures: (data ?? []) as unknown as (Facture & { client: { id: string; nom: string } })[],
      devis: [],
    }
  }

  const { data } = await supabase
    .from('devis')
    .select('*, client:clients(id, nom)')
    .order('created_at', { ascending: false })
    .limit(20)
  return {
    kpis,
    rapport: null,
    devis: (data ?? []) as unknown as (Devis & { client: { id: string; nom: string } })[],
    factures: [],
  }
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab: Tab =
    params.tab === 'factures' ? 'factures'
    : params.tab === 'rapport' ? 'rapport'
    : 'devis'

  const { kpis, devis, factures, rapport } = await getFinancesData(tab)

  const tabClass = (t: Tab) =>
    `flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
      tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
    }`

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Finances</h1>
        <div className="flex items-center gap-2">
          <ExportExcelButton />
          <Link
            href="/finances/devis/nouveau"
            className="text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
          >
            + Devis
          </Link>
        </div>
      </div>

      <FinancesKpis kpis={kpis} />

      <div className="flex gap-2 mt-6 mb-4">
        <Link href="/finances" className={tabClass('devis')}>Devis</Link>
        <Link href="/finances?tab=factures" className={tabClass('factures')}>Factures</Link>
        <Link href="/finances?tab=rapport" className={tabClass('rapport')}>Rapport</Link>
      </div>

      <div className="flex justify-end mb-2">
        <Link
          href="/finances/pipeline"
          className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
        >
          Vue pipeline →
        </Link>
      </div>

      {tab === 'devis' && (
        <div className="space-y-3">
          {devis.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucun devis</p>}
          {devis.map((d) => (
            <DevisCard key={d.id} devis={d} clientNom={(d.client as { nom: string }).nom} />
          ))}
        </div>
      )}

      {tab === 'factures' && (
        <div className="space-y-3">
          {factures.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucune facture</p>}
          {factures.map((f) => (
            <FactureCard key={f.id} facture={f} clientNom={(f.client as { nom: string }).nom} />
          ))}
        </div>
      )}

      {tab === 'rapport' && rapport && <RapportFinancier data={rapport} />}
    </div>
  )
}
