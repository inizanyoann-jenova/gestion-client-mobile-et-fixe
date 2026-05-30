import { render, screen, fireEvent } from '@testing-library/react'
import { GuideUtilisateur } from '../guide-utilisateur'

describe('GuideUtilisateur', () => {
  it('affiche le titre Démarrage rapide', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText(/démarrage rapide/i)).toBeInTheDocument()
  })

  it('affiche les 7 étapes numérotées', () => {
    render(<GuideUtilisateur />)
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('affiche le titre Référence des modules', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText(/référence des modules/i)).toBeInTheDocument()
  })

  it('affiche les 7 titres de modules principaux', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Clients & Contacts')).toBeInTheDocument()
    expect(screen.getByText('Projets & Chantiers')).toBeInTheDocument()
    expect(screen.getByText('Tâches & Rappels')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Échanges')).toBeInTheDocument()
    expect(screen.getByText('Finances')).toBeInTheDocument()
  })

  it('affiche les sections supplémentaires Notifications et PWA', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText('Notifications Push')).toBeInTheDocument()
    expect(screen.getByText('Installation Android (PWA)')).toBeInTheDocument()
  })

  it('les 9 boutons accordéon sont présents et accessibles', () => {
    render(<GuideUtilisateur />)
    const boutons = screen.getAllByRole('button')
    expect(boutons.length).toBe(9)
    boutons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded')
    })
  })

  it("le contenu d'un accordéon est caché par défaut puis visible après clic", () => {
    render(<GuideUtilisateur />)
    const btnDashboard = screen.getByRole('button', { name: /dashboard/i })
    expect(btnDashboard).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(btnDashboard)
    expect(btnDashboard).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/kpis affichés/i)).toBeInTheDocument()
  })

  it('ferme un accordéon ouvert au second clic', () => {
    render(<GuideUtilisateur />)
    const btn = screen.getByRole('button', { name: /finances/i })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('affiche une section Astuce dans chaque module', () => {
    render(<GuideUtilisateur />)
    // Les 9 spans "Astuce :" sont dans le DOM même si leur section est repliée
    const astuces = screen.getAllByText(/^Astuce\s*:/i)
    expect(astuces.length).toBe(9)
  })
})
