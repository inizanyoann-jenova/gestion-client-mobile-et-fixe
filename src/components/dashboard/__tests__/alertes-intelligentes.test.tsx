import { render, screen } from '@testing-library/react'
import { AlertesIntelligentes } from '../alertes-intelligentes'
import type { AlerteDevis, AlerteClient } from '../alertes-intelligentes'

const devisFixture: AlerteDevis[] = [
  { id: 'd1', numero: 'DEV-001', clientNom: 'Carrefour Grand Nord', joursAttente: 12 },
]

const clientsFixture: AlerteClient[] = [
  { id: 'c1', nom: 'E. Leclerc', joursDormant: 75 },
]

describe('AlertesIntelligentes', () => {
  it('retourne null si aucune alerte', () => {
    const { container } = render(
      <AlertesIntelligentes devisSansReponse={[]} clientsDormants={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('affiche le titre Alertes si au moins une alerte', () => {
    render(<AlertesIntelligentes devisSansReponse={devisFixture} clientsDormants={[]} />)
    expect(screen.getByText('Alertes')).toBeInTheDocument()
  })

  it('affiche le numéro de devis et le nom du client', () => {
    render(<AlertesIntelligentes devisSansReponse={devisFixture} clientsDormants={[]} />)
    expect(screen.getByText('Devis DEV-001')).toBeInTheDocument()
    expect(screen.getByText(/Carrefour Grand Nord/)).toBeInTheDocument()
    expect(screen.getByText('12j')).toBeInTheDocument()
  })

  it('affiche le client dormant avec le nombre de jours', () => {
    render(<AlertesIntelligentes devisSansReponse={[]} clientsDormants={clientsFixture} />)
    expect(screen.getByText('E. Leclerc')).toBeInTheDocument()
    expect(screen.getByText('75j')).toBeInTheDocument()
  })

  it('affiche plusieurs alertes simultanément', () => {
    render(<AlertesIntelligentes devisSansReponse={devisFixture} clientsDormants={clientsFixture} />)
    expect(screen.getByText('Devis DEV-001')).toBeInTheDocument()
    expect(screen.getByText('E. Leclerc')).toBeInTheDocument()
  })

  it('le lien devis pointe vers /finances/devis/[id]', () => {
    render(<AlertesIntelligentes devisSansReponse={devisFixture} clientsDormants={[]} />)
    const link = screen.getByText('Devis DEV-001').closest('a')
    expect(link).toHaveAttribute('href', '/finances/devis/d1')
  })

  it('le lien client pointe vers /clients/[id]', () => {
    render(<AlertesIntelligentes devisSansReponse={[]} clientsDormants={clientsFixture} />)
    const link = screen.getByText('E. Leclerc').closest('a')
    expect(link).toHaveAttribute('href', '/clients/c1')
  })
})
