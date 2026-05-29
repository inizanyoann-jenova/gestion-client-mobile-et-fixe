import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EnvoyerDevisButton } from '@/components/finances/envoyer-devis-button'
import { ConvertirModal } from '@/components/finances/convertir-modal'
import type { DevisAvecLignes } from '@/lib/supabase/finance-types'

const STATUT_LABEL: Record<string, string> = {
  brouillon: 'Brouillon', envoyé: 'Envoyé', accepté: 'Accepté', refusé: 'Refusé', expiré: 'Expiré',
}

const STATUT_COLOR: Record<string, string> = {
  brouillon: 'text-slate-400', envoyé: 'text-sky-400', accepté: 'text-emerald-400',
  refusé: 'text-red-400', expiré: 'text-slate-500',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const devis = data as unknown as DevisAvecLignes
  const lignes = [...devis.lignes].sort((a, b) => a.ordre - b.ordre)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/finances" className="text-slate-400 hover:text-white transition-colors text-sm">← Finances</Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-bold">{devis.numero}</h1>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${STATUT_COLOR[devis.statut] ?? 'text-slate-400'}`}>
            {STATUT_LABEL[devis.statut] ?? devis.statut}
          </span>
          <span className="text-slate-400 text-xs">Émis le {devis.date_emission}</span>
        </div>
        <p className="text-white font-semibold">{devis.client.nom}</p>
        {devis.projet && <p className="text-slate-400 text-sm">{devis.projet.titre}</p>}
        <p className="text-slate-500 text-xs mt-1">Validité : {devis.date_validite}</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Lignes</h2>
        {lignes.length === 0 && <p className="text-slate-500 text-sm">Aucune ligne</p>}
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
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{eur(Number(devis.montant_ht))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5%</span><span className="text-white">{eur(Number(devis.montant_tva))}</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total TTC</span><span className="text-sky-400">{eur(Number(devis.montant_ttc))}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/devis/${id}/pdf`}
          className="flex items-center gap-2 text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition-colors font-medium"
        >
          📥 Télécharger PDF
        </a>
        {['brouillon', 'envoyé'].includes(devis.statut) && <EnvoyerDevisButton devisId={id} />}
        {devis.statut === 'brouillon' && (
          <Link href={`/finances/devis/${id}/modifier`} className="flex items-center gap-2 text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition-colors font-medium">
            ✏️ Modifier
          </Link>
        )}
        {devis.statut === 'accepté' && <ConvertirModal devisId={id} />}
      </div>
    </div>
  )
}
