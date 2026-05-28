import { z } from 'zod'

export const ProjetCreateSchema = z.object({
  titre: z.string().min(2, 'Titre trop court').max(200),
  client_id: z.string().uuid('client_id doit être un UUID'),
  type: z.enum(['installation', 'etude', 'maintenance', 'sav']),
  secteur: z.enum(['courants_forts', 'courants_faibles', 'photovoltaique']),
  statut: z.enum(['en_etude', 'en_cours', 'termine', 'sav']).default('en_etude'),
  montant_devis: z.number().positive().nullable().optional(),
  date_debut_estimee: z.string().datetime().nullable().optional(),
  date_fin_estimee: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export const ProjetUpdateSchema = ProjetCreateSchema.partial()

export const ProjetPatchSchema = z.union([
  z.object({ avancement: z.number().int().min(0).max(100) }),
  z.object({ notes: z.string().max(5000).nullable() }),
])

export type ProjetCreateInput = z.infer<typeof ProjetCreateSchema>
export type ProjetUpdateInput = z.infer<typeof ProjetUpdateSchema>
export type ProjetPatchInput = z.infer<typeof ProjetPatchSchema>
