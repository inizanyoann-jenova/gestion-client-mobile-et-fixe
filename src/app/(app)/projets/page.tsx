import { createClient } from '@/lib/supabase/server'
import { ProjetCard } from '@/components/projets/projet-card'
import { ProjetsFilters } from '@/components/projets/projets-filters'
import type { Projet } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    statut?: string
    secteur?: string
    page?: string
  }>
}

const PER_PAGE = 10

export default async function ProjetsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const statut = sp.statut ?? ''
  const secteur = sp.secteur ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('projets')
    .select('*, client:clients(id, nom)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('titre', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (secteur) query = query.eq('secteur', secteur)

  const { data: projets, count, error } = await query

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400 text-sm">Erreur : {error.message}</p>
      </div>
    )
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Projets
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        {/* ProjetForm sera ajouté à la Task 5 */}
        <div id="new-projet-btn" />
      </div>

      <ProjetsFilters search={search} statut={statut} secteur={secteur} />

      {projets && projets.length > 0 ? (
        <div className="space-y-3">
          {projets.map((projet) => (
            <ProjetCard
              key={projet.id}
              projet={projet as Projet & { client: { id: string; nom: string } }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {search || statut || secteur
              ? 'Aucun projet ne correspond aux filtres'
              : 'Aucun projet. Créez le premier !'}
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
