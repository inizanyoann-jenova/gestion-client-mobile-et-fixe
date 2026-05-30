import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Devis, StatutDevis } from '@/lib/supabase/finance-types'

const COLONNES: { statut: StatutDevis; label: string; color: string; dot: string }[] = [
  { statut: 'brouillon', label: 'Brouillon', color: 'border-slate-500', dot: 'bg-slate-400' },
  { statut: 'envoyé', label: 'Envoyé', color: 'border-sky-500', dot: 'bg-sky-400' },
  { statut: 'accepté', label: 'Accepté', color: 'border-emerald-500', dot: 'bg-emerald-400' },
  { statut: 'refusé', label: 'Refusé', color: 'border-red-500', dot: 'bg-red-400' },
  { statut: 'expiré', label: 'Expiré', color: 'border-amber-500', dot: 'bg-amber-400' },
]

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

type DevisAvecClient = Devis & { client: { id: string; nom: string } }

async function getPipeline() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('devis')
    .select('*, client:clients(id, nom)')
    .order('date_emission', { ascending: false })

  const devis = (data ?? []) as unknown as DevisAvecClient[]
  const map = new Map<StatutDevis, DevisAvecClient[]>()
  for (const col of COLONNES) map.set(col.statut, [])
  for (const d of devis) {
    const col = map.get(d.statut as StatutDevis)
    if (col) col.push(d)
  }
  return map
}

export default async function PipelinePage() {
  const pipeline = await getPipeline()

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/finances" className="text-slate-400 hover:text-white transition-colors">
          ← Finances
        </Link>
        <h1 className="text-xl font-bold text-white">Pipeline devis</h1>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
        {COLONNES.map(({ statut, label, color, dot }) => {
          const cards = pipeline.get(statut) ?? []
          const total = cards.reduce((s, d) => s + Number(d.montant_ttc), 0)

          return (
            <div
              key={statut}
              className={`flex-shrink-0 w-64 bg-slate-800/60 rounded-xl border-t-2 ${color} p-3`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-slate-300 text-sm font-semibold">{label}</span>
                  <span className="text-slate-500 text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">
                    {cards.length}
                  </span>
                </div>
              </div>

              {cards.length > 0 && (
                <p className="text-slate-400 text-xs mb-3">{eur(total)}</p>
              )}

              {/* Cards */}
              <div className="space-y-2">
                {cards.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-4">—</p>
                )}
                {cards.map((d) => (
                  <Link
                    key={d.id}
                    href={`/finances/devis/${d.id}`}
                    className="block bg-slate-900/60 rounded-lg p-3 hover:bg-slate-700/60 transition-colors"
                  >
                    <p className="text-white text-xs font-semibold">{d.numero}</p>
                    <p className="text-slate-400 text-xs mt-1 truncate">
                      {(d.client as { nom: string }).nom}
                    </p>
                    <p className="text-slate-300 text-xs font-medium mt-1">
                      {eur(Number(d.montant_ttc))}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {new Date(d.date_emission).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
