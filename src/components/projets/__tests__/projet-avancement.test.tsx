import { render, screen, fireEvent } from '@testing-library/react'
import { ProjetAvancement } from '../projet-avancement'

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
)

describe('ProjetAvancement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('affiche les 5 boutons de pourcentage', () => {
    render(<ProjetAvancement projetId="1" avancement={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('met en valeur le bouton correspondant à l\'avancement actuel', () => {
    render(<ProjetAvancement projetId="1" avancement={50} />)
    const btn50 = screen.getByText('50%').closest('button')
    expect(btn50?.className).toMatch(/bg-sky-500/)
  })

  it('appelle PATCH /api/projets/[id] au clic', async () => {
    render(<ProjetAvancement projetId="abc-123" avancement={0} />)
    fireEvent.click(screen.getByText('75%'))
    expect(fetch).toHaveBeenCalledWith('/api/projets/abc-123', expect.objectContaining({
      method: 'PATCH',
    }))
  })
})
