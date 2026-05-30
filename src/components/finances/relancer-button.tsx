'use client'
import { useState } from 'react'

export function RelancerButton({ factureId }: { factureId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleClick() {
    setStatus('loading')
    const res = await fetch(`/api/factures/${factureId}/relancer`, { method: 'POST' })
    setStatus(res.ok ? 'sent' : 'error')
    if (res.ok) setTimeout(() => setStatus('idle'), 3000)
  }

  if (status === 'sent') {
    return (
      <span className="text-xs text-emerald-400 font-medium px-3 py-1.5">
        ✓ Relance envoyée
      </span>
    )
  }

  if (status === 'error') {
    return (
      <button
        onClick={handleClick}
        className="text-xs text-red-400 font-medium px-3 py-1.5 border border-red-400/30 rounded-lg"
      >
        Erreur — Réessayer
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className="text-xs bg-amber-500/20 text-amber-300 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50"
    >
      {status === 'loading' ? '...' : 'Relancer'}
    </button>
  )
}
