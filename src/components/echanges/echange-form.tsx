'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TypeInteraction } from '@/lib/supabase/types'
import { toDatetimeLocal } from '@/lib/utils/date'

interface EchangeFormProps {
  projetId?: string
  clientId?: string
}

const TYPE_OPTIONS: { value: TypeInteraction; label: string }[] = [
  { value: 'appel', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'visite', label: 'Visite' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'autre', label: 'Autre' },
]

export function EchangeForm({ projetId, clientId }: EchangeFormProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [type, setType] = useState<TypeInteraction>('appel')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const open = () => {
    setType('appel')
    setError(null)
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const dateRaw = fd.get('date') as string
    const body = {
      type,
      date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
      resume: fd.get('resume') as string,
      suite_a_donner: (fd.get('suite_a_donner') as string) || null,
      ...(projetId ? { projet_id: projetId } : {}),
      ...(clientId ? { client_id: clientId } : {}),
    }

    try {
      const url = projetId ? `/api/projets/${projetId}/interactions` : '/api/interactions'
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
        + Nouvel échange
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => { if (e.target === dialogRef.current) close() }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Nouvel échange</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as TypeInteraction)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Date</label>
            <input name="date" type="datetime-local" defaultValue={toDatetimeLocal(new Date().toISOString())} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Résumé *</label>
            <textarea name="resume" rows={3} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Sujet de l'échange…" required />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Suite à donner</label>
            <textarea name="suite_a_donner" rows={2} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Action à mener…" />
          </div>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={close} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
              {isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
