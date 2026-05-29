import { z } from 'zod'

export const PARAMETRES_CLES = [
  'entreprise_nom',
  'entreprise_adresse',
  'entreprise_siret',
  'entreprise_telephone',
  'entreprise_email',
] as const

export const ParametresClesSchema = z.enum(PARAMETRES_CLES)

// In Zod v4, z.union([..., z.undefined()]) does not make the object key optional.
// Use .optional() chained on the field validator instead.
export const EntrepriseSchema = z.object({
  entreprise_nom: z.string().min(1, 'Nom requis').max(200),
  entreprise_adresse: z.string().max(500).optional(),
  entreprise_siret: z
    .string()
    .refine((v) => v === '' || /^\d{14}$/.test(v), 'SIRET doit être 14 chiffres')
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
  entreprise_telephone: z.string().max(20).optional(),
  entreprise_email: z
    .union([z.string().email('Email invalide'), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
})

export type EntrepriseData = z.infer<typeof EntrepriseSchema>
export type ParametresCle = z.infer<typeof ParametresClesSchema>
