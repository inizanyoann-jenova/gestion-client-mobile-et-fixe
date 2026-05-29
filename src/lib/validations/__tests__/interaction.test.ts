import { InteractionCreateSchema, InteractionListQuerySchema } from '../interaction'

describe('InteractionCreateSchema', () => {
  const validDate = '2026-05-29T10:00:00.000Z'

  it('accepte une interaction valide minimale', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'appel', date: validDate, resume: 'Discussion' })
    expect(result.success).toBe(true)
  })

  it('rejette un type invalide', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'sms', date: validDate, resume: 'Discussion' })
    expect(result.success).toBe(false)
  })

  it('rejette un résumé vide', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'email', date: validDate, resume: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('resume')
  })

  it('accepte suite_a_donner null', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'visite', date: validDate, resume: 'Visite chantier', suite_a_donner: null })
    expect(result.success).toBe(true)
  })

  it('accepte tous les types valides', () => {
    for (const type of ['appel', 'email', 'visite', 'reunion', 'autre'] as const) {
      const result = InteractionCreateSchema.safeParse({ type, date: validDate, resume: 'Test' })
      expect(result.success).toBe(true)
    }
  })
})

describe('InteractionListQuerySchema', () => {
  it('applique page par défaut 1', () => {
    const result = InteractionListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it('rejette un type invalide', () => {
    const result = InteractionListQuerySchema.safeParse({ type: 'sms' })
    expect(result.success).toBe(false)
  })

  it('accepte un client_id UUID valide', () => {
    const result = InteractionListQuerySchema.safeParse({ client_id: '123e4567-e89b-12d3-a456-426614174000' })
    expect(result.success).toBe(true)
  })

  it('rejette un client_id non-UUID', () => {
    const result = InteractionListQuerySchema.safeParse({ client_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('coerce page en nombre', () => {
    const result = InteractionListQuerySchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(3)
  })
})
