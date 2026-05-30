import { render, screen } from '@testing-library/react'
import { GuideUtilisateur } from '../guide-utilisateur'

describe('GuideUtilisateur', () => {
  it('affiche le titre Démarrage rapide', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText(/démarrage rapide/i)).toBeInTheDocument()
  })

  it('affiche les 5 étapes numérotées', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('affiche le titre Référence des modules', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText(/référence des modules/i)).toBeInTheDocument()
  })

  it('affiche les 7 titres de modules', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Clients & Contacts')).toBeInTheDocument()
    expect(screen.getByText('Projets & Chantiers')).toBeInTheDocument()
    expect(screen.getByText('Tâches & Rappels')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Échanges')).toBeInTheDocument()
    expect(screen.getByText('Finances')).toBeInTheDocument()
  })

  it('affiche la section Astuce pour chaque module', () => {
    render(<GuideUtilisateur />)
    const astuces = screen.getAllByText(/astuce/i)
    expect(astuces.length).toBe(7)
  })
})
