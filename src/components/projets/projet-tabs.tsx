'use client'

import { useState } from 'react'
import { ProjetDocuments } from './projet-documents'
import { ProjetTaches } from './projet-taches'
import { ProjetInteractions } from './projet-interactions'
import { ProjetNotes } from './projet-notes'
import type { Tache, Interaction, Document } from '@/lib/supabase/types'

interface ProjetTabsProps {
  projetId: string
  taches: Tache[]
  interactions: Interaction[]
  documents: Document[]
  initialNotes: string
}

const TABS = [
  { id: 'taches', label: 'Tâches' },
  { id: 'documents', label: 'Documents' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'notes', label: 'Notes' },
  { id: 'finances', label: 'Finances' },
]

export function ProjetTabs({ projetId, taches, interactions, documents, initialNotes }: ProjetTabsProps) {
  const [activeTab, setActiveTab] = useState('taches')

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

      <div className="py-4">
        {activeTab === 'taches' && (
          <ProjetTaches taches={taches} projetId={projetId} />
        )}
        {activeTab === 'documents' && (
          <ProjetDocuments documents={documents} projetId={projetId} />
        )}
        {activeTab === 'echanges' && (
          <ProjetInteractions interactions={interactions} projetId={projetId} />
        )}
        {activeTab === 'notes' && (
          <ProjetNotes initialNotes={initialNotes} projetId={projetId} />
        )}
        {activeTab === 'finances' && (
          <div className="text-center py-6">
            <a href="/finances" className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Voir les devis et factures liés →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
