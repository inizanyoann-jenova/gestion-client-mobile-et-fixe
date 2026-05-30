import Link from 'next/link'

export type AlerteDevis = {
  id: string
  numero: string
  clientNom: string
  joursAttente: number
}

export type AlerteClient = {
  id: string
  nom: string
  joursDormant: number
}

interface AlertesIntelligentesProps {
  devisSansReponse: AlerteDevis[]
  clientsDormants: AlerteClient[]
}

export function AlertesIntelligentes({
  devisSansReponse,
  clientsDormants,
}: AlertesIntelligentesProps) {
  const total = devisSansReponse.length + clientsDormants.length
  if (total === 0) return null

  return (
    <section>
      <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
        Alertes
      </h2>
      <div className="space-y-2">
        {devisSansReponse.map((d) => (
          <Link
            key={d.id}
            href={`/finances/devis/${d.id}`}
            className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 hover:bg-amber-500/15 transition-colors"
          >
            <div>
              <p className="text-white text-sm font-medium">Devis {d.numero}</p>
              <p className="text-slate-400 text-xs mt-0.5">{d.clientNom} — sans réponse</p>
            </div>
            <span className="text-amber-400 text-xs font-semibold shrink-0 ml-2">
              {d.joursAttente}j
            </span>
          </Link>
        ))}

        {clientsDormants.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="flex items-center justify-between bg-slate-700/40 border border-slate-600/30 rounded-xl px-4 py-3 hover:bg-slate-700/60 transition-colors"
          >
            <div>
              <p className="text-white text-sm font-medium">{c.nom}</p>
              <p className="text-slate-400 text-xs mt-0.5">Pas d&apos;échange récent</p>
            </div>
            <span className="text-slate-400 text-xs font-semibold shrink-0 ml-2">
              {c.joursDormant}j
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
