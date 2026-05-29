import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PdfGenerateButton } from '../pdf-generate-button'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

global.fetch = jest.fn()

describe('PdfGenerateButton', () => {
  afterEach(() => jest.clearAllMocks())

  it('affiche le bouton avec le label du type', () => {
    render(<PdfGenerateButton type="rapport" projetId="p1" clientId="c1" />)
    expect(screen.getByRole('button', { name: /rapport/i })).toBeInTheDocument()
  })

  it('appelle l\'API à la génération', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'doc1' }),
    })
    render(<PdfGenerateButton type="rapport" projetId="p1" clientId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: /rapport/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/generate-pdf'),
        expect.anything()
      )
    })
  })

  it('affiche une erreur si l\'API échoue', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Données manquantes' }),
    })
    render(<PdfGenerateButton type="rapport" projetId="p1" clientId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: /rapport/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
