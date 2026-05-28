import { DocumentUploadSchema } from '../document'

describe('DocumentUploadSchema', () => {
  it('accepte un document valide', () => {
    const result = DocumentUploadSchema.safeParse({ nom: 'devis.pdf', type: 'devis' })
    expect(result.success).toBe(true)
  })

  it('rejette un nom vide', () => {
    const result = DocumentUploadSchema.safeParse({ nom: '', type: 'devis' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('nom')
  })

  it('rejette un type invalide', () => {
    const result = DocumentUploadSchema.safeParse({ nom: 'fichier.pdf', type: 'facture' })
    expect(result.success).toBe(false)
  })
})
