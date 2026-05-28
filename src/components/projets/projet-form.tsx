'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Projet } from '@/lib/supabase/types'

interface CreateProps { mode: 'create'; clientId?: string }
interface EditProps { mode: 'edit'; projet: Projet & { client: { id: string; nom: string } } }
type Props = CreateProps | EditProps

const TYPE_OPTIONS = [
  { value: 'installation', label: 'Installation' },
  { value: 'etude', label: 'Étude' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'sav', label: 'SAV' },
]

const SECTEUR_OPTIONS = [
  { value: 'courants_forts', label: '⚡ Courants forts' },
  { value: 'courants_faibles', label: '📡 Courants faibles' },
  { value: 'photovoltaique', label: '☀️ Photovoltaïque' },
]

const STATUT_OPTIONS = [
  { value: 'en_etude', label: 'En étude' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'sav', label: 'SAV' },
]

export function ProjetForm(props: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([])

  const isEdit = props.mode === 'edit'
  const projet = isEdit ? props.projet : null
  const lockedClientId = props.mode === 'create' ? props.clientId : null

  useEffect(() => {
    if (isEdit) return
    fetch('/api/clients?limit=100')
      .then((r) => r.json())
      .then((data: { clients?: { id: string; nom: string }[] }) => {
        if (Array.isArray(data.clients)) setClients(data.clients)
      })
      .catch(() => {})
  }, [isEdit])

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
    const montantRaw = fd.get('montant_devis') as string
    const dateDebut = fd.get('date_debut_estimee') as string
    const dateFin = fd.get('date_fin_estimee') as string
    const body = {
      titre: fd.get('titre') as string,
      client_id: (fd.get('client_id') as string) || lockedClientId,
      type: fd.get('type') as string,
      secteur: fd.get('secteur') as string,
      statut: fd.get('statut') as string,
      montant_devis: montantRaw ? parseFloat(montantRaw) : null,
      date_debut_estimee: dateDebut ? new Date(dateDebut).toISOString() : null,
      date_fin_estimee: dateFin ? new Date(dateFin).toISOString() : null,
      notes: (fd.get('notes') as string) || null,
    }

    const url = isEdit ? `/api/projets/${projet!.id}` : '/api/projets'
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
        router.push(`/projets/${created.id}`)
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
        className="w-full max-w-2xl rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Titre *</label>
            <input
              name="titre"
              required
              defaultValue={projet?.titre ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Installation ombrière photovoltaïque"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Client *</label>
              {lockedClientId ? (
                <p className="text-slate-400 text-sm py-2">Client pré-sélectionné</p>
              ) : (
                <select
                  name="client_id"
                  required
                  className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Sélectionner un client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Type *</label>
              <select
                name="type"
                required
                defaultValue={projet?.type ?? 'installation'}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Secteur *</label>
              <select
                name="secteur"
                required
                defaultValue={projet?.secteur ?? 'photovoltaique'}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {SECTEUR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Statut *</label>
            <select
              name="statut"
              required
              defaultValue={projet?.statut ?? 'en_etude'}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Montant devis (€)</label>
            <input
              name="montant_devis"
              type="number"
              min="0"
              step="100"
              defaultValue={projet?.montant_devis ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="75000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Début estimé</label>
              <input
                name="date_debut_estimee"
                type="date"
                defaultValue={
                  projet?.date_debut_estimee
                    ? projet.date_debut_estimee.split('T')[0]
                    : ''
                }
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Fin estimée</label>
              <input
                name="date_fin_estimee"
                type="date"
                defaultValue={
                  projet?.date_fin_estimee
                    ? projet.date_fin_estimee.split('T')[0]
                    : ''
                }
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes</label>
            <textarea
              name="notes"
              defaultValue={projet?.notes ?? ''}
              rows={3}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Notes sur le projet…"
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
