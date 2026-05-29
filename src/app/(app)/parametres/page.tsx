import { createClient } from '@/lib/supabase/server'
import { EntrepriseForm } from '@/components/parametres/entreprise-form'
import { ParametresTabs } from '@/components/parametres/parametres-tabs'
import type { ParametresTabId } from '@/components/parametres/parametres-tabs'
import { GuideUtilisateur } from '@/components/parametres/guide-utilisateur'
import { CatalogueForm } from '@/components/parametres/catalogue-form'
import { PARAMETRES_CLES } from '@/lib/validations/parametres'
import type { Prestation } from '@/lib/supabase/finance-types'

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('cle, valeur')
    .in('cle', PARAMETRES_CLES)
  return Object.fromEntries((data ?? []).map((r) => [r.cle, r.valeur ?? '']))
}

async function getPrestations(): Promise<Prestation[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prestations')
    .select('*')
    .eq('actif', true)
    .order('libelle')
  return (data ?? []) as Prestation[]
}

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab: ParametresTabId =
    params.tab === 'guide' ? 'guide' :
    params.tab === 'catalogue' ? 'catalogue' :
    'parametres'

  const settings = activeTab === 'parametres' ? await getSettings() : {}
  const prestations = activeTab === 'catalogue' ? await getPrestations() : []

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Paramètres</h1>
      <ParametresTabs activeTab={activeTab} />

      {activeTab === 'guide' && (
        <GuideUtilisateur />
      )}

      {activeTab === 'catalogue' && (
        <section>
          <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Catalogue de prestations
          </h2>
          <CatalogueForm prestations={prestations} />
        </section>
      )}

      {activeTab === 'parametres' && (
        <>
          <section className="mb-8">
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
              Informations entreprise
            </h2>
            <EntrepriseForm
              initial={{
                entreprise_nom: settings['entreprise_nom'] ?? 'ATEXIA',
                entreprise_adresse: settings['entreprise_adresse'],
                entreprise_siret: settings['entreprise_siret'],
                entreprise_telephone: settings['entreprise_telephone'],
                entreprise_email: settings['entreprise_email'],
              }}
            />
          </section>

          <section>
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
              Compte
            </h2>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
              >
                Se déconnecter
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
