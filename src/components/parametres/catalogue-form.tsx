'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Prestation } from '@/lib/supabase/finance-types'

const UNITES = ['u', 'h', 'm', 'm²', 'forfait']

interface CatalogueFormProps {
  prestations: Prestation[]
}

export function CatalogueForm({ prestations }: CatalogueFormProps) {
  const router = useRouter()
  const [libelle, setLibelle] = useState('')
  const [description, setDescription] = useState('')
  const [unite, setUnite] = useState('u')
  const [prixUnitaire, setPrixUnitaire] = useState('')
  const [tauxTva, setTauxTva] = useState('8.5')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const inputCls = 'w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!libelle.trim()) { setError('Libellé requis'); return }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/prestations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libelle: libelle.trim(),
        description: description.trim() || null,
        unite,
        prix_unitaire: parseFloat(prixUnitaire) || 0,
        taux_tva: parseFloat(tauxTva) || 8.5,
      }),
    }).catch(() => null)
    setSaving(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }
    setLibelle('')
    setDescription('')
    setPrixUnitaire('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  const handleDesactiver = async (id: string) => {
    await fetch(`/api/prestations/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {prestations.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucune prestation dans le catalogue</p>}
        {prestations.map((p) => (
          <div key={p.id} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{p.libelle}</p>
              <p className="text-slate-400 text-xs">{p.prix_unitaire} € HT / {p.unite} — TVA {p.taux_tva}%</p>
            </div>
            <button
              onClick={() => handleDesactiver(p.id)}
              className="text-slate-500 hover:text-red-400 text-xs shrink-0 transition-colors"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-slate-300 text-sm font-semibold">Ajouter une prestation</h3>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Désignation *</label>
          <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex : Installation tableau électrique" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Description (optionnel)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détail de la prestation" className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Prix HT (€)</label>
            <input type="number" min="0" step="0.01" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Unité</label>
            <select value={unite} onChange={(e) => setUnite(e.target.value)} className={inputCls}>
              {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">TVA %</label>
            <input type="number" min="0" step="0.5" value={tauxTva} onChange={(e) => setTauxTva(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">Prestation ajoutée ✓</p>}
        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
          {saving ? 'Ajout…' : '+ Ajouter au catalogue'}
        </button>
      </form>
    </div>
  )
}
