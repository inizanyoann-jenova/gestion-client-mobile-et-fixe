import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignatureForm } from '../signature-form'

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

beforeEach(() => {
  global.fetch = jest.fn()
  mockReplace.mockReset()
})

afterEach(() => jest.restoreAllMocks())

describe('SignatureForm', () => {
  it('affiche le champ nom et la case à cocher', () => {
    render(<SignatureForm token="abc-token" />)
    expect(screen.getByPlaceholderText(/votre nom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/j'accepte/i)).toBeInTheDocument()
  })

  it('le bouton Signer est désactivé par défaut', () => {
    render(<SignatureForm token="abc-token" />)
    expect(screen.getByRole('button', { name: /signer/i })).toBeDisabled()
  })

  it('le bouton Signer reste désactivé si seulement le nom est renseigné', () => {
    render(<SignatureForm token="abc-token" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Jean Dupont' } })
    expect(screen.getByRole('button', { name: /signer/i })).toBeDisabled()
  })

  it("le bouton Signer reste désactivé si seulement la case est cochée", () => {
    render(<SignatureForm token="abc-token" />)
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    expect(screen.getByRole('button', { name: /signer/i })).toBeDisabled()
  })

  it("le bouton Signer s'active quand nom + case cochée", () => {
    render(<SignatureForm token="abc-token" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Jean Dupont' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    expect(screen.getByRole('button', { name: /signer/i })).not.toBeDisabled()
  })

  it('appelle POST /api/devis/signer avec token et signe_par', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<SignatureForm token="tok-123" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Marie Martin' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    fireEvent.click(screen.getByRole('button', { name: /signer/i }))
    expect(global.fetch).toHaveBeenCalledWith('/api/devis/signer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'tok-123', signe_par: 'Marie Martin' }),
    })
  })

  it('redirige vers /devis/[token]/confirme après succès', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<SignatureForm token="tok-123" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Pierre Durand' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    fireEvent.click(screen.getByRole('button', { name: /signer/i }))
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/devis/tok-123/confirme'))
  })

  it("affiche un message d'erreur si la requête échoue", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Lien expiré' }),
    })
    render(<SignatureForm token="tok-123" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    fireEvent.click(screen.getByRole('button', { name: /signer/i }))
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
  })
})
