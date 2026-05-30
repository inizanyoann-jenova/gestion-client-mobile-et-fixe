import type { CaMensuelItem, PipelineDevisItem, TopClientItem } from '@/lib/validations/rapport'

type FactureRow = {
  date_emission: string
  montant_ttc: number
  client_id: string
  client: { nom: string } | null
}

type DevisRow = { statut: string }

const STATUTS_DEVIS = ['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré'] as const

export function buildCaMensuel(
  factures: Pick<FactureRow, 'date_emission' | 'montant_ttc'>[]
): CaMensuelItem[] {
  const map = new Map<string, number>()
  factures.forEach(f => {
    const d = new Date(f.date_emission)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + Number(f.montant_ttc))
  })
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    return { mois: key, label, ca: map.get(key) ?? 0 }
  })
}

export function buildPipelineDevis(devis: DevisRow[]): PipelineDevisItem[] {
  const map = new Map<string, number>()
  devis.forEach(d => map.set(d.statut, (map.get(d.statut) ?? 0) + 1))
  return STATUTS_DEVIS
    .map(s => ({ statut: s, count: map.get(s) ?? 0 }))
    .filter(s => s.count > 0)
}

export function buildTopClients(factures: FactureRow[]): TopClientItem[] {
  const map = new Map<string, { nom: string; ca: number }>()
  factures.forEach(f => {
    const nom = (f.client as { nom: string } | null)?.nom ?? 'Inconnu'
    const prev = map.get(f.client_id) ?? { nom, ca: 0 }
    map.set(f.client_id, { nom: prev.nom, ca: prev.ca + Number(f.montant_ttc) })
  })
  return [...map.values()].sort((a, b) => b.ca - a.ca).slice(0, 5)
}

export function calcTauxAcceptation(devis: DevisRow[]): number {
  const clotures = devis.filter(d => ['accepté', 'refusé', 'expiré'].includes(d.statut))
  if (clotures.length === 0) return 0
  const acceptes = devis.filter(d => d.statut === 'accepté').length
  return Math.round((acceptes / clotures.length) * 100)
}
