import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjetPhotos } from '../projet-photos'

describe('ProjetPhotos', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })
  afterEach(() => jest.restoreAllMocks())

  it('affiche chargement puis aucune photo si liste vide', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [] }),
    })
    render(<ProjetPhotos projetId="p1" />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Aucune photo')).toBeInTheDocument())
  })

  it('affiche les photos chargées', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        photos: [{ name: 'photo1.jpg', signedUrl: 'https://example.com/1.jpg', path: 'chantier-photos/p1/photo1.jpg' }],
      }),
    })
    render(<ProjetPhotos projetId="p1" />)
    await waitFor(() => expect(screen.getByText(/1 photo/)).toBeInTheDocument())
  })

  it('affiche le bouton + Photo', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [] }),
    })
    render(<ProjetPhotos projetId="p1" />)
    await waitFor(() => expect(screen.getByText('+ Photo')).toBeInTheDocument())
  })

  it('retire la photo supprimée de la liste', async () => {
    const photo = { name: 'photo1.jpg', signedUrl: 'https://example.com/1.jpg', path: 'chantier-photos/p1/photo1.jpg' }
    let callCount = 0
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve({ ok: true, json: async () => ({ photos: [photo] }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    render(<ProjetPhotos projetId="p1" />)
    await waitFor(() => screen.getByLabelText('Supprimer la photo'))
    fireEvent.click(screen.getByLabelText('Supprimer la photo'))
    await waitFor(() => expect(screen.queryByLabelText('Supprimer la photo')).not.toBeInTheDocument())
  })
})
