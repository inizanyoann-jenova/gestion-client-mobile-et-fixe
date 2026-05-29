import { render, screen } from '@testing-library/react'
import { FactureCard } from '../facture-card'
import type { Facture } from '@/lib/supabase/finance-types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/finances',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockFacture: Facture = {
  id: 'fact-1',
  numero: 'FACT-2026-001',
  devis_id: 'dev-1',
  client_id: 'cli-1',
  projet_id: null,
  type: 'facture',
  statut: 'émise',
  date_emission: '2026-06-01',
  date_echeance: '2026-07-01',
  pourcentage_acompte: null,
  montant_ht: 1000,
  montant_tva: 85,
  montant_ttc: 1085,
  date_paiement: null,
  notes: null,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

describe('FactureCard', () => {
  it('affiche le numéro de facture', () => {
    render(<FactureCard facture={mockFacture} clientNom="Leclerc" />)
    expect(screen.getByText('FACT-2026-001')).toBeInTheDocument()
  })

  it('affiche le statut émise', () => {
    render(<FactureCard facture={mockFacture} clientNom="Leclerc" />)
    expect(screen.getByText(/émise/i)).toBeInTheDocument()
  })

  it('affiche le montant TTC', () => {
    render(<FactureCard facture={mockFacture} clientNom="Leclerc" />)
    expect(screen.getByText(/1\s*085/)).toBeInTheDocument()
  })
})
