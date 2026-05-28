import { z } from 'zod'

export const TacheCreateSchema = z.object({
  titre: z.string().min(2, 'Titre requis').max(200),
  description: z.string().max(2000).nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  date_echeance: z.string().datetime().nullable().optional(),
  priorite: z.enum(['haute', 'normale', 'basse']).default('normale'),
  notification_active: z.boolean().default(false),
  notification_email: z.boolean().default(false),
  notification_push: z.boolean().default(false),
})

export const TacheUpdateSchema = TacheCreateSchema.extend({
  statut: z.enum(['a_faire', 'fait']).optional(),
})

export const TacheListQuerySchema = z.object({
  search: z.string().optional(),
  statut: z.enum(['a_faire', 'fait']).optional(),
  priorite: z.enum(['haute', 'normale', 'basse']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type TacheCreateInput = z.infer<typeof TacheCreateSchema>
export type TacheUpdateInput = z.infer<typeof TacheUpdateSchema>
export type TacheListQuery = z.infer<typeof TacheListQuerySchema>
