import { render, screen } from '@testing-library/react'
import { DashboardKpis } from '../dashboard-kpis'

const kpis = {
  clients_actifs: 5,
  projets_en_cours: 3,
  taches_urgentes: 2,
  documents_devis: 4,
}

describe('DashboardKpis', () => {
  it('affiche les 4 valeurs numériques', () => {
    render(<DashboardKpis kpis={kpis} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('affiche les 4 labels', () => {
    render(<DashboardKpis kpis={kpis} />)
    expect(screen.getByText('Clients actifs')).toBeInTheDocument()
    expect(screen.getByText('Projets en cours')).toBeInTheDocument()
    expect(screen.getByText('Tâches urgentes')).toBeInTheDocument()
    expect(screen.getByText('Devis')).toBeInTheDocument()
  })

  it('affiche 0 sans crasher', () => {
    render(
      <DashboardKpis
        kpis={{ clients_actifs: 0, projets_en_cours: 0, taches_urgentes: 0, documents_devis: 0 }}
      />
    )
    expect(screen.getAllByText('0')).toHaveLength(4)
  })
})
