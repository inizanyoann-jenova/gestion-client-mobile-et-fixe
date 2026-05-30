import { z } from 'zod'

export const CaMensuelItemSchema = z.object({
  mois: z.string(),
  label: z.string(),
  ca: z.number(),
})

export const PipelineDevisItemSchema = z.object({
  statut: z.string(),
  count: z.number().int().nonnegative(),
})

export const TopClientItemSchema = z.object({
  nom: z.string(),
  ca: z.number(),
})

export const RapportFinancierDataSchema = z.object({
  caMensuel: z.array(CaMensuelItemSchema),
  pipelineDevis: z.array(PipelineDevisItemSchema),
  topClients: z.array(TopClientItemSchema),
  tauxAcceptation: z.number().int().min(0).max(100),
})

export type CaMensuelItem = z.infer<typeof CaMensuelItemSchema>
export type PipelineDevisItem = z.infer<typeof PipelineDevisItemSchema>
export type TopClientItem = z.infer<typeof TopClientItemSchema>
export type RapportFinancierData = z.infer<typeof RapportFinancierDataSchema>
