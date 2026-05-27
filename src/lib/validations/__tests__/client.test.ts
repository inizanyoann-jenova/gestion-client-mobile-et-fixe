import { clientSchema } from '../client'

describe('clientSchema', () => {
  it('accepte un client valide', () => {
    const result = clientSchema.safeParse({
      nom: 'Carrefour Grand Nord',
      secteur: 'courants_forts',
      statut: 'actif',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un nom vide', () => {
    const result = clientSchema.safeParse({ nom: '', secteur: 'courants_forts' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('nom')
  })

  it('rejette un secteur invalide', () => {
    const result = clientSchema.safeParse({ nom: 'Test', secteur: 'inconnu' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('secteur')
  })

  it('applique le statut par défaut prospect', () => {
    const result = clientSchema.safeParse({ nom: 'Test', secteur: 'mixte' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.statut).toBe('prospect')
  })
})
