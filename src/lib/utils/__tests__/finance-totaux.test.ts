import { computeTotaux, computeTotalHtLigne } from '../finance-totaux'

describe('computeTotaux', () => {
  it('retourne zéros pour tableau vide', () => {
    const r = computeTotaux([])
    expect(r).toEqual({ montant_ht: 0, montant_tva: 0, montant_ttc: 0 })
  })

  it('calcule HT = somme quantite * prix_unitaire', () => {
    const r = computeTotaux([{ quantite: 2, prix_unitaire: 100, taux_tva: 8.5 }])
    expect(r.montant_ht).toBe(200)
  })

  it('calcule TVA à 8,5%', () => {
    const r = computeTotaux([{ quantite: 1, prix_unitaire: 1000, taux_tva: 8.5 }])
    expect(r.montant_tva).toBe(85)
  })

  it('calcule TTC = HT + TVA', () => {
    const r = computeTotaux([{ quantite: 1, prix_unitaire: 1000, taux_tva: 8.5 }])
    expect(r.montant_ttc).toBe(1085)
  })

  it('arrondit à 2 décimales', () => {
    const r = computeTotaux([{ quantite: 3, prix_unitaire: 10.333, taux_tva: 8.5 }])
    expect(r.montant_ht).toBe(31)
  })
})

describe('computeTotalHtLigne', () => {
  it('calcule quantite * prix arrondi 2 décimales', () => {
    expect(computeTotalHtLigne(3, 10.333)).toBe(31)
  })
})
