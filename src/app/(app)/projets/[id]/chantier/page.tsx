import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChantierPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const projetRes = await supabase
    .from('projets')
    .select('id, titre, notes, client_id, client:clients(id, nom, adresse, telephone, email)')
    .eq('id', id)
    .single()

  if (projetRes.error || !projetRes.data) notFound()

  const projet = projetRes.data
  const clientId = projet.client_id

  const [contactsRes, lastEchangeRes] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, prenom, nom, telephone, email, poste')
      .eq('client_id', clientId)
      .limit(10),
    supabase
      .from('interactions')
      .select('date, type, resume')
      .eq('projet_id', id)
      .order('date', { ascending: false })
      .limit(1),
  ])

  const client = projet.client as unknown as {
    id: string
    nom: string
    adresse: string | null
    telephone: string | null
    email: string | null
  } | null

  const contacts = contactsRes.data ?? []
  const lastEchange = lastEchangeRes.data?.[0] ?? null

  const adresse = client?.adresse ?? null
  const mapsUrl = adresse
    ? `https://maps.google.com/?q=${encodeURIComponent(adresse)}`
    : null

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/projets/${id}`}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Projet
        </Link>
        <div>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Sur chantier</p>
          <h1 className="text-white font-bold text-lg leading-tight">{projet.titre}</h1>
        </div>
      </div>

      <div className="space-y-4">
        {/* Address / Maps */}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 hover:bg-sky-500/20 transition-colors"
          >
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-white font-medium text-sm">{adresse}</p>
              <p className="text-sky-400 text-xs mt-0.5">Ouvrir dans Maps →</p>
            </div>
          </a>
        ) : (
          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-slate-500 text-sm">Adresse non renseignée</p>
          </div>
        )}

        {/* Contacts */}
        <div>
          <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
            Contacts
          </h2>
          {contacts.length === 0 ? (
            <div className="bg-slate-800/60 rounded-xl p-4">
              <p className="text-slate-500 text-sm">Aucun contact</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="bg-slate-800/60 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {c.prenom} {c.nom}
                      </p>
                      {c.poste && (
                        <p className="text-slate-500 text-xs mt-0.5">{c.poste}</p>
                      )}
                    </div>
                    {c.telephone && (
                      <a
                        href={`tel:${c.telephone}`}
                        className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors shrink-0"
                      >
                        📞 Appeler
                      </a>
                    )}
                  </div>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="text-slate-400 text-xs mt-1 block hover:text-slate-200 transition-colors"
                    >
                      {c.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last exchange */}
        {lastEchange && (
          <div>
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Dernier échange
            </h2>
            <div className="bg-slate-800/60 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">
                {new Date(lastEchange.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                · {lastEchange.type}
              </p>
              <p className="text-white text-sm">{lastEchange.resume}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {projet.notes && (
          <div>
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Notes
            </h2>
            <div className="bg-slate-800/60 rounded-xl p-4">
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{projet.notes}</p>
            </div>
          </div>
        )}

        {/* Link back to full project */}
        <Link
          href={`/projets/${id}`}
          className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
        >
          Voir la fiche complète →
        </Link>
      </div>
    </div>
  )
}
