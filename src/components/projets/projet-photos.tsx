'use client'
import { useState, useEffect, useRef } from 'react'

interface Photo {
  name: string
  signedUrl: string
  path: string
}

export function ProjetPhotos({ projetId }: { projetId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadPhotos() {
    setLoading(true)
    const res = await fetch(`/api/projets/${projetId}/photos`)
    if (res.ok) {
      const data = await res.json() as { photos: Photo[] }
      setPhotos(data.photos)
    }
    setLoading(false)
  }

  useEffect(() => { loadPhotos() }, [projetId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('photo', file)
    await fetch(`/api/projets/${projetId}/photos`, { method: 'POST', body: fd })
    await loadPhotos()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(path: string) {
    await fetch(`/api/projets/${projetId}/photos/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    setPhotos((prev) => prev.filter((p) => p.path !== path))
  }

  if (loading) {
    return <div className="text-slate-400 text-sm text-center py-8">Chargement...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-xs">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Upload...' : '+ Photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {photos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">Aucune photo</p>
          <p className="text-slate-600 text-xs mt-1">Appuyez sur + Photo pour prendre ou importer une photo</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo) => (
          <div key={photo.path} className="relative group rounded-xl overflow-hidden bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.signedUrl}
              alt=""
              className="w-full aspect-square object-cover"
            />
            <button
              onClick={() => handleDelete(photo.path)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Supprimer la photo"
            >
              ✕
            </button>
            <p className="text-slate-500 text-xs p-1 truncate">{photo.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
