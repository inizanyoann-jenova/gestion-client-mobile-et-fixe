'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TypeDocument } from '@/lib/supabase/types'

const TYPE_OPTIONS: { value: TypeDocument; label: string }[] = [
  { value: 'devis', label: 'Devis' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'plan', label: 'Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

export function DocumentUploadButton() {
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
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur upload')
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

  return (
    <>
      <button onClick={openDialog} className="text-sky-400 text-sm font-medium">
        + Ajouter
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto p-0"
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
      >
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Ajouter un document</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as TypeDocument)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Nom</label>
            <input value={docNom} onChange={(e) => setDocNom(e.target.value)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Nom du document" />
          </div>

          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 text-sm hover:border-sky-500 hover:text-sky-400 transition-colors">
              {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, image, max 20 Mo)'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
          </div>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeDialog} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={!selectedFile || isUploading} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
              {isUploading ? 'Upload…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
