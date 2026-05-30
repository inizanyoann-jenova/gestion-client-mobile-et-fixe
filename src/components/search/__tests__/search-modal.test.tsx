import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { SearchModal } from '../search-modal'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  global.fetch = jest.fn()
  jest.useFakeTimers()
  mockPush.mockReset()
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe('SearchModal', () => {
  it('affiche le bouton loupe par défaut', () => {
    render(<SearchModal />)
    expect(screen.getByLabelText('Ouvrir la recherche')).toBeInTheDocument()
  })

  it('ouvre le modal au clic sur le bouton loupe', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('ferme le modal sur la touche Échap', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByPlaceholderText(/rechercher/i)).not.toBeInTheDocument()
  })

  it("ne déclenche pas fetch si la saisie est inférieure à 2 caractères", () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'a' } })
    act(() => { jest.advanceTimersByTime(400) })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('déclenche fetch après 300ms de debounce', () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clients: [], projets: [], contacts: [], devis: [] }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'ca' } })
    expect(global.fetch).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(300) })
    expect(global.fetch).toHaveBeenCalledWith('/api/search?q=ca')
  })

  it('affiche les clients dans les résultats', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [{ id: '1', nom: 'Carrefour Grand Nord', adresse: 'Saint-Denis' }],
        projets: [],
        contacts: [],
        devis: [],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'car' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    expect(await screen.findByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('affiche les projets dans les résultats', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [],
        projets: [{ id: '2', titre: 'Câblage réseau', statut: 'en_cours' }],
        contacts: [],
        devis: [],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'cab' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    expect(await screen.findByText('Câblage réseau')).toBeInTheDocument()
  })

  it('affiche "Aucun résultat" si les 4 sources sont vides', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clients: [], projets: [], contacts: [], devis: [] }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'xyz' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    expect(await screen.findByText(/aucun résultat/i)).toBeInTheDocument()
  })

  it('navigue vers /clients/[id] au clic sur un client', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [{ id: 'c1', nom: 'Leclerc', adresse: 'Saint-Joseph' }],
        projets: [], contacts: [], devis: [],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'lec' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    fireEvent.click(await screen.findByText('Leclerc'))
    expect(mockPush).toHaveBeenCalledWith('/clients/c1')
  })

  it('navigue vers /finances/devis/[id] au clic sur un devis', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [], projets: [], contacts: [],
        devis: [{ id: 'd1', numero: 'DEV-2026-001', statut: 'envoyé' }],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'DEV' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    fireEvent.click(await screen.findByText('DEV-2026-001'))
    expect(mockPush).toHaveBeenCalledWith('/finances/devis/d1')
  })

  it('ouvre le modal avec Ctrl+K', () => {
    render(<SearchModal />)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('navigue vers /projets/[id] au clic sur un projet', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [], contacts: [], devis: [],
        projets: [{ id: 'p1', titre: 'Câblage réseau', statut: 'en_cours' }],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'cab' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    fireEvent.click(await screen.findByText('Câblage réseau'))
    expect(mockPush).toHaveBeenCalledWith('/projets/p1')
  })

  it('navigue vers /clients/[client_id] au clic sur un contact', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [], projets: [], devis: [],
        contacts: [{ id: 'con1', nom: 'Martin', prenom: 'Sophie', email: 's.martin@test.com', telephone: null, client_id: 'cli1' }],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'mar' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    fireEvent.click(await screen.findByText(/Sophie Martin/i))
    expect(mockPush).toHaveBeenCalledWith('/clients/cli1')
  })
})
