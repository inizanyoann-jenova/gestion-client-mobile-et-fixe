'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/lib/supabase/types'

interface CreateProps { mode: 'create'; clientId: string }
interface EditProps { mode: 'edit'; clientId: string; contact: Contact }
type Props = CreateProps | EditProps

export function ContactForm(props: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const isEdit = props.mode === 'edit'
  const contact = isEdit ? props.contact : null

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
      prenom: fd.get('prenom') as string,
      nom: fd.get('nom') as string,
      poste: (fd.get('poste') as string) || null,
      telephone: (fd.get('telephone') as string) || null,
      email: (fd.get('email') as string) || null,
      est_principal: fd.get('est_principal') === 'on',
    }

    const url = isEdit
      ? `/api/clients/${props.clientId}/contacts/${contact!.id}`
      : `/api/clients/${props.clientId}/contacts`

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error?.message ?? json.error ?? 'Erreur')
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
      {isEdit ? (
        <button onClick={open} className="text-sky-400 text-xs">
          Modifier
        </button>
      ) : (
        <button onClick={open} className="text-sky-400 text-sm font-medium">
          + Ajouter
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
            {isEdit ? 'Modifier le contact' : 'Nouveau contact'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Prénom *</label>
              <input
                name="prenom"
                required
                defaultValue={contact?.prenom ?? ''}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nom *</label>
              <input
                name="nom"
                required
                defaultValue={contact?.nom ?? ''}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Poste</label>
            <input
              name="poste"
              defaultValue={contact?.poste ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Directeur technique"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Téléphone</label>
            <input
              name="telephone"
              type="tel"
              defaultValue={contact?.telephone ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="+262 692 00 00 00"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={contact?.email ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="est_principal"
              defaultChecked={contact?.est_principal ?? false}
              className="w-4 h-4 rounded accent-sky-500"
            />
            <span className="text-sm text-slate-300">Contact principal</span>
          </label>

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
              {isPending ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
