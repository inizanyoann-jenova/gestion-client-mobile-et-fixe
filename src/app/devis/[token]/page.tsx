import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { SignatureForm } from '@/components/finances/signature-form'
import type { DevisAvecLignes, DevisToken } from '@/lib/supabase/finance-types'

function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function DevisPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow, error: tokenError } = await supabase
    .from('devis_tokens')
    .select('id, devis_id, expires_at, signed_at, signe_par')
    .eq('token', token)
    .single()

  if (tokenError || !tokenRow) notFound()

  const row = tokenRow as unknown as DevisToken

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret)')
    .eq('id', row.devis_id)
    .single()

  if (devisError || !devis) notFound()

  const d = devis as unknown as DevisAvecLignes
  const lignes = [...d.lignes].sort((a, b) => a.ordre - b.ordre)
  const isExpired = new Date(row.expires_at) < new Date()
  const isSigned = !!row.signed_at

  if (isExpired && !isSigned) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏰</div>
        <h1 className="text-xl font-bold text-white mb-2">Lien expiré</h1>
        <p className="text-slate-400 text-sm">Ce lien de signature n&apos;est plus valide. Contactez ATEXIA pour obtenir un nouveau lien.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête devis */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">{d.numero}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Émis le {d.date_emission} · Valable jusqu&apos;au {d.date_validite}</p>
        </div>
        <p className="text-white font-medium">{d.client.nom}</p>
        {d.client.adresse && <p className="text-slate-400 text-sm">{d.client.adresse}</p>}
        {d.client.siret && <p className="text-slate-500 text-xs mt-0.5">SIRET : {d.client.siret}</p>}
      </div>

      {/* Lignes du devis */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">Détail des prestations</h2>
        <div className="space-y-3">
          {lignes.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700 last:border-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{l.libelle}</p>
                <p className="text-slate-500 text-xs mt-0.5">{l.quantite} {l.unite} × {eur(Number(l.prix_unitaire))} HT</p>
              </div>
              <p className="text-white text-sm font-medium shrink-0">{eur(Number(l.total_ht))}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{eur(Number(d.montant_ht))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5 %</span><span className="text-white">{eur(Number(d.montant_tva))}</span></div>
          <div className="flex justify-between text-base font-bold mt-1"><span className="text-white">Total TTC</span><span className="text-sky-400">{eur(Number(d.montant_ttc))}</span></div>
        </div>
      </div>

      {/* Formulaire de signature ou confirmation */}
      {isSigned ? (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-2xl p-5 text-center">
          <p className="text-emerald-400 font-semibold">✓ Devis accepté</p>
          <p className="text-slate-400 text-sm mt-1">
            Signé le {new Date(row.signed_at!).toLocaleDateString('fr-FR')} par <strong className="text-white">{row.signe_par}</strong>
          </p>
        </div>
      ) : (
        <SignatureForm token={token} />
      )}
    </div>
  )
}
