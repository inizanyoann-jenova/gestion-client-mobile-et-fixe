'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConvertirModalProps {
  devisId: string
}

export function ConvertirModal({ devisId }: ConvertirModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'unique' | 'acompte_solde'>('unique')
  const [pourcentage, setPourcentage] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvertir = async () => {
    setLoading(true)
    setError(null)
    const body = mode === 'unique' ? { mode } : { mode, pourcentage_acompte: pourcentage }
    const res = await fetch(`/api/devis/${devisId}/convertir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }
    setOpen(false)
    router.push('/finances?tab=factures')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
      >
        📄 Créer la facture
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-white font-bold text-lg mb-4">Mode de paiement</h2>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="mode" value="unique" checked={mode === 'unique'} onChange={() => setMode('unique')} className="text-sky-500" />
                <span className="text-white text-sm">Paiement unique (100%)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="mode" value="acompte_solde" checked={mode === 'acompte_solde'} onChange={() => setMode('acompte_solde')} className="text-sky-500" />
                <span className="text-white text-sm">Acompte + Solde</span>
              </label>
            </div>

            {mode === 'acompte_solde' && (
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-1">Pourcentage d&apos;acompte</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={pourcentage}
                    onChange={(e) => setPourcentage(parseInt(e.target.value) || 30)}
                    className="w-24 bg-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-slate-400 text-sm">%</span>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleConvertir}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
