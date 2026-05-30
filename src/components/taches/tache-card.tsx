'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tache } from '@/lib/supabase/types'

type TacheWithRelations = Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface TacheCardProps {
  tache: TacheWithRelations
}

const PRIORITE_COLORS: Record<string, string> = {
  haute: 'text-red-400 bg-red-400/10',
  normale: 'text-amber-400 bg-amber-400/10',
  basse: 'text-slate-400 bg-slate-400/10',
}

const PRIORITE_LABELS: Record<string, string> = {
  haute: 'Haute',
  normale: 'Normale',
  basse: 'Basse',
}

const PRIORITE_BORDER: Record<string, string> = {
  haute: 'border-l-red-500',
  normale: 'border-l-amber-500',
  basse: 'border-l-slate-600',
}

export function TacheCard({ tache }: TacheCardProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [checked, setChecked] = useState(tache.statut === 'fait')
  const [isToggling, setIsToggling] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isLate =
    tache.date_echeance != null &&
    new Date(tache.date_echeance) < new Date() &&
    !checked

  const toggleStatut = async () => {
    if (isToggling) return
    setIsToggling(true)
    const prev = checked
    const newStatut = checked ? 'a_faire' : 'fait'
    setChecked(!checked)

    const res = await fetch(`/api/taches/${tache.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    })
    if (!res.ok) setChecked(prev)
    else router.refresh()
    setIsToggling(false)
  }

  const formattedDate = tache.date_echeance
    ? new Date(tache.date_echeance).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div
      className={`bg-slate-900 border border-slate-800 border-l-4 ${PRIORITE_BORDER[tache.priorite] ?? 'border-l-slate-600'} rounded-xl p-4 flex gap-3 items-start transition-opacity${checked ? ' opacity-50' : ''}`}
    >
      <button
        onClick={toggleStatut}
        disabled={isToggling}
        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors${
          checked
            ? ' bg-sky-500 border-sky-500'
            : ' border-slate-600 hover:border-sky-400'
        }`}
        aria-label={checked ? 'Marquer à faire' : 'Marquer comme fait'}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-white text-sm font-medium leading-snug">{tache.titre}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITE_COLORS[tache.priorite] ?? ''}`}
            >
              {PRIORITE_LABELS[tache.priorite] ?? tache.priorite}
            </span>
            <button
              onClick={() => { setDialogOpen(true); dialogRef.current?.showModal() }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Modifier la tâche"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 2.5l2 2-9 9H2.5v-2L11.5 2.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {formattedDate && (
          <p className={`text-xs${isLate ? ' text-red-400 font-medium' : ' text-slate-400'}`}>
            {isLate ? '⚠ ' : ''}Échéance : {formattedDate}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          {tache.client && (
            <Link
              href={`/clients/${tache.client.id}`}
              className="hover:text-sky-400 truncate max-w-[140px]"
            >
              {tache.client.nom}
            </Link>
          )}
          {tache.projet && (
            <Link
              href={`/projets/${tache.projet.id}`}
              className="hover:text-sky-400 truncate max-w-[140px]"
            >
              📁 {tache.projet.titre}
            </Link>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current?.close()
            setDialogOpen(false)
          }
        }}
      >
        {dialogOpen && (
          <TacheEditContent
            tache={tache}
            onClose={() => { dialogRef.current?.close(); setDialogOpen(false) }}
          />
        )}
      </dialog>
    </div>
  )
}

interface TacheEditContentProps {
  tache: TacheWithRelations
  onClose: () => void
}

function TacheEditContent({ tache, onClose }: TacheEditContentProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const dateRaw = fd.get('date_echeance') as string
    const body = {
      titre: fd.get('titre') as string,
      priorite: fd.get('priorite') as string,
      statut: fd.get('statut') as string,
      date_echeance: dateRaw ? new Date(dateRaw).toISOString() : null,
      description: (fd.get('description') as string) || null,
      notification_active: fd.get('notification_active') === 'on',
      notification_email: fd.get('notification_email') === 'on',
      notification_push: fd.get('notification_push') === 'on',
    }

    try {
      const res = await fetch(`/api/taches/${tache.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette tâche ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/taches/${tache.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsDeleting(false)
    }
  }

  const currentDate = tache.date_echeance
    ? new Date(tache.date_echeance).toISOString().split('T')[0]
    : ''

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Modifier la tâche</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Titre *</label>
        <input
          name="titre"
          required
          defaultValue={tache.titre}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Priorité</label>
          <select
            name="priorite"
            defaultValue={tache.priorite}
            className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="haute">Haute</option>
            <option value="normale">Normale</option>
            <option value="basse">Basse</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Statut</label>
          <select
            name="statut"
            defaultValue={tache.statut}
            className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="a_faire">À faire</option>
            <option value="fait">Fait</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Échéance</label>
        <input
          name="date_echeance"
          type="date"
          defaultValue={currentDate}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={tache.description ?? ''}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-400">Notifications</p>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="notification_active"
            defaultChecked={tache.notification_active}
            className="accent-sky-500"
          />
          Activer les rappels
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="notification_email"
            defaultChecked={tache.notification_email}
            className="accent-sky-500"
          />
          Email
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="notification_push"
            defaultChecked={tache.notification_push}
            className="accent-sky-500"
          />
          Push
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50"
        >
          {isDeleting ? 'Suppression…' : 'Supprimer'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
