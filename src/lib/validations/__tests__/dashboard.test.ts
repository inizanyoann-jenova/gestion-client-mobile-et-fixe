import { DashboardKpisSchema, TacheLiteSchema, ProjetLiteSchema, DashboardResponseSchema } from '../dashboard'

describe('DashboardKpisSchema', () => {
  it('valide des KPIs valides', () => {
    const result = DashboardKpisSchema.safeParse({
      clients_actifs: 5,
      projets_en_cours: 3,
      taches_urgentes: 2,
      documents_devis: 4,
    })
    expect(result.success).toBe(true)
  })

  it('rejette une valeur négative', () => {
    const result = DashboardKpisSchema.safeParse({
      clients_actifs: -1,
      projets_en_cours: 0,
      taches_urgentes: 0,
      documents_devis: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('TacheLiteSchema', () => {
  it('valide une tâche avec client null', () => {
    const result = TacheLiteSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440001',
      titre: 'Vérifier chantier',
      priorite: 'haute',
      date_echeance: '2026-05-29T08:00:00.000Z',
      client: null,
      projet: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejette une priorité invalide', () => {
    const result = TacheLiteSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440001',
      titre: 'Test',
      priorite: 'extreme',
      date_echeance: null,
      client: null,
      projet: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('DashboardResponseSchema', () => {
  it('valide une réponse complète', () => {
    const result = DashboardResponseSchema.safeParse({
      kpis: { clients_actifs: 3, projets_en_cours: 2, taches_urgentes: 1, documents_devis: 5 },
      taches_du_jour: [],
      projets_recents: [],
    })
    expect(result.success).toBe(true)
  })
})
