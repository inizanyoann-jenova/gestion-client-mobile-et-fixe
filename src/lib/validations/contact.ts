import { z } from 'zod'

export const contactSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(50),
  nom: z.string().min(1, 'Nom requis').max(50),
  poste: z.string().max(100).nullable().optional(),
  telephone: z.string().max(20).nullable().optional(),
  email: z.union([
    z.string().email('Email invalide'),
    z.literal('').transform(() => null),
    z.null(),
  ]).optional(),
  est_principal: z.boolean().default(false),
})

export type ContactInput = z.infer<typeof contactSchema>
