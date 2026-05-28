import { ProjetCreateSchema, ProjetUpdateSchema, ProjetPatchSchema } from '../projet'

describe('ProjetCreateSchema', () => {
  it('accepte un projet valide minimal', () => {
    const result = ProjetCreateSchema.safeParse({
      titre: 'Installation PV Carrefour',
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'installation',
      secteur: 'photovoltaique',
      statut: 'en_etude',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un titre trop court', () => {
    const result = ProjetCreateSchema.safeParse({
      titre: 'A',
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'installation',
      secteur: 'photovoltaique',
      statut: 'en_etude',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('titre')
  })

  it('rejette un client_id non-UUID', () => {
    const result = ProjetCreateSchema.safeParse({
      titre: 'Projet test',
      client_id: 'pas-un-uuid',
      type: 'installation',
      secteur: 'photovoltaique',
      statut: 'en_etude',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('client_id')
  })

  it('rejette un statut invalide', () => {
    const result = ProjetCreateSchema.safeParse({
      titre: 'Projet test',
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'installation',
      secteur: 'photovoltaique',
      statut: 'inconnu',
    })
    expect(result.success).toBe(false)
  })

  it('accepte un montant_devis positif', () => {
    const result = ProjetCreateSchema.safeParse({
      titre: 'Projet test',
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'installation',
      secteur: 'photovoltaique',
      statut: 'en_cours',
      montant_devis: 50000,
    })
    expect(result.success).toBe(true)
  })
})

describe('ProjetUpdateSchema', () => {
  it('accepte une mise à jour partielle', () => {
    const result = ProjetUpdateSchema.safeParse({ titre: 'Nouveau titre' })
    expect(result.success).toBe(true)
  })
})

describe('ProjetPatchSchema', () => {
  it('accepte un avancement entre 0 et 100', () => {
    const result = ProjetPatchSchema.safeParse({ avancement: 75 })
    expect(result.success).toBe(true)
  })

  it('rejette un avancement hors borne', () => {
    const result = ProjetPatchSchema.safeParse({ avancement: 101 })
    expect(result.success).toBe(false)
  })

  it('accepte des notes nulles', () => {
    const result = ProjetPatchSchema.safeParse({ notes: null })
    expect(result.success).toBe(true)
  })
})
