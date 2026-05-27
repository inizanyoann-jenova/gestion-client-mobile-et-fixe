import { render, screen } from '@testing-library/react'
import { ClientCard } from '../client-card'
import type { Client } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/clients',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockClient: Client = {
  id: '1',
  nom: 'Carrefour Grand Nord',
  secteur: 'courants_forts',
  statut: 'actif',
  adresse: '1 rue du Commerce, Saint-Denis',
  siret: null,
  notes: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

describe('ClientCard', () => {
  it('affiche le nom du client', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('affiche le badge Actif', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('a un lien vers la fiche client', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/clients/1')
  })
})
