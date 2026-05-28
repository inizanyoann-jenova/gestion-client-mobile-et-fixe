import { TacheCreateSchema, TacheUpdateSchema, TacheListQuerySchema } from '../tache'

describe('TacheCreateSchema', () => {
  it('accepte une tâche valide minimale', () => {
    const result = TacheCreateSchema.safeParse({ titre: 'Appeler client' })
    expect(result.success).toBe(true)
  })

  it('rejette un titre vide', () => {
    const result = TacheCreateSchema.safeParse({ titre: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('titre')
  })

  it('applique la priorité par défaut normale', () => {
    const result = TacheCreateSchema.safeParse({ titre: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.priorite).toBe('normale')
  })

  it('rejette une priorité invalide', () => {
    const result = TacheCreateSchema.safeParse({ titre: 'Test', priorite: 'urgente' })
    expect(result.success).toBe(false)
  })
})

describe('TacheUpdateSchema', () => {
  it('accepte une mise à jour complète', () => {
    const result = TacheUpdateSchema.safeParse({
      titre: 'Nouveau titre',
      priorite: 'haute',
      statut: 'fait',
      notification_active: true,
      notification_email: false,
      notification_push: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejette un statut invalide', () => {
    const result = TacheUpdateSchema.safeParse({ titre: 'Test', statut: 'en_cours' })
    expect(result.success).toBe(false)
  })
})

describe('TacheListQuerySchema', () => {
  it('applique page=1 par défaut', () => {
    const result = TacheListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it('convertit page string en nombre', () => {
    const result = TacheListQuerySchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(3)
  })

  it('rejette un statut invalide', () => {
    const result = TacheListQuerySchema.safeParse({ statut: 'en_cours' })
    expect(result.success).toBe(false)
  })

  it('accepte tous les filtres valides', () => {
    const result = TacheListQuerySchema.safeParse({
      search: 'devis',
      statut: 'a_faire',
      priorite: 'haute',
      page: '2',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.statut).toBe('a_faire')
      expect(result.data.priorite).toBe('haute')
    }
  })
})
