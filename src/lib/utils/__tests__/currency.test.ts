import { formatCurrency } from '../currency'

describe('formatCurrency', () => {
  it('inclut le symbole euro', () => {
    expect(formatCurrency(1500)).toContain('€')
  })

  it('contient le montant', () => {
    expect(formatCurrency(150000)).toMatch(/150/)
  })

  it('retourne une chaîne pour 0', () => {
    expect(formatCurrency(0)).toContain('€')
  })
})
