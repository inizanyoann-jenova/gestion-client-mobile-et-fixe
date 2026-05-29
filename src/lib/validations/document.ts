import { z } from 'zod'

export const DocumentUploadSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(200),
  type: z.enum(['devis', 'rapport', 'plan', 'photo', 'contrat', 'autre']),
  description: z.string().max(1000).nullable().optional(),
})

export const DocumentGlobalUploadSchema = DocumentUploadSchema.extend({
  client_id: z.string().uuid().nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
})

export const DocumentListQuerySchema = z.object({
  type: z.enum(['devis', 'rapport', 'plan', 'photo', 'contrat', 'autre']).optional(),
  client_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>
export type DocumentGlobalUploadInput = z.infer<typeof DocumentGlobalUploadSchema>
export type DocumentListQuery = z.infer<typeof DocumentListQuerySchema>
