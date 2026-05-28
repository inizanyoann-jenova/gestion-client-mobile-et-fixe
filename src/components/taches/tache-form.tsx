'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TacheFormProps {
  projetId?: string
  clientId?: string
}

export function TacheForm({ projetId, clientId }: TacheFormProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [notifActive, setNotifActive] = useState(false)

  const open = () => {
    setError(null)
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const dateRaw = fd.get('date_echeance') as string
    const body = {
      titre: fd.get('titre') as string,
      priorite: fd.get('priorite') as string,
      date_echeance: dateRaw ? new Date(dateRaw).toISOString() : null,
      description: (fd.get('description') as string) || null,
      notification_active: fd.get('notification_active') === 'on',
      notification_email: fd.get('notification_email') === 'on',
      notification_push: fd.get('notification_push') === 'on',
      client_id: clientId ?? null,
      projet_id: projetId ?? null,
    }

    try {
      const url = projetId ? `/api/projets/${projetId}/taches` : '/api/taches'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }

      close()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button onClick={open} className="text-sky-400 text-sm font-medium">
        + Nouvelle tâche
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Nouvelle tâche</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Titre *</label>
            <input
              name="titre"
              required
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Envoyer le devis"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Priorité</label>
              <select
                name="priorite"
                defaultValue="normale"
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="haute">Haute</option>
                <option value="normale">Normale</option>
                <option value="basse">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Échéance</label>
              <input
                name="date_echeance"
                type="date"
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                name="notification_active"
                className="accent-sky-500"
                onChange={(e) => setNotifActive(e.target.checked)}
              />
              Activer les rappels
            </label>

            {notifActive && (
              <div className="ml-6 space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" name="notification_email" className="accent-sky-500" />
                  Email (J-1 et J0)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" name="notification_push" className="accent-sky-500" />
                  Notification push
                </label>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
