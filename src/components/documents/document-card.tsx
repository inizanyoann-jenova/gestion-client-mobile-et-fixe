'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Document, TypeDocument } from '@/lib/supabase/types'

type DocumentAvecContext = Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface DocumentCardProps {
  document: DocumentAvecContext
}

const TYPE_ICON: Record<TypeDocument, string> = {
  devis: '📄',
  rapport: '📋',
  plan: '📐',
  photo: '📷',
  contrat: '📝',
  autre: '📎',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDownload = async () => {
    if (!doc.storage_path) return
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      if (!res.ok) return
      const json = await res.json()
      if (json.signed_url) window.open(json.signed_url, '_blank')
    } catch {
      // silently fail — user can retry
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-sky-500 rounded-xl p-3 flex items-center gap-3">
      <span className="text-2xl shrink-0">{TYPE_ICON[doc.type]}</span>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
        <p className="text-slate-500 text-xs">
          {formatSize(doc.taille_octets)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
        </p>
        {(doc.client || doc.projet) && (
          <div className="flex gap-2 flex-wrap pt-0.5">
            {doc.client && (
              <Link href={`/clients/${doc.client.id}`} className="text-sky-400 text-xs hover:underline">
                {doc.client.nom}
              </Link>
            )}
            {doc.projet && (
              <Link href={`/projets/${doc.projet.id}`} className="text-slate-400 text-xs hover:underline">
                📁 {doc.projet.titre}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        {doc.storage_path && (
          <button
            aria-label="Télécharger ce document"
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-sky-400 text-xs font-medium hover:text-sky-300 disabled:opacity-50"
          >
            {isDownloading ? '…' : '↓'}
          </button>
        )}
        <button
          aria-label="Supprimer ce document"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-slate-400 hover:text-red-400 text-xs font-medium disabled:opacity-50"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
