import { render, screen } from '@testing-library/react'
import { ProjetCard } from '../projet-card'
import type { Projet } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/projets',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockProjet: Projet & { client: { id: string; nom: string } } = {
  id: '1',
  titre: 'Installation PV Carrefour',
  client_id: 'client-1',
  client: { id: 'client-1', nom: 'Carrefour Grand Nord' },
  type: 'installation',
  secteur: 'photovoltaique',
  statut: 'en_cours',
  avancement: 50,
  montant_devis: 75000,
  montant_facture: null,
  date_debut_estimee: null,
  date_fin_estimee: '2024-12-31T00:00:00Z',
  date_fin_reelle: null,
  notes: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

describe('ProjetCard', () => {
  it('affiche le titre du projet', () => {
    render(<ProjetCard projet={mockProjet} />)
    expect(screen.getByText('Installation PV Carrefour')).toBeInTheDocument()
  })

  it('affiche le nom du client', () => {
    render(<ProjetCard projet={mockProjet} />)
    expect(screen.getByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('a un lien vers la fiche projet', () => {
    render(<ProjetCard projet={mockProjet} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/projets/1')
  })

  it('affiche le badge statut', () => {
    render(<ProjetCard projet={mockProjet} />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })
})
