import {
  PrestationCreateSchema,
  DevisCreateSchema,
  DevisStatutSchema,
  ConvertirSchema,
  FactureUpdateSchema,
  FactureListQuerySchema,
} from '../finance'

describe('PrestationCreateSchema', () => {
  it('accepte une prestation valide', () => {
    const r = PrestationCreateSchema.safeParse({ libelle: 'Câblage réseau', prix_unitaire: 80 })
    expect(r.success).toBe(true)
  })

  it('rejette un libellé vide', () => {
    const r = PrestationCreateSchema.safeParse({ libelle: '', prix_unitaire: 80 })
    expect(r.success).toBe(false)
  })

  it('applique TVA par défaut 8.5', () => {
    const r = PrestationCreateSchema.safeParse({ libelle: 'Test', prix_unitaire: 100 })
    if (r.success) expect(r.data.taux_tva).toBe(8.5)
  })
})

describe('DevisCreateSchema', () => {
  it('accepte un devis valide avec lignes', () => {
    const r = DevisCreateSchema.safeParse({
      client_id: 'c0e9cd12-1234-8234-a234-111111111111',
      date_validite: '2026-06-30',
      lignes: [{ libelle: 'Câblage', quantite: 2, unite: 'h', prix_unitaire: 80, taux_tva: 8.5 }],
    })
    expect(r.success).toBe(true)
  })

  it('rejette sans client_id', () => {
    const r = DevisCreateSchema.safeParse({ date_validite: '2026-06-30', lignes: [] })
    expect(r.success).toBe(false)
  })

  it('rejette une ligne avec prix_unitaire négatif', () => {
    const r = DevisCreateSchema.safeParse({
      client_id: 'c0e9cd12-1234-8234-a234-111111111111',
      date_validite: '2026-06-30',
      lignes: [{ libelle: 'Test', quantite: 1, unite: 'u', prix_unitaire: -10, taux_tva: 8.5 }],
    })
    expect(r.success).toBe(false)
  })
})

describe('DevisStatutSchema', () => {
  it('accepte accepté', () => {
    expect(DevisStatutSchema.safeParse({ statut: 'accepté' }).success).toBe(true)
  })

  it('rejette brouillon (non autorisé via cet endpoint)', () => {
    expect(DevisStatutSchema.safeParse({ statut: 'brouillon' }).success).toBe(false)
  })
})

describe('ConvertirSchema', () => {
  it('accepte mode unique', () => {
    expect(ConvertirSchema.safeParse({ mode: 'unique' }).success).toBe(true)
  })

  it('accepte acompte_solde avec pourcentage', () => {
    const r = ConvertirSchema.safeParse({ mode: 'acompte_solde', pourcentage_acompte: 30 })
    expect(r.success).toBe(true)
  })

  it('rejette acompte_solde sans pourcentage', () => {
    expect(ConvertirSchema.safeParse({ mode: 'acompte_solde' }).success).toBe(false)
  })
})

describe('FactureUpdateSchema', () => {
  it('accepte une date de paiement valide', () => {
    const r = FactureUpdateSchema.safeParse({ date_paiement: '2026-06-15' })
    expect(r.success).toBe(true)
  })
})

describe('FactureListQuerySchema', () => {
  it('applique page=1 par défaut', () => {
    const r = FactureListQuerySchema.safeParse({})
    if (r.success) expect(r.data.page).toBe(1)
  })
})
