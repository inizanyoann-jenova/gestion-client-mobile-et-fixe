'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DocRow {
  id: string
  nom: string
  type: string
  taille_octets: number | null
  storage_path: string | null
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  devis: '📄', rapport: '📋', plan: '📐', photo: '📷', contrat: '📝', autre: '📎',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

interface ClientDocumentsProps {
  clientId: string
}

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/documents?client_id=${clientId}&page=1`)
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
        <Link href="/documents" className="text-sky-400 text-sm font-medium">
          Voir tous →
        </Link>
      </div>

      {documents.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun document</p>
      )}

      {documents.map((doc) => (
        <div key={doc.id} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">{TYPE_ICON[doc.type] ?? '📎'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
            <p className="text-slate-500 text-xs">
              {formatSize(doc.taille_octets)} ·{' '}
              {new Date(doc.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
