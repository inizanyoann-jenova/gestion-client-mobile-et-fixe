import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MarquerPayeeButton } from '@/components/finances/marquer-payee-button'
import { EnvoyerFactureButton } from '@/components/finances/envoyer-facture-button'
import type { FactureAvecLignes } from '@/lib/supabase/finance-types'

const STATUT_COLOR: Record<string, string> = {
  émise: 'text-sky-400', payée: 'text-emerald-400', en_retard: 'text-red-400',
}
const TYPE_LABEL: Record<string, string> = {
  facture: 'Facture', acompte: "Facture d'acompte", solde: 'Facture de solde',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('factures')
    .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre), devis:devis(numero)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const facture = data as unknown as FactureAvecLignes & { devis: { numero: string } | null }
  const lignes = [...facture.lignes].sort((a, b) => a.ordre - b.ordre)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/finances?tab=factures" className="text-slate-400 hover:text-white transition-colors text-sm">← Finances</Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-bold">{facture.numero}</h1>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">{TYPE_LABEL[facture.type] ?? 'Facture'}</span>
          <span className={`text-sm font-medium ${STATUT_COLOR[facture.statut] ?? 'text-slate-400'}`}>{facture.statut}</span>
        </div>
        <p className="text-white font-semibold">{facture.client.nom}</p>
        {facture.projet && <p className="text-slate-400 text-sm">{facture.projet.titre}</p>}
        {facture.devis_numero && <p className="text-slate-500 text-xs">Réf. devis : {facture.devis_numero}</p>}
        <div className="flex gap-4 mt-2">
          <p className="text-slate-500 text-xs">Émis le {facture.date_emission}</p>
          <p className="text-slate-500 text-xs">Échéance : {facture.date_echeance}</p>
        </div>
        {facture.date_paiement && <p className="text-emerald-400 text-xs mt-1">Payée le {facture.date_paiement}</p>}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Lignes</h2>
        <div className="space-y-2">
          {lignes.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-2 py-2 border-b border-slate-700 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{l.libelle}</p>
                <p className="text-slate-500 text-xs">{l.quantite} {l.unite} × {eur(Number(l.prix_unitaire))} HT</p>
              </div>
              <p className="text-white text-sm font-medium shrink-0">{eur(Number(l.total_ht))}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{eur(Number(facture.montant_ht))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5%</span><span className="text-white">{eur(Number(facture.montant_tva))}</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total TTC</span><span className="text-sky-400">{eur(Number(facture.montant_ttc))}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`/api/factures/${id}/pdf`} className="flex items-center gap-2 text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition-colors font-medium">
          📥 Télécharger PDF
        </a>
        <EnvoyerFactureButton factureId={id} />
        {facture.statut !== 'payée' && <MarquerPayeeButton factureId={id} />}
      </div>
    </div>
  )
}
