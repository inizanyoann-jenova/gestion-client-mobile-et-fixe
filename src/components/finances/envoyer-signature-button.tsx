'use client'

import { useState } from 'react'

export function EnvoyerSignatureButton({ devisId }: { devisId: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleClick = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch(`/api/devis/${devisId}/envoyer-signature`, { method: 'POST' })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading || status === 'success'}
        className="flex items-center gap-2 text-sm bg-emerald-700 text-emerald-100 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? (
          <span>...</span>
        ) : (
          <span>
            ✍️ {status === 'success' ? 'Lien envoyé ✓' : 'Envoyer pour signature'}
          </span>
        )}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs">Erreur lors de l&apos;envoi. Réessayez.</p>
      )}
    </div>
  )
}
