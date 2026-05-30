export type StatutDevis = 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'expiré'
export type TypeFacture = 'facture' | 'acompte' | 'solde'
export type StatutFacture = 'émise' | 'payée' | 'en_retard'

export interface Prestation {
  id: string
  libelle: string
  description: string | null
  unite: string
  prix_unitaire: number
  taux_tva: number
  actif: boolean
  created_at: string
}

export interface Devis {
  id: string
  numero: string
  client_id: string
  projet_id: string | null
  statut: StatutDevis
  date_emission: string
  date_validite: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DevisLigne {
  id: string
  devis_id: string
  prestation_id: string | null
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  total_ht: number
  ordre: number
}

export interface Facture {
  id: string
  numero: string
  devis_id: string | null
  client_id: string
  projet_id: string | null
  type: TypeFacture
  statut: StatutFacture
  date_emission: string
  date_echeance: string
  pourcentage_acompte: number | null
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  date_paiement: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FactureLigne {
  id: string
  facture_id: string
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  total_ht: number
  ordre: number
}

export interface DevisAvecLignes extends Devis {
  lignes: DevisLigne[]
  client: { id: string; nom: string; adresse: string | null; siret: string | null }
  projet: { id: string; titre: string } | null
}

export interface FactureAvecLignes extends Facture {
  lignes: FactureLigne[]
  client: { id: string; nom: string; adresse: string | null; siret: string | null }
  projet: { id: string; titre: string } | null
  devis_numero?: string | null
}

export interface FinancesKpisData {
  devis_en_cours_montant: number
  ca_facture_annee: number
  montant_impaye: number
  factures_en_retard: number
}

export interface DevisToken {
  id: string
  devis_id: string
  token: string
  expires_at: string
  signed_at: string | null
  signe_par: string | null
  created_at: string
}
