'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DevisLigneRow, type LigneState } from './devis-ligne-row'
import { computeTotaux } from '@/lib/utils/finance-totaux'
import type { Client } from '@/lib/supabase/types'
import type { Prestation, Devis, DevisLigne } from '@/lib/supabase/finance-types'

interface DevisFormProps {
  clients: Client[]
  prestations?: Prestation[]
  initialDevis?: Devis & { lignes: DevisLigne[] }
}

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function plus30(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

function newLigne(ordre: number): LigneState {
  return { prestation_id: null, libelle: '', quantite: 1, unite: 'u', prix_unitaire: 0, taux_tva: 8.5, ordre }
}

export function DevisForm({ clients, prestations = [], initialDevis }: DevisFormProps) {
  const router = useRouter()
  const isEdit = !!initialDevis

  const [clientId, setClientId] = useState(initialDevis?.client_id ?? '')
  const [dateEmission, setDateEmission] = useState(initialDevis?.date_emission ?? todayStr())
  const [dateValidite, setDateValidite] = useState(initialDevis?.date_validite ?? plus30())
  const [notes, setNotes] = useState(initialDevis?.notes ?? '')
  const [lignes, setLignes] = useState<LigneState[]>(
    initialDevis?.lignes.map((l) => ({
      prestation_id: l.prestation_id,
      libelle: l.libelle,
      quantite: Number(l.quantite),
      unite: l.unite,
      prix_unitaire: Number(l.prix_unitaire),
      taux_tva: Number(l.taux_tva),
      ordre: l.ordre,
    })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totaux = computeTotaux(lignes)

  const addLigne = () => setLignes((prev) => [...prev, newLigne(prev.length)])
  const updateLigne = (i: number, l: LigneState) => setLignes((prev) => prev.map((x, j) => (j === i ? l : x)))
  const removeLigne = (i: number) => setLignes((prev) => prev.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) { setError('Sélectionner un client'); return }
    if (!dateValidite) { setError('Date de validité requise'); return }

    setSaving(true)
    setError(null)

    const payload = {
      client_id: clientId,
      date_emission: dateEmission,
      date_validite: dateValidite,
      notes: notes || null,
      lignes: lignes.map((l, i) => ({ ...l, ordre: i })),
    }

    const url = isEdit ? `/api/devis/${initialDevis!.id}` : '/api/devis'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)

    setSaving(false)

    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }

    const data = await res.json()
    router.push(`/finances/devis/${data.id}`)
    router.refresh()
  }

  const inputCls = 'w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="client" className="block text-sm text-slate-300 mb-1">Client *</label>
        <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
          <option value="">Sélectionner un client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date-emission" className="block text-sm text-slate-300 mb-1">Date d&apos;émission</label>
          <input id="date-emission" type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="date-validite" className="block text-sm text-slate-300 mb-1">Validité jusqu&apos;au *</label>
          <input id="date-validite" type="date" value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-300 text-sm font-semibold">Lignes du devis</h2>
          <button type="button" onClick={addLigne} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
            + Ajouter une ligne
          </button>
        </div>
        {lignes.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">Aucune ligne — cliquer sur &quot;Ajouter une ligne&quot;</p>
        )}
        <div className="space-y-3">
          {lignes.map((l, i) => (
            <DevisLigneRow key={i} ligne={l} index={i} prestations={prestations} onChange={updateLigne} onRemove={removeLigne} />
          ))}
        </div>
      </div>

      {lignes.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{totaux.montant_ht.toFixed(2)} €</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5%</span><span className="text-white">{totaux.montant_tva.toFixed(2)} €</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total TTC</span><span className="text-sky-400">{totaux.montant_ttc.toFixed(2)} €</span></div>
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-300 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Conditions particulières, délais, modalités..." className={inputCls} />
      </div>

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour le devis' : 'Enregistrer le devis'}
      </button>
    </form>
  )
}
