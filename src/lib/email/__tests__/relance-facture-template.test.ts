import { relanceFactureEmailHtml } from '../relance-facture-template'

describe('relanceFactureEmailHtml', () => {
  it('inclut le numéro de facture', () => {
    const html = relanceFactureEmailHtml({
      numeroFacture: 'FACT-2026-001',
      montantTtc: 1085,
      dateEcheance: '2026-06-15',
      clientNom: 'Carrefour Grand Nord',
      joursRetard: 7,
    })
    expect(html).toContain('FACT-2026-001')
  })

  it('inclut le montant formaté', () => {
    const html = relanceFactureEmailHtml({
      numeroFacture: 'FACT-2026-001',
      montantTtc: 1085,
      dateEcheance: '2026-06-15',
      clientNom: 'Carrefour',
      joursRetard: 7,
    })
    expect(html).toContain('1085')
  })

  it('mentionne relance ferme à J+30', () => {
    const html = relanceFactureEmailHtml({
      numeroFacture: 'FACT-2026-001',
      montantTtc: 500,
      dateEcheance: '2026-05-15',
      clientNom: 'Client Test',
      joursRetard: 30,
    })
    expect(html.toLowerCase()).toContain('relance')
  })
})
