import { render, screen } from '@testing-library/react'
import { BottomNav } from '../bottom-nav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('affiche les 5 onglets de navigation', () => {
    render(<BottomNav />)
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Projets')).toBeInTheDocument()
    expect(screen.getByText('Tâches')).toBeInTheDocument()
    expect(screen.getByText('Plus')).toBeInTheDocument()
  })

  it("marque l'onglet Accueil comme actif sur /", () => {
    render(<BottomNav />)
    const link = screen.getByRole('link', { name: /accueil/i })
    expect(link).toHaveClass('text-sky-400')
  })

  it("les autres onglets ne sont pas actifs sur /", () => {
    render(<BottomNav />)
    const clientsLink = screen.getByRole('link', { name: /clients/i })
    expect(clientsLink).not.toHaveClass('text-sky-400')
  })
})
