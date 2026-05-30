import { render, screen } from '@testing-library/react'
import { ProjetHeader } from '../projet-header'
import type { Projet } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/projets/p1',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockProjet = {
  id: 'p1',
  titre: 'Chantier Carrefour',
  statut: 'en_cours',
  secteur: 'photovoltaique',
  type: 'installation',
  client: { id: 'c1', nom: 'Carrefour Grand Nord' },
  avancement: 40,
  date_debut_estimee: '2026-01-01',
  date_fin_estimee: null,
  date_fin_reelle: null,
  description: null,
  notes: null,
  client_id: 'c1',
  montant_devis: null,
  montant_facture: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
} as unknown as Parameters<typeof ProjetHeader>[0]['projet']

describe('ProjetHeader — lien chantier', () => {
  it('affiche un lien vers /projets/[id]/chantier', () => {
    render(<ProjetHeader projet={mockProjet} />)
    const link = screen.queryByRole('link', { name: /chantier/i })
    expect(link ?? screen.queryByText(/chantier/i)).toBeTruthy()
  })

  it('le lien chantier pointe vers la bonne URL', () => {
    render(<ProjetHeader projet={mockProjet} />)
    const link = screen.getByRole('link', { name: /sur chantier/i })
    expect(link).toHaveAttribute('href', '/projets/p1/chantier')
  })
})
