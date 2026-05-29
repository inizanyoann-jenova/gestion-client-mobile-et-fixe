import { render, screen } from '@testing-library/react'
import { EchangeCard } from '../echange-card'
import type { Interaction } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const mockInteraction: Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
} = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'appel',
  date: '2026-05-29T10:00:00.000Z',
  resume: 'Discussion du devis Carrefour',
  suite_a_donner: 'Rappeler la semaine prochaine',
  client_id: null,
  projet_id: null,
  created_at: '2026-05-29T10:00:00.000Z',
  client: null,
  projet: null,
}

describe('EchangeCard', () => {
  it('affiche le badge de type', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByText('Appel')).toBeInTheDocument()
  })

  it('affiche le résumé', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByText('Discussion du devis Carrefour')).toBeInTheDocument()
  })

  it('affiche la suite à donner', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByText('Rappeler la semaine prochaine')).toBeInTheDocument()
  })

  it('ne rend pas la suite à donner si null', () => {
    render(<EchangeCard interaction={{ ...mockInteraction, suite_a_donner: null }} />)
    expect(screen.queryByText('Rappeler la semaine prochaine')).not.toBeInTheDocument()
  })

  it('affiche le bouton modifier', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument()
  })

  it('affiche le bouton supprimer', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument()
  })
})
