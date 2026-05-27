import { z } from 'zod'

export const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(100),
  secteur: z.enum(['courants_forts', 'courants_faibles', 'photovoltaique', 'mixte']),
  adresse: z.string().max(200).nullable().optional(),
  siret: z.string().nullable().optional(),
  statut: z.enum(['prospect', 'actif', 'inactif']).default('prospect'),
  notes: z.string().nullable().optional(),
})

export type ClientInput = z.infer<typeof clientSchema>
