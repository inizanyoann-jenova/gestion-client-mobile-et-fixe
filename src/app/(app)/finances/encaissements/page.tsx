import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { RelancerButton } from '@/components/finances/relancer-button'
import type { Facture } from '@/lib/supabase/finance-types'

type FactureImpayee = Facture & {
  client: { id: string; nom: string }
  joursRetard: number
}

async function getImpayees() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('factures')
    .select('*, client:clients(id, nom)')
    .in('statut', ['émise', 'en_retard'])
    .order('date_echeance', { ascending: true })

  const now = Date.now()
  const factures = ((data ?? []) as unknown as (Facture & { client: { id: string; nom: string } })[])
    .map((f): FactureImpayee => ({
      ...f,
      joursRetard: Math.max(
        0,
        Math.floor((now - new Date(f.date_echeance).getTime()) / 86_400_000)
      ),
    }))

  const totalImpaye = factures.reduce((s, f) => s + Number(f.montant_ttc), 0)
  return { factures, totalImpaye }
}

function RetardBadge({ jours, statut }: { jours: number; statut: string }) {
  if (statut === 'en_retard' && jours > 0) {
    const color = jours >= 30 ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10'
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
        J+{jours}
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-sky-400 bg-sky-400/10">
      En attente
    </span>
  )
}

export default async function EncaissementsPage() {
  const { factures, totalImpaye } = await getImpayees()

  const eur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/finances" className="text-slate-400 hover:text-white transition-colors">
          ← Finances
        </Link>
        <h1 className="text-xl font-bold text-white">Encaissements</h1>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">Total impayé</p>
          <p className="text-2xl font-bold text-white mt-1">{eur(totalImpaye)}</p>
        </div>
        <p className="text-sm text-slate-400">{factures.length} facture{factures.length > 1 ? 's' : ''}</p>
      </div>

      {factures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">Aucune facture en attente</p>
          <Link href="/finances" className="text-sky-400 text-sm mt-2 inline-block hover:underline">
            Retour aux finances
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {factures.map((f) => (
          <div
            key={f.id}
            className="bg-slate-800/60 rounded-xl p-4 border-l-4 border-amber-500"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-white font-semibold text-sm">{f.client.nom}</p>
                <p className="text-slate-400 text-xs mt-0.5">Facture {f.numero}</p>
              </div>
              <RetardBadge jours={f.joursRetard} statut={f.statut} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-white font-bold">{eur(Number(f.montant_ttc))}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Échéance : {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <RelancerButton factureId={f.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
