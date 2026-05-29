'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PdfType = 'rapport' | 'devis'

const TYPE_LABEL: Record<PdfType, string> = {
  rapport: "Rapport d'intervention",
  devis: 'Devis',
}

interface PdfGenerateButtonProps {
  type: PdfType
  projetId: string
  clientId: string
  resume?: string
}

export function PdfGenerateButton({ type, projetId, clientId, resume }: PdfGenerateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/documents/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, projet_id: projetId, client_id: clientId, resume }),
    }).catch(() => null)

    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string })?.error ?? 'Erreur génération PDF')
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg hover:bg-sky-500/30 transition-colors disabled:opacity-50"
      >
        {loading ? '⏳' : '📄'} {TYPE_LABEL[type]}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
