import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TacheCard } from '@/components/taches/tache-card'
import { TachesFilters } from '@/components/taches/taches-filters'
import { TacheForm } from '@/components/taches/tache-form'
import { PushPrompt } from '@/components/notifications/push-prompt'
import { SearchModal } from '@/components/search/search-modal'
import type { Tache } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    statut?: string
    priorite?: string
    page?: string
  }>
}

const PER_PAGE = 20

export default async function TachesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const statut = sp.statut ?? ''
  const priorite = sp.priorite ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('taches')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('date_echeance', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('titre', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (priorite) query = query.eq('priorite', priorite)

  const { data: taches, count, error } = await query

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400 text-sm">Erreur : {error.message}</p>
      </div>
    )
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Tâches
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <SearchModal />
          <TacheForm />
        </div>
      </div>

      <Suspense fallback={<div className="h-20 bg-slate-800 rounded-xl animate-pulse" />}>
        <TachesFilters search={search} statut={statut} priorite={priorite} />
      </Suspense>

      {taches && taches.length > 0 ? (
        <div className="space-y-3">
          {taches.map((tache) => (
            <TacheCard
              key={tache.id}
              tache={
                tache as Tache & {
                  client: { id: string; nom: string } | null
                  projet: { id: string; titre: string } | null
                }
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {search || statut || priorite
              ? 'Aucune tâche ne correspond aux filtres'
              : 'Aucune tâche. Créez la première !'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 pt-2">
          <span className="text-slate-400 text-sm">
            Page {page} / {totalPages}
          </span>
        </div>
      )}

      <div className="pt-4">
        <PushPrompt />
      </div>
    </div>
  )
}
