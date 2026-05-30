import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DocumentCard } from '@/components/documents/document-card'
import { DocumentsFilters } from '@/components/documents/documents-filters'
import { DocumentUploadButton } from '@/components/documents/document-upload-button'
import { SearchModal } from '@/components/search/search-modal'
import type { Document } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>
}

const PER_PAGE = 20

export default async function DocumentsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const type = sp.type ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('documents')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)

  const { data: documents, count, error } = await query

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
          Documents
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <SearchModal />
          <DocumentUploadButton />
        </div>
      </div>

      <Suspense fallback={<div className="h-10 bg-slate-800 rounded-xl animate-pulse" />}>
        <DocumentsFilters type={type} />
      </Suspense>

      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={
                doc as Document & {
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
            {type ? 'Aucun document de ce type' : 'Aucun document. Ajoutez le premier !'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 pt-2">
          <span className="text-slate-400 text-sm">Page {page} / {totalPages}</span>
        </div>
      )}
    </div>
  )
}
