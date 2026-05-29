import { z } from 'zod'

export const InteractionCreateSchema = z.object({
  type: z.enum(['appel', 'email', 'visite', 'reunion', 'autre']),
  date: z.string().datetime(),
  resume: z.string().min(1, 'Résumé requis').max(2000),
  suite_a_donner: z.string().max(500).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
})

export const InteractionUpdateSchema = InteractionCreateSchema

export const InteractionListQuerySchema = z.object({
  type: z.enum(['appel', 'email', 'visite', 'reunion', 'autre']).optional(),
  client_id: z.string().uuid().optional(),
  projet_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type InteractionCreateInput = z.infer<typeof InteractionCreateSchema>
export type InteractionUpdateInput = z.infer<typeof InteractionUpdateSchema>
export type InteractionListQuery = z.infer<typeof InteractionListQuerySchema>
