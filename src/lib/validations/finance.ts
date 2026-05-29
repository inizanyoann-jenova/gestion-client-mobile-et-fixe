import { z } from 'zod'

const LigneSchema = z.object({
  prestation_id: z.string().uuid().nullable().optional(),
  libelle: z.string().min(1, 'Libellé requis').max(300),
  quantite: z.number().positive('Quantité doit être positive'),
  unite: z.string().min(1).max(20).default('u'),
  prix_unitaire: z.number().nonnegative('Prix doit être positif ou nul'),
  taux_tva: z.number().min(0).max(100).default(8.5),
  ordre: z.number().int().nonnegative().default(0),
})

export const PrestationCreateSchema = z.object({
  libelle: z.string().min(1, 'Libellé requis').max(300),
  description: z.string().max(1000).nullable().optional(),
  unite: z.string().min(1).max(20).default('u'),
  prix_unitaire: z.number().nonnegative().default(0),
  taux_tva: z.number().min(0).max(100).default(8.5),
})

export const PrestationUpdateSchema = PrestationCreateSchema.partial().extend({
  actif: z.boolean().optional(),
})

export const DevisCreateSchema = z.object({
  client_id: z.string().uuid(),
  projet_id: z.string().uuid().nullable().optional(),
  date_emission: z.string().date().optional(),
  date_validite: z.string().date(),
  notes: z.string().max(2000).nullable().optional(),
  lignes: z.array(LigneSchema).min(0),
})

export const DevisUpdateSchema = DevisCreateSchema

export const DevisListQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  projet_id: z.string().uuid().optional(),
  statut: z.enum(['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

export const DevisStatutSchema = z.object({
  statut: z.enum(['accepté', 'refusé']),
})

export const ConvertirSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('unique') }),
  z.object({
    mode: z.literal('acompte_solde'),
    pourcentage_acompte: z.number().min(1).max(99),
  }),
])

export const FactureCreateSchema = z.object({
  client_id: z.string().uuid(),
  projet_id: z.string().uuid().nullable().optional(),
  date_emission: z.string().date().optional(),
  date_echeance: z.string().date(),
  notes: z.string().max(2000).nullable().optional(),
  lignes: z.array(LigneSchema).min(0),
})

export const FactureUpdateSchema = z.object({
  date_paiement: z.string().date(),
})

export const FactureListQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  projet_id: z.string().uuid().optional(),
  statut: z.enum(['émise', 'payée', 'en_retard']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type PrestationCreateInput = z.infer<typeof PrestationCreateSchema>
export type PrestationUpdateInput = z.infer<typeof PrestationUpdateSchema>
export type DevisCreateInput = z.infer<typeof DevisCreateSchema>
export type DevisUpdateInput = z.infer<typeof DevisUpdateSchema>
export type DevisListQuery = z.infer<typeof DevisListQuerySchema>
export type DevisStatutInput = z.infer<typeof DevisStatutSchema>
export type ConvertirInput = z.infer<typeof ConvertirSchema>
export type FactureCreateInput = z.infer<typeof FactureCreateSchema>
export type FactureUpdateInput = z.infer<typeof FactureUpdateSchema>
export type FactureListQuery = z.infer<typeof FactureListQuerySchema>
