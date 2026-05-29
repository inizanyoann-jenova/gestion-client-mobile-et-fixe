import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EchangeCard } from '@/components/echanges/echange-card'
import { EchangesFilters } from '@/components/echanges/echanges-filters'
import { EchangeForm } from '@/components/echanges/echange-form'
import type { Interaction } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>
}

const PER_PAGE = 20

export default async function EchangesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const type = sp.type ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('interactions')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('resume', `%${search}%`)
  if (type) query = query.eq('type', type)

  const { data: interactions, count, error } = await query

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
          Échanges
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <EchangeForm />
      </div>

      <Suspense fallback={<div className="h-20 bg-slate-800 rounded-xl animate-pulse" />}>
        <EchangesFilters search={search} type={type} />
      </Suspense>

      {interactions && interactions.length > 0 ? (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <EchangeCard
              key={interaction.id}
              interaction={
                interaction as Interaction & {
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
            {search || type
              ? 'Aucun échange ne correspond aux filtres'
              : 'Aucun échange enregistré. Commencez par créer le premier !'}
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
    </div>
  )
}
