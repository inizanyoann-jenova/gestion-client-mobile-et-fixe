'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Client } from '@/lib/supabase/types'

interface CreateProps { mode: 'create' }
interface EditProps { mode: 'edit'; client: Client }
type Props = CreateProps | EditProps

const SECTEUR_OPTIONS = [
  { value: 'courants_forts', label: '⚡ Courants forts' },
  { value: 'courants_faibles', label: '📡 Courants faibles' },
  { value: 'photovoltaique', label: '☀️ Photovoltaïque' },
  { value: 'mixte', label: '🔧 Mixte' },
]

const STATUT_OPTIONS = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
]

export function ClientForm(props: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const isEdit = props.mode === 'edit'
  const client = isEdit ? props.client : null

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
    const body = {
      nom: fd.get('nom') as string,
      secteur: fd.get('secteur') as string,
      statut: fd.get('statut') as string,
      adresse: (fd.get('adresse') as string) || null,
      siret: (fd.get('siret') as string) || null,
      notes: isEdit ? (client?.notes ?? null) : null,
    }

    const url = isEdit ? `/api/clients/${client!.id}` : '/api/clients'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error?.message ?? json.error ?? 'Erreur lors de la sauvegarde')
        return
      }

      close()
      if (!isEdit) {
        const created = await res.json()
        router.push(`/clients/${created.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {isEdit ? (
        <button onClick={open} className="text-sky-400 text-sm font-medium">
          Modifier
        </button>
      ) : (
        <button
          onClick={open}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span> Nouveau
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Modifier le client' : 'Nouveau client'}
          </h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Nom *</label>
            <input
              name="nom"
              required
              defaultValue={client?.nom ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Carrefour Grand Nord"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Secteur *</label>
              <select
                name="secteur"
                required
                defaultValue={client?.secteur ?? 'courants_forts'}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {SECTEUR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Statut *</label>
              <select
                name="statut"
                required
                defaultValue={client?.statut ?? 'prospect'}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Adresse</label>
            <input
              name="adresse"
              defaultValue={client?.adresse ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="1 rue du Commerce, Saint-Denis 97400"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">SIRET</label>
            <input
              name="siret"
              defaultValue={client?.siret ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="12345678901234"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">{error}</p>
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
              {isPending ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
