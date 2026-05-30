import { createClient } from '@/lib/supabase/server'
import { ClientCard } from '@/components/clients/client-card'
import { ClientsFilters } from '@/components/clients/clients-filters'
import { ClientForm } from '@/components/clients/client-form'
import { SearchModal } from '@/components/search/search-modal'
import type { Client } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    statut?: string
    secteur?: string
    page?: string
  }>
}

const PER_PAGE = 20

export default async function ClientsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const statut = sp.statut ?? ''
  const secteur = sp.secteur ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('nom')
    .range(from, to)

  if (search) query = query.ilike('nom', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (secteur) query = query.eq('secteur', secteur)

  const { data, count, error } = await query

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400 text-sm">Erreur : {error.message}</p>
      </div>
    )
  }

  const clients = (data ?? []) as Client[]
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Clients
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <SearchModal />
          <ClientForm mode="create" />
        </div>
      </div>

      <ClientsFilters search={search} statut={statut} secteur={secteur} />

      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {search || statut || secteur
              ? 'Aucun client ne correspond aux filtres'
              : 'Aucun client. Créez le premier !'}
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
