import { createClient } from '@/lib/supabase/server'
import { DevisForm } from '@/components/finances/devis-form'
import type { Client } from '@/lib/supabase/types'
import type { Prestation } from '@/lib/supabase/finance-types'

export default async function NouveauDevisPage() {
  const supabase = await createClient()

  const [clientsRes, prestationsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('statut', 'actif').order('nom'),
    supabase.from('prestations').select('*').eq('actif', true).order('libelle'),
  ])

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Nouveau devis</h1>
      <DevisForm
        clients={(clientsRes.data ?? []) as Client[]}
        prestations={(prestationsRes.data ?? []) as Prestation[]}
      />
    </div>
  )
}
