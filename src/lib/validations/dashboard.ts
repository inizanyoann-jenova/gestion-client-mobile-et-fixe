import { z } from 'zod'

export const DashboardKpisSchema = z.object({
  clients_actifs: z.number().int().nonnegative(),
  projets_en_cours: z.number().int().nonnegative(),
  taches_urgentes: z.number().int().nonnegative(),
  documents_devis: z.number().int().nonnegative(),
})

export const TacheLiteSchema = z.object({
  id: z.string().uuid(),
  titre: z.string(),
  priorite: z.enum(['haute', 'normale', 'basse']),
  date_echeance: z.string().nullable(),
  client: z.object({ id: z.string(), nom: z.string() }).nullable(),
  projet: z.object({ id: z.string(), titre: z.string() }).nullable(),
})

export const ProjetLiteSchema = z.object({
  id: z.string().uuid(),
  titre: z.string(),
  statut: z.string(),
  avancement: z.number(),
  updated_at: z.string(),
  client: z.object({ id: z.string(), nom: z.string() }),
})

export const DashboardResponseSchema = z.object({
  kpis: DashboardKpisSchema,
  taches_du_jour: z.array(TacheLiteSchema),
  projets_recents: z.array(ProjetLiteSchema),
})

export type DashboardKpis = z.infer<typeof DashboardKpisSchema>
export type TacheLite = z.infer<typeof TacheLiteSchema>
export type ProjetLite = z.infer<typeof ProjetLiteSchema>
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>
