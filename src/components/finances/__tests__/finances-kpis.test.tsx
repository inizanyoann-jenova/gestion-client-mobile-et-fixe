import { render, screen } from '@testing-library/react'
import { FinancesKpis } from '../finances-kpis'

const kpis = {
  devis_en_cours_montant: 15000,
  ca_facture_annee: 42000,
  montant_impaye: 3200,
  factures_en_retard: 2,
}

describe('FinancesKpis', () => {
  it('affiche le CA facturé', () => {
    render(<FinancesKpis kpis={kpis} />)
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })

  it('affiche le nombre de factures en retard', () => {
    render(<FinancesKpis kpis={kpis} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
