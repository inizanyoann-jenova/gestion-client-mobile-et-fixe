import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EntrepriseForm } from '../entreprise-form'

global.fetch = jest.fn()

const INITIAL = {
  entreprise_nom: 'ATEXIA',
  entreprise_adresse: '12 rue des Flamboyants',
  entreprise_siret: '',
  entreprise_telephone: '0262123456',
  entreprise_email: 'contact@atexia.re',
}

describe('EntrepriseForm', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })
  afterEach(() => jest.clearAllMocks())

  it('affiche les champs pré-remplis', () => {
    render(<EntrepriseForm initial={INITIAL} />)
    expect(screen.getByDisplayValue('ATEXIA')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0262123456')).toBeInTheDocument()
  })

  it('affiche le bouton Enregistrer', () => {
    render(<EntrepriseForm initial={INITIAL} />)
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument()
  })

  it('appelle PUT /api/parametres à la soumission', async () => {
    render(<EntrepriseForm initial={INITIAL} />)
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/parametres', expect.objectContaining({ method: 'PUT' }))
    })
  })

  it('affiche un message de succès après sauvegarde', async () => {
    render(<EntrepriseForm initial={INITIAL} />)
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(await screen.findByText(/enregistré/i)).toBeInTheDocument()
  })
})
