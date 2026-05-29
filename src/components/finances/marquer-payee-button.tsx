'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarquerPayeeButton({ factureId }: { factureId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMarquer = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/factures/${factureId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_paiement: datePaiement }),
    }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
      >
        ✅ Marquer payée
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-white font-bold text-lg mb-4">Date de paiement</h2>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">Annuler</button>
              <button
                onClick={handleMarquer}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
