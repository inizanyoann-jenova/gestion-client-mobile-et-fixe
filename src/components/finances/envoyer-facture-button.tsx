'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EnvoyerFactureButton({ factureId }: { factureId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleEnvoyer = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/factures/${factureId}/envoyer`, { method: 'POST' }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur envoi')
      return
    }
    setSent(true)
    router.refresh()
  }

  if (sent) return <p className="text-emerald-400 text-sm">Facture envoyée ✓</p>

  return (
    <div>
      <button
        onClick={handleEnvoyer}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-sky-500/20 text-sky-400 px-4 py-2 rounded-xl hover:bg-sky-500/30 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? '⏳' : '📧'} {loading ? 'Envoi…' : 'Envoyer par email'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1" role="alert">{error}</p>}
    </div>
  )
}
