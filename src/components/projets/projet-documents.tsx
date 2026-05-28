'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Document, TypeDocument } from '@/lib/supabase/types'

interface ProjetDocumentsProps {
  documents: Document[]
  projetId: string
}

const TYPE_ICON: Record<TypeDocument, string> = {
  devis: '📄',
  rapport: '📋',
  plan: '📐',
  photo: '📷',
  contrat: '📝',
  autre: '📎',
}

const TYPE_OPTIONS: { value: TypeDocument; label: string }[] = [
  { value: 'devis', label: 'Devis' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'plan', label: 'Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function ProjetDocuments({ documents, projetId }: ProjetDocumentsProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<TypeDocument>('autre')
  const [docNom, setDocNom] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openDialog = () => {
    setSelectedFile(null)
    setDocNom('')
    setDocType('autre')
    setError(null)
    dialogRef.current?.showModal()
  }
  const closeDialog = () => dialogRef.current?.close()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file && !docNom) setDocNom(file.name.replace(/\.[^.]+$/, ''))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('meta', JSON.stringify({ nom: docNom || selectedFile.name, type: docType }))

    try {
      const res = await fetch(`/api/projets/${projetId}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Erreur upload')
        return
      }
      closeDialog()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    if (!doc.storage_path) return
    try {
      const res = await fetch(`/api/projets/${projetId}/documents?path=${encodeURIComponent(doc.storage_path)}`)
      const { url } = await res.json()
      if (url) window.open(url, '_blank')
    } catch {
      // download will be wired in a future plan
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">{documents.length} fichier{documents.length !== 1 ? 's' : ''}</span>
        <button onClick={openDialog} className="text-sky-400 text-sm font-medium">
          + Ajouter
        </button>
      </div>

      {documents.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun document</p>
      )}

      {documents.map((doc) => (
        <div key={doc.id} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">{TYPE_ICON[doc.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
            <p className="text-slate-500 text-xs">
              {formatSize(doc.taille_octets)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          {doc.storage_path && (
            <button
              onClick={() => handleDownload(doc)}
              className="text-sky-400 text-xs font-medium shrink-0"
            >
              ↓ Télécharger
            </button>
          )}
        </div>
      ))}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
      >
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Ajouter un document</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as TypeDocument)}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Nom</label>
            <input
              value={docNom}
              onChange={(e) => setDocNom(e.target.value)}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nom du document"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 text-sm hover:border-sky-500 hover:text-sky-400 transition-colors"
            >
              {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, image, max 20 Mo)'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeDialog} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">
              Annuler
            </button>
            <button type="submit" disabled={!selectedFile || isUploading} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
              {isUploading ? 'Upload…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
