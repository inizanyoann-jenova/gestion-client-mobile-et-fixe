import { contactSchema } from '../contact'

describe('contactSchema', () => {
  it('accepte un contact valide', () => {
    const result = contactSchema.safeParse({
      prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un prénom vide', () => {
    const result = contactSchema.safeParse({ prenom: '', nom: 'Dupont' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('prenom')
  })

  it('rejette un email invalide', () => {
    const result = contactSchema.safeParse({
      prenom: 'Jean', nom: 'Dupont', email: 'pas-un-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepte un email vide (string vide autorisé)', () => {
    const result = contactSchema.safeParse({
      prenom: 'Jean', nom: 'Dupont', email: '',
    })
    expect(result.success).toBe(true)
  })
})
