import { render, screen } from '@testing-library/react'
import { DevisForm } from '../devis-form'
import type { Client } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/finances/devis/nouveau',
}))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ id: 'dev-new', numero: 'DEV-2026-001' }),
}) as jest.Mock

const mockClients: Client[] = [
  { id: 'cli-1', nom: 'Carrefour Grand Nord', statut: 'actif', secteur: 'courants_forts', adresse: null, siret: null, notes: null, created_at: '', updated_at: '' },
]

describe('DevisForm', () => {
  it('affiche le champ client', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument()
  })

  it('affiche le champ date de validité', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByLabelText(/validit/i)).toBeInTheDocument()
  })

  it('affiche le bouton Ajouter une ligne', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument()
  })

  it('affiche le bouton Enregistrer', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument()
  })
})
