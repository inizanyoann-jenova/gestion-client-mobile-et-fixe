export interface EntrepriseInfo {
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  siret?: string
  rib_iban?: string
  rib_bic?: string
  rib_banque?: string
}

export interface ClientInfo {
  nom: string
  adresse?: string | null
  siret?: string | null
}

export interface LignePdf {
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  total_ht: number
  ordre: number
}

export interface DevisPdfData {
  numero: string
  date_emission: string
  date_validite: string
  client: ClientInfo
  lignes: LignePdf[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  notes?: string | null
  entreprise: EntrepriseInfo
}

export interface FacturePdfData {
  numero: string
  type: 'facture' | 'acompte' | 'solde'
  date_emission: string
  date_echeance: string
  devis_numero?: string | null
  client: ClientInfo
  lignes: LignePdf[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  pourcentage_acompte?: number | null
  notes?: string | null
  entreprise: EntrepriseInfo
}
