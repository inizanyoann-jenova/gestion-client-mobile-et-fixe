interface ClientLite { nom: string; adresse?: string | null; siret?: string | null }
interface ProjetLite { titre: string; type: string; secteur: string }

export interface RapportData {
  reference: string
  date: string
  client: ClientLite
  projet: ProjetLite
  resume: string
  entreprise: { nom: string; adresse?: string; telephone?: string; email?: string }
}

export interface LigneDevis { description: string; quantite: number; prixUnitaire: number }
export interface DevisData {
  reference: string
  date: string
  client: ClientLite
  projet: ProjetLite
  lignes: (LigneDevis & { total: number })[]
  totalHT: number
  tva: number
  totalTTC: number
  entreprise: { nom: string; adresse?: string; telephone?: string; email?: string }
}

function today(): string {
  return new Date().toLocaleDateString('fr-FR')
}

function ref(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function buildRapportData(params: {
  client: ClientLite
  projet: ProjetLite
  resume: string
  entreprise?: RapportData['entreprise']
}): RapportData {
  return {
    reference: ref('RAP'),
    date: today(),
    client: params.client,
    projet: params.projet,
    resume: params.resume,
    entreprise: params.entreprise ?? { nom: 'ATEXIA' },
  }
}

export function buildDevisData(params: {
  client: ClientLite
  projet: ProjetLite
  lignes: LigneDevis[]
  entreprise?: DevisData['entreprise']
}): DevisData {
  const lignes = params.lignes.map((l) => ({
    ...l,
    total: round2(l.quantite * l.prixUnitaire),
  }))
  const totalHT = round2(lignes.reduce((s, l) => s + l.total, 0))
  const tva = round2(totalHT * 0.2)
  const totalTTC = round2(totalHT + tva)

  return {
    reference: ref('DEV'),
    date: today(),
    client: params.client,
    projet: params.projet,
    lignes,
    totalHT,
    tva,
    totalTTC,
    entreprise: params.entreprise ?? { nom: 'ATEXIA' },
  }
}
