'use client'

import { useState } from 'react'
import type { Interaction, Tache } from '@/lib/supabase/types'

interface ClientTabsProps {
  clientId: string
  dernierEchange: Interaction | null
  prochainRappel: Tache | null
}

const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'documents', label: 'Documents' },
  { id: 'taches', label: 'Tâches' },
]

const TYPE_LABEL: Record<string, string> = {
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  reunion: 'Réunion',
  autre: 'Autre',
}

export function ClientTabs({ dernierEchange, prochainRappel }: ClientTabsProps) {
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
                  <span className="text-slate-500 text-xs">
                    {TYPE_LABEL[dernierEchange.type] ?? dernierEchange.type}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">
                    {new Date(dernierEchange.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-white text-sm">{dernierEchange.resume}</p>
                {dernierEchange.suite_a_donner && (
                  <p className="text-amber-400 text-xs mt-2">
                    → {dernierEchange.suite_a_donner}
                  </p>
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
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab !== 'activite' && (
          <p className="text-slate-400 text-sm text-center py-6">
            Module disponible dans une prochaine version
          </p>
        )}
      </div>
    </div>
  )
}
