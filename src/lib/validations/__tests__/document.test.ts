import { DocumentUploadSchema, DocumentListQuerySchema, DocumentGlobalUploadSchema } from '../document'

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

describe('DocumentListQuerySchema', () => {
  it('applique page par défaut 1', () => {
    const result = DocumentListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it('filtre par type valide', () => {
    const result = DocumentListQuerySchema.safeParse({ type: 'devis' })
    expect(result.success).toBe(true)
  })

  it('rejette un type invalide', () => {
    const result = DocumentListQuerySchema.safeParse({ type: 'invoice' })
    expect(result.success).toBe(false)
  })
})

describe('DocumentGlobalUploadSchema', () => {
  it('accepte un upload sans client ni projet', () => {
    const result = DocumentGlobalUploadSchema.safeParse({ nom: 'plan.pdf', type: 'plan' })
    expect(result.success).toBe(true)
  })

  it('accepte un upload avec client_id UUID', () => {
    const result = DocumentGlobalUploadSchema.safeParse({
      nom: 'contrat.pdf',
      type: 'contrat',
      client_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un client_id non-UUID', () => {
    const result = DocumentGlobalUploadSchema.safeParse({ nom: 'x.pdf', type: 'autre', client_id: 'invalid' })
    expect(result.success).toBe(false)
  })
})
