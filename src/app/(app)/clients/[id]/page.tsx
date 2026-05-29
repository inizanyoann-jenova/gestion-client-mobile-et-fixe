import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientHeader } from '@/components/clients/client-header'
import { QuickActions } from '@/components/clients/quick-actions'
import { ClientKpis } from '@/components/clients/client-kpis'
import { ContactsSection } from '@/components/clients/contacts-section'
import { ClientNotes } from '@/components/clients/client-notes'
import { ClientTabs } from '@/components/clients/client-tabs'
import type { Client, Contact, Document, Interaction, Projet, Tache } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }
type DocumentAvecContext = Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type TacheAvecRelations = Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type InteractionAvecContext = Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    clientResult,
    contactsResult,
    projetsResult,
    projetsTabsResult,
    lastEchangeResult,
    nextRappelResult,
    interactionsResult,
    documentsResult,
    tachesResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('client_id', id).order('est_principal', { ascending: false }),
    supabase.from('projets').select('statut, montant_devis, montant_facture').eq('client_id', id),
    supabase.from('projets').select('*, client:clients(id, nom)').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('interactions').select('*').eq('client_id', id).order('date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('taches').select('*').eq('client_id', id).eq('statut', 'a_faire').order('date_echeance').limit(1).maybeSingle(),
    supabase.from('interactions').select('*, client:clients(id, nom), projet:projets(id, titre)').eq('client_id', id).order('date', { ascending: false }).limit(20),
    supabase.from('documents').select('*, client:clients(id, nom), projet:projets(id, titre)').eq('client_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('taches').select('*, client:clients(id, nom), projet:projets(id, titre)').eq('client_id', id).order('date_echeance', { ascending: true, nullsFirst: false }).limit(20),
  ])

  if (clientResult.error || !clientResult.data) notFound()

  const client = clientResult.data as Client
  const contacts = (contactsResult.data ?? []) as Contact[]
  const projets = projetsResult.data ?? []
  const projetsTabs = (projetsTabsResult.data ?? []) as unknown as ProjetAvecClient[]

  const kpis = {
    ca_realise: projets.filter((p) => p.statut === 'termine').reduce((sum, p) => sum + (p.montant_facture ?? 0), 0),
    montant_attente: projets.filter((p) => ['en_cours', 'en_etude'].includes(p.statut)).reduce((sum, p) => sum + (p.montant_devis ?? 0), 0),
    nombre_projets: projets.length,
  }

  const principalContact = contacts.find((c) => c.est_principal)

  return (
    <div className="pb-24">
      <ClientHeader client={client} />
      <div className="px-4 space-y-6 mt-4">
        <QuickActions
          phone={principalContact?.telephone ?? null}
          email={principalContact?.email ?? null}
          address={client.adresse}
          clientId={client.id}
        />
        <ClientKpis kpis={kpis} />
        <ContactsSection contacts={contacts} clientId={client.id} />
        <ClientNotes initialNotes={client.notes ?? ''} clientId={client.id} />
        <ClientTabs
          clientId={client.id}
          dernierEchange={(lastEchangeResult.data ?? null) as Interaction | null}
          prochainRappel={(nextRappelResult.data ?? null) as Tache | null}
          projets={projetsTabs}
          interactions={(interactionsResult.data ?? []) as unknown as InteractionAvecContext[]}
          documents={(documentsResult.data ?? []) as unknown as DocumentAvecContext[]}
          taches={(tachesResult.data ?? []) as unknown as TacheAvecRelations[]}
        />
      </div>
    </div>
  )
}
