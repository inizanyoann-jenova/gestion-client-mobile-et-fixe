import { loginSchema } from '../auth'

describe('loginSchema', () => {
  it('accepte un email et mot de passe valides', () => {
    const result = loginSchema.safeParse({ email: 'test@atexia.re', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({ email: 'pas-un-email', password: 'secret123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('email')
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ email: 'test@atexia.re', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('password')
  })
})
