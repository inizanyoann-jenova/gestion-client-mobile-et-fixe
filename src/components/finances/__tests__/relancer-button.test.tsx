import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RelancerButton } from '../relancer-button'

describe('RelancerButton', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('affiche le bouton Relancer par défaut', () => {
    render(<RelancerButton factureId="f1" />)
    expect(screen.getByText('Relancer')).toBeInTheDocument()
  })

  it('affiche ... pendant le chargement', async () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<RelancerButton factureId="f1" />)
    fireEvent.click(screen.getByText('Relancer'))
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('affiche confirmation après succès', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<RelancerButton factureId="f1" />)
    fireEvent.click(screen.getByText('Relancer'))
    await waitFor(() => expect(screen.getByText(/relance envoyée/i)).toBeInTheDocument())
  })

  it('affiche erreur si la requête échoue', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<RelancerButton factureId="f1" />)
    fireEvent.click(screen.getByText('Relancer'))
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
  })

  it('appelle /api/factures/[id]/relancer en POST', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<RelancerButton factureId="abc-123" />)
    fireEvent.click(screen.getByText('Relancer'))
    expect(global.fetch).toHaveBeenCalledWith('/api/factures/abc-123/relancer', { method: 'POST' })
  })
})
