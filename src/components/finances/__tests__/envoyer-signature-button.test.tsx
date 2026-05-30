import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnvoyerSignatureButton } from '../envoyer-signature-button'

beforeEach(() => { global.fetch = jest.fn() })
afterEach(() => jest.restoreAllMocks())

describe('EnvoyerSignatureButton', () => {
  it('affiche le bouton Envoyer pour signature', () => {
    render(<EnvoyerSignatureButton devisId="d1" />)
    expect(screen.getByText(/envoyer pour signature/i)).toBeInTheDocument()
  })

  it('affiche ... pendant le chargement', async () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<EnvoyerSignatureButton devisId="d1" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('affiche confirmation après succès', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<EnvoyerSignatureButton devisId="d1" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    await waitFor(() => expect(screen.getByText(/lien envoyé/i)).toBeInTheDocument())
  })

  it('affiche erreur si la requête échoue', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Erreur' }) })
    render(<EnvoyerSignatureButton devisId="d1" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
  })

  it('appelle POST /api/devis/[id]/envoyer-signature', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<EnvoyerSignatureButton devisId="abc-123" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    expect(global.fetch).toHaveBeenCalledWith('/api/devis/abc-123/envoyer-signature', { method: 'POST' })
  })
})
