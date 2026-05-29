'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProjetForm } from '@/components/projets/projet-form'
import { TacheForm } from '@/components/taches/tache-form'
import { EchangeForm } from '@/components/echanges/echange-form'
import type { Document, Interaction, Projet, Tache, TypeInteraction } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }
type DocumentAvecContext = Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type TacheAvecRelations = Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type InteractionAvecContext = Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface ClientTabsProps {
  clientId: string
  dernierEchange: Interaction | null
  prochainRappel: Tache | null
  projets?: ProjetAvecClient[]
  interactions?: InteractionAvecContext[]
  documents?: DocumentAvecContext[]
  taches?: TacheAvecRelations[]
}

const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'documents', label: 'Documents' },
  { id: 'taches', label: 'Tâches' },
]

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel', email: 'Email', visite: 'Visite', reunion: 'Réunion', autre: 'Autre',
}

const TYPE_COLOR: Record<TypeInteraction, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

const TYPE_ICON: Record<string, string> = {
  devis: '📄', rapport: '📋', plan: '📐', photo: '📷', contrat: '📝', autre: '📎',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function ClientTabs({ clientId, dernierEchange, prochainRappel, projets, interactions, documents, taches }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState('activite')

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-0 border-b border-slate-700 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-4 space-y-3">
        {activeTab === 'activite' && (
          <>
            {dernierEchange ? (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400 text-xs">Dernier échange</span>
                  <span className="text-slate-500 text-xs">{TYPE_LABEL[dernierEchange.type] ?? dernierEchange.type}</span>
                  <span className="text-slate-500 text-xs ml-auto">{new Date(dernierEchange.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-white text-sm">{dernierEchange.resume}</p>
                {dernierEchange.suite_a_donner && (
                  <p className="text-amber-400 text-xs mt-2">→ {dernierEchange.suite_a_donner}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Aucun échange enregistré</p>
            )}
            {prochainRappel && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400 text-xs font-medium mb-1">Prochain rappel</p>
                <p className="text-white text-sm font-medium">{prochainRappel.titre}</p>
                {prochainRappel.date_echeance && (
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(prochainRappel.date_echeance).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'projets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ProjetForm mode="create" clientId={clientId} />
            </div>
            {(!projets || projets.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucun projet pour ce client</p>
            )}
            {projets?.map((projet) => (
              <Link key={projet.id} href={`/projets/${projet.id}`} className="block bg-slate-800 rounded-xl p-3 active:bg-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium truncate">{projet.titre}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    projet.statut === 'termine' ? 'bg-emerald-500/20 text-emerald-400' :
                    projet.statut === 'en_cours' ? 'bg-amber-500/20 text-amber-400' :
                    projet.statut === 'sav' ? 'bg-red-500/20 text-red-400' :
                    'bg-sky-500/20 text-sky-400'
                  }`}>
                    {projet.statut === 'en_etude' ? 'En étude' :
                     projet.statut === 'en_cours' ? 'En cours' :
                     projet.statut === 'termine' ? 'Terminé' : 'SAV'}
                  </span>
                </div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${projet.avancement}%` }} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'echanges' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">{interactions?.length ?? 0} échange{(interactions?.length ?? 0) !== 1 ? 's' : ''}</span>
              <EchangeForm clientId={clientId} />
            </div>
            {(!interactions || interactions.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucun échange pour ce client</p>
            )}
            {interactions?.map((interaction) => (
              <div key={interaction.id} className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[interaction.type]}`}>
                    {TYPE_LABEL[interaction.type]}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">
                    {new Date(interaction.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-white text-sm line-clamp-2">{interaction.resume}</p>
                {interaction.suite_a_donner && (
                  <p className="text-amber-400 text-xs mt-2">→ {interaction.suite_a_donner}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">{documents?.length ?? 0} fichier{(documents?.length ?? 0) !== 1 ? 's' : ''}</span>
              <Link href="/documents" className="text-sky-400 text-xs font-medium">Voir tous</Link>
            </div>
            {(!documents || documents.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucun document pour ce client</p>
            )}
            {documents?.map((doc) => (
              <div key={doc.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl shrink-0">{TYPE_ICON[doc.type] ?? '📎'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
                  <p className="text-slate-500 text-xs">{formatSize(doc.taille_octets)}</p>
                </div>
                {doc.projet && (
                  <Link href={`/projets/${doc.projet.id}`} className="text-slate-400 text-xs hover:text-sky-400 shrink-0 truncate max-w-[100px]">
                    {doc.projet.titre}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'taches' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">{taches?.filter(t => t.statut === 'a_faire').length ?? 0} à faire</span>
              <TacheForm clientId={clientId} />
            </div>
            {(!taches || taches.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucune tâche pour ce client</p>
            )}
            {taches?.map((tache) => (
              <div key={tache.id} className={`bg-slate-800 rounded-xl p-3 flex items-center gap-3${tache.statut === 'fait' ? ' opacity-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  tache.priorite === 'haute' ? 'bg-red-400' :
                  tache.priorite === 'normale' ? 'bg-amber-400' : 'bg-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tache.titre}</p>
                  {tache.date_echeance && (
                    <p className="text-slate-400 text-xs">
                      {new Date(tache.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                {tache.projet && (
                  <Link href={`/projets/${tache.projet.id}`} className="text-slate-400 text-xs hover:text-sky-400 shrink-0 truncate max-w-[100px]">
                    {tache.projet.titre}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
