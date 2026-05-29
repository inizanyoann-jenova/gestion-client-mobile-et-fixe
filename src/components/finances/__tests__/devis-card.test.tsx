import { render, screen } from '@testing-library/react'
import { DevisCard } from '../devis-card'
import type { Devis } from '@/lib/supabase/finance-types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/finances',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockDevis: Devis = {
  id: 'dev-1',
  numero: 'DEV-2026-001',
  client_id: 'cli-1',
  projet_id: null,
  statut: 'envoyé',
  date_emission: '2026-06-01',
  date_validite: '2026-07-01',
  montant_ht: 1000,
  montant_tva: 85,
  montant_ttc: 1085,
  notes: null,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

describe('DevisCard', () => {
  it('affiche le numéro de devis', () => {
    render(<DevisCard devis={mockDevis} clientNom="Carrefour" />)
    expect(screen.getByText('DEV-2026-001')).toBeInTheDocument()
  })

  it('affiche le montant TTC', () => {
    render(<DevisCard devis={mockDevis} clientNom="Carrefour" />)
    expect(screen.getByText(/1\s*085/)).toBeInTheDocument()
  })

  it('affiche le statut envoyé', () => {
    render(<DevisCard devis={mockDevis} clientNom="Carrefour" />)
    expect(screen.getByText(/envoyé/i)).toBeInTheDocument()
  })
})
