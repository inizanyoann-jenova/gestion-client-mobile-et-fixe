import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TacheCard } from '../tache-card'
import type { Tache } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

global.fetch = jest.fn()

const mockTache: Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
} = {
  id: 'tache-1',
  titre: 'Envoyer le devis Carrefour',
  description: null,
  statut: 'a_faire',
  priorite: 'haute',
  date_echeance: null,
  client_id: 'client-1',
  projet_id: null,
  notification_active: false,
  notification_email: false,
  notification_push: false,
  created_at: '2026-05-28T00:00:00Z',
  updated_at: '2026-05-28T00:00:00Z',
  client: { id: 'client-1', nom: 'Carrefour Grand Nord' },
  projet: null,
}

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('TacheCard', () => {
  it('affiche le titre de la tâche', () => {
    render(<TacheCard tache={mockTache} />)
    expect(screen.getByText('Envoyer le devis Carrefour')).toBeInTheDocument()
  })

  it('affiche le badge priorité haute', () => {
    render(<TacheCard tache={mockTache} />)
    expect(screen.getByText('Haute')).toBeInTheDocument()
  })

  it('affiche le lien vers le client', () => {
    render(<TacheCard tache={mockTache} />)
    const clientLink = screen.getByRole('link', { name: /carrefour grand nord/i })
    expect(clientLink).toHaveAttribute('href', '/clients/client-1')
  })

  it('affiche en opacité réduite quand statut=fait', () => {
    const tacheFaite = { ...mockTache, statut: 'fait' as const }
    const { container } = render(<TacheCard tache={tacheFaite} />)
    expect(container.firstChild).toHaveClass('opacity-50')
  })

  it('affiche la date en rouge si échéance dépassée et statut=a_faire', () => {
    const tacheEnRetard = {
      ...mockTache,
      date_echeance: '2020-01-01T00:00:00Z',
    }
    render(<TacheCard tache={tacheEnRetard} />)
    const dateEl = screen.getByText(/⚠/)
    expect(dateEl).toHaveClass('text-red-400')
  })

  it('toggle le statut au clic sur la checkbox', async () => {
    render(<TacheCard tache={mockTache} />)
    const checkbox = screen.getByRole('button', { name: /marquer comme fait/i })
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/taches/tache-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ statut: 'fait' }),
        })
      )
    })
  })
})
