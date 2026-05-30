import { render, screen } from '@testing-library/react'
import { RapportFinancier } from '../rapport-financier'
import type { RapportFinancierData } from '@/lib/validations/rapport'

jest.mock('recharts', () => {
  const React = require('react')
  const Mock = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return {
    ResponsiveContainer: Mock,
    BarChart: Mock,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    PieChart: Mock,
    Pie: () => null,
    Cell: () => null,
    Legend: () => null,
  }
})

const data: RapportFinancierData = {
  caMensuel: [
    { mois: '2026-04', label: 'avr. 26', ca: 5000 },
    { mois: '2026-05', label: 'mai 26', ca: 12000 },
  ],
  pipelineDevis: [
    { statut: 'envoyé', count: 3 },
    { statut: 'accepté', count: 5 },
  ],
  topClients: [
    { nom: 'Carrefour Grand Nord', ca: 45000 },
    { nom: 'E. Leclerc', ca: 28000 },
  ],
  tauxAcceptation: 62,
}

describe('RapportFinancier', () => {
  it('affiche le titre CA mensuel', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText(/CA mensuel/i)).toBeInTheDocument()
  })

  it('affiche le taux d acceptation', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('affiche le titre top clients', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText(/Top 5 clients/i)).toBeInTheDocument()
  })

  it('affiche la section pipeline devis', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText(/Pipeline devis/i)).toBeInTheDocument()
  })

  it('colore le taux en amber si entre 40 et 70', () => {
    const { container } = render(<RapportFinancier data={data} />)
    const span = container.querySelector('.text-amber-400')
    expect(span).toBeInTheDocument()
  })

  it('colore le taux en emerald si >= 70', () => {
    const highData = { ...data, tauxAcceptation: 80 }
    const { container } = render(<RapportFinancier data={highData} />)
    expect(container.querySelector('.text-emerald-400')).toBeInTheDocument()
  })

  it('colore le taux en red si < 40', () => {
    const lowData = { ...data, tauxAcceptation: 20 }
    const { container } = render(<RapportFinancier data={lowData} />)
    expect(container.querySelector('.text-red-400')).toBeInTheDocument()
  })
})
