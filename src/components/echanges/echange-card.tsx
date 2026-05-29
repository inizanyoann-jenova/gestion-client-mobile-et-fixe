'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Interaction, TypeInteraction } from '@/lib/supabase/types'
import { toDatetimeLocal } from '@/lib/utils/date'

type InteractionAvecContext = Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface EchangeCardProps {
  interaction: InteractionAvecContext
}

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  reunion: 'Réunion',
  autre: 'Autre',
}

const TYPE_COLOR: Record<TypeInteraction, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

export function EchangeCard({ interaction }: EchangeCardProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const openDialog = () => {
    setDialogOpen(true)
    dialogRef.current?.showModal()
  }

  const closeDialog = () => {
    dialogRef.current?.close()
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cet échange ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/interactions/${interaction.id}`, { method: 'DELETE' })
      if (!res.ok) {
        return
      }
      router.refresh()
    } catch {
      // ignore
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLOR[interaction.type]}`}>
          {TYPE_LABEL[interaction.type]}
        </span>
        <span className="text-slate-500 text-xs ml-auto">
          {new Date(interaction.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <button
          aria-label="Modifier cet échange"
          onClick={openDialog}
          className="text-slate-400 hover:text-slate-200 text-sm px-1.5 py-0.5 rounded transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 2.5l2 2-9 9H2.5v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          aria-label="Supprimer cet échange"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-slate-400 hover:text-red-400 text-sm px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <p className="text-white text-sm line-clamp-3">{interaction.resume}</p>

      {interaction.suite_a_donner && (
        <p className="text-amber-400 text-xs">
          <span aria-hidden="true">→ </span>
          <span>{interaction.suite_a_donner}</span>
        </p>
      )}

      {(interaction.client || interaction.projet) && (
        <div className="flex gap-3 flex-wrap">
          {interaction.client && (
            <Link href={`/clients/${interaction.client.id}`} className="text-sky-400 text-xs hover:underline">
              {interaction.client.nom}
            </Link>
          )}
          {interaction.projet && (
            <Link href={`/projets/${interaction.projet.id}`} className="text-slate-400 text-xs hover:underline">
              📁 {interaction.projet.titre}
            </Link>
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
      >
        {dialogOpen && (
          <EchangeEditContent
            interaction={interaction}
            onClose={closeDialog}
            onSuccess={() => { closeDialog(); router.refresh() }}
          />
        )}
      </dialog>
    </div>
  )
}

interface EchangeEditContentProps {
  interaction: Interaction
  onClose: () => void
  onSuccess: () => void
}

function EchangeEditContent({ interaction, onClose, onSuccess }: EchangeEditContentProps) {
  const [type, setType] = useState<TypeInteraction>(interaction.type)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

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
    }
    try {
      const res = await fetch(`/api/interactions/${interaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onSuccess()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  const TYPE_OPTIONS: { value: TypeInteraction; label: string }[] = [
    { value: 'appel', label: 'Appel' },
    { value: 'email', label: 'Email' },
    { value: 'visite', label: 'Visite' },
    { value: 'reunion', label: 'Réunion' },
    { value: 'autre', label: 'Autre' },
  ]

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Modifier l&apos;échange</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as TypeInteraction)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Date</label>
        <input name="date" type="datetime-local" defaultValue={toDatetimeLocal(interaction.date)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Résumé *</label>
        <textarea name="resume" rows={3} defaultValue={interaction.resume} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" required />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Suite à donner</label>
        <textarea name="suite_a_donner" rows={2} defaultValue={interaction.suite_a_donner ?? ''} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">
          Annuler
        </button>
        <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
