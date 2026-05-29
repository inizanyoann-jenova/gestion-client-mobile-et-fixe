'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProjetForm } from '@/components/projets/projet-form'
import type { Interaction, Projet, Tache, TypeInteraction } from '@/lib/supabase/types'
import { ClientEchanges } from './client-echanges'
import { ClientDocuments } from './client-documents'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }

interface ClientTabsProps {
  clientId: string
  dernierEchange: Interaction | null
  prochainRappel: Tache | null
  projets?: ProjetAvecClient[]
}

const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'documents', label: 'Documents' },
  { id: 'finances', label: 'Finances' },
  { id: 'taches', label: 'Tâches' },
]

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel', email: 'Email', visite: 'Visite', reunion: 'Réunion', autre: 'Autre',
}

export function ClientTabs({ clientId, dernierEchange, prochainRappel, projets }: ClientTabsProps) {
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
          <ClientEchanges clientId={clientId} />
        )}

        {activeTab === 'documents' && (
          <ClientDocuments clientId={clientId} />
        )}

        {activeTab === 'taches' && (
          <p className="text-slate-400 text-sm text-center py-6">
            Voir l&apos;onglet Tâches global
          </p>
        )}

        {activeTab === 'finances' && (
          <div className="text-center py-6">
            <a href={`/finances?client_id=${clientId}`} className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Voir les devis et factures de ce client →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
