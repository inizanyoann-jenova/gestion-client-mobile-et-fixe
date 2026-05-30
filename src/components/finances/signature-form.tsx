'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
}

export function SignatureForm({ token }: Props) {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSign = nom.trim().length >= 2 && accepted

  const handleSign = async () => {
    if (!canSign) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/devis/signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signe_par: nom.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`Erreur : ${data.error ?? 'Une erreur est survenue'}`)
        return
      }
      router.replace(`/devis/${token}/confirme`)
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="text-white font-semibold">Signature électronique</h2>

      <div>
        <label htmlFor="nom-signataire" className="block text-slate-300 text-sm mb-1.5">
          Votre nom complet <span className="text-red-400">*</span>
        </label>
        <input
          id="nom-signataire"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Votre nom et prénom"
          className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="accepte"
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          aria-label="J'accepte les conditions"
          className="mt-0.5 w-4 h-4 accent-sky-500 cursor-pointer"
        />
        <label htmlFor="accepte" className="text-slate-300 text-sm cursor-pointer">
          Je déclare avoir pris connaissance du devis et l&apos;accepte sans réserve.
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        onClick={handleSign}
        disabled={!canSign || loading}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? '…' : '✅ Signer et accepter'}
      </button>

      <p className="text-slate-600 text-xs text-center">
        En signant, vous acceptez électroniquement ce devis. Cette signature a valeur contractuelle.
      </p>
    </div>
  )
}
