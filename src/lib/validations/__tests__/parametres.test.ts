import { EntrepriseSchema, ParametresClesSchema } from '../parametres'

describe('EntrepriseSchema', () => {
  it('valide les infos entreprise complètes', () => {
    const result = EntrepriseSchema.safeParse({
      entreprise_nom: 'ATEXIA',
      entreprise_adresse: '12 rue des Flamboyants, Saint-Denis',
      entreprise_siret: '12345678901234',
      entreprise_telephone: '0262123456',
      entreprise_email: 'contact@atexia.re',
    })
    expect(result.success).toBe(true)
  })

  it('valide avec champs optionnels vides', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: 'ATEXIA' })
    expect(result.success).toBe(true)
  })

  it('rejette un nom vide', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: '' })
    expect(result.success).toBe(false)
  })

  it('rejette un email invalide', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: 'ATEXIA', entreprise_email: 'pas-un-email' })
    expect(result.success).toBe(false)
  })

  it('rejette un SIRET de mauvaise longueur', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: 'ATEXIA', entreprise_siret: '1234' })
    expect(result.success).toBe(false)
  })
})

describe('ParametresClesSchema', () => {
  it('valide les clés autorisées', () => {
    const result = ParametresClesSchema.safeParse('entreprise_nom')
    expect(result.success).toBe(true)
  })

  it('rejette une clé inconnue', () => {
    const result = ParametresClesSchema.safeParse('clé_inconnue')
    expect(result.success).toBe(false)
  })
})
