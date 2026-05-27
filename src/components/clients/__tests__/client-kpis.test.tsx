import { render, screen } from '@testing-library/react'
import { ClientKpis } from '../client-kpis'

describe('ClientKpis', () => {
  it('affiche les 3 labels', () => {
    render(<ClientKpis kpis={{ ca_realise: 0, montant_attente: 0, nombre_projets: 0 }} />)
    expect(screen.getByText('CA réalisé')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
    expect(screen.getByText('Projets')).toBeInTheDocument()
  })

  it('affiche le nombre de projets', () => {
    render(<ClientKpis kpis={{ ca_realise: 0, montant_attente: 0, nombre_projets: 7 }} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('affiche le symbole € dans les montants', () => {
    render(<ClientKpis kpis={{ ca_realise: 50000, montant_attente: 20000, nombre_projets: 0 }} />)
    const euros = screen.getAllByText(/€/)
    expect(euros.length).toBeGreaterThanOrEqual(2)
  })
})
