import { z } from 'zod'

export const DocumentUploadSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(200),
  type: z.enum(['devis', 'rapport', 'plan', 'photo', 'contrat', 'autre']),
  description: z.string().max(1000).nullable().optional(),
})

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>
