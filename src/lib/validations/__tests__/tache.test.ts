import { TacheCreateSchema } from '../tache'

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
