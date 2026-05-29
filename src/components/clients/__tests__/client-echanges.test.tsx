import { render, screen } from '@testing-library/react'
import { ClientEchanges } from '../client-echanges'

const INTERACTION = {
  id: 'i1',
  type: 'appel',
  date: '2026-05-20T10:00:00.000Z',
  resume: 'Discussion sur le devis photovoltaïque',
  suite_a_donner: 'Envoyer offre révisée',
  client_id: 'c1',
  projet_id: null,
  created_at: '2026-05-20T10:00:00.000Z',
}

global.fetch = jest.fn()

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ interactions: [INTERACTION], total: 1 }),
  })
})

afterEach(() => jest.clearAllMocks())

describe('ClientEchanges', () => {
  it('affiche un état de chargement puis le résumé', async () => {
    render(<ClientEchanges clientId="c1" />)
    expect(await screen.findByText('Discussion sur le devis photovoltaïque')).toBeInTheDocument()
  })

  it('affiche la suite à donner', async () => {
    render(<ClientEchanges clientId="c1" />)
    expect(await screen.findByText(/Envoyer offre révisée/)).toBeInTheDocument()
  })

  it('affiche le message vide si aucune interaction', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interactions: [], total: 0 }),
    })
    render(<ClientEchanges clientId="c1" />)
    expect(await screen.findByText(/aucun échange/i)).toBeInTheDocument()
  })
})
