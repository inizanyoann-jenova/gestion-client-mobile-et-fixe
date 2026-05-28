'use client'

import { useState } from 'react'
import { ClientForm } from '@/components/clients/client-form'
import { ProjetForm } from '@/components/projets/projet-form'
import { TacheForm } from '@/components/taches/tache-form'

export function FabCreate() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-30">
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-14 right-0 flex flex-col gap-2 items-end z-30">
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 shadow-lg">
              <span className="text-white text-sm">Nouveau client</span>
              <ClientForm mode="create" />
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 shadow-lg">
              <span className="text-white text-sm">Nouveau projet</span>
              <ProjetForm mode="create" />
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 shadow-lg">
              <span className="text-white text-sm">Nouvelle tâche</span>
              <TacheForm />
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-3xl font-light shadow-lg transition-all flex items-center justify-center ${
          open ? 'rotate-45' : ''
        }`}
        aria-label="Créer"
      >
        +
      </button>
    </div>
  )
}
