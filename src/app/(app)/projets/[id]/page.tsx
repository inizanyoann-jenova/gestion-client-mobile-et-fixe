import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjetHeader } from '@/components/projets/projet-header'
import { ProjetInfos } from '@/components/projets/projet-infos'
import { ProjetAvancement } from '@/components/projets/projet-avancement'
import { ProjetTabs } from '@/components/projets/projet-tabs'
import type { Projet, Tache, Interaction, Document } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjetDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    projetResult,
    tachesResult,
    interactionsResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from('projets')
      .select('*, client:clients(id, nom)')
      .eq('id', id)
      .single(),
    supabase
      .from('taches')
      .select('*')
      .eq('projet_id', id)
      .order('date_echeance', { ascending: true, nullsFirst: false }),
    supabase
      .from('interactions')
      .select('*')
      .eq('projet_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('documents')
      .select('*')
      .eq('projet_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (projetResult.error || !projetResult.data) notFound()

  const projet = projetResult.data as Projet & { client: { id: string; nom: string } }
  const taches = (tachesResult.data ?? []) as Tache[]
  const interactions = (interactionsResult.data ?? []) as Interaction[]
  const documents = (documentsResult.data ?? []) as Document[]

  return (
    <div className="pb-24">
      <ProjetHeader projet={projet} />
      <div className="px-4 space-y-6 mt-4">
        <ProjetInfos projet={projet} />
        <ProjetAvancement projetId={projet.id} avancement={projet.avancement} />
        <ProjetTabs
          projetId={projet.id}
          taches={taches}
          interactions={interactions}
          documents={documents}
        />
      </div>
    </div>
  )
}
