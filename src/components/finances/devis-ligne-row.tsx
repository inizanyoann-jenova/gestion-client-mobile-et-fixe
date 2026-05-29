'use client'

import { computeTotalHtLigne } from '@/lib/utils/finance-totaux'
import type { Prestation } from '@/lib/supabase/finance-types'

export interface LigneState {
  prestation_id: string | null
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  ordre: number
}

interface DevisLigneRowProps {
  ligne: LigneState
  index: number
  prestations: Prestation[]
  onChange: (index: number, ligne: LigneState) => void
  onRemove: (index: number) => void
}

const UNITES = ['u', 'h', 'm', 'm²', 'forfait']

export function DevisLigneRow({ ligne, index, prestations, onChange, onRemove }: DevisLigneRowProps) {
  const totalHt = computeTotalHtLigne(ligne.quantite, ligne.prix_unitaire)

  const set = (patch: Partial<LigneState>) => onChange(index, { ...ligne, ...patch })

  const handlePrestationSelect = (prestationId: string) => {
    if (!prestationId) { set({ prestation_id: null }); return }
    const p = prestations.find((pr) => pr.id === prestationId)
    if (p) set({ prestation_id: p.id, libelle: p.libelle, unite: p.unite, prix_unitaire: Number(p.prix_unitaire), taux_tva: Number(p.taux_tva) })
  }

  const inputCls = 'w-full bg-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500'

  return (
    <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">Ligne {index + 1}</span>
        <button type="button" onClick={() => onRemove(index)} className="text-slate-500 hover:text-red-400 text-xs transition-colors">
          Supprimer
        </button>
      </div>

      {prestations.length > 0 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catalogue (optionnel)</label>
          <select
            value={ligne.prestation_id ?? ''}
            onChange={(e) => handlePrestationSelect(e.target.value)}
            className={inputCls}
          >
            <option value="">Saisie libre</option>
            {prestations.map((p) => (
              <option key={p.id} value={p.id}>{p.libelle}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1">Désignation *</label>
        <input
          value={ligne.libelle}
          onChange={(e) => set({ libelle: e.target.value })}
          placeholder="Ex : Installation tableau électrique"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Quantité</label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={ligne.quantite}
            onChange={(e) => set({ quantite: parseFloat(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Unité</label>
          <select value={ligne.unite} onChange={(e) => set({ unite: e.target.value })} className={inputCls}>
            {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">TVA %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={ligne.taux_tva}
            onChange={(e) => set({ taux_tva: parseFloat(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Prix unitaire HT (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={ligne.prix_unitaire}
            onChange={(e) => set({ prix_unitaire: parseFloat(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Total HT</label>
          <p className="text-white text-sm font-semibold py-2">{totalHt.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  )
}
