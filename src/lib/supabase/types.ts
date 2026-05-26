export type Secteur = 'courants_forts' | 'courants_faibles' | 'photovoltaique' | 'mixte'
export type StatutClient = 'prospect' | 'actif' | 'inactif'
export type TypeProjet = 'installation' | 'etude' | 'maintenance' | 'sav'
export type SecteurProjet = 'courants_forts' | 'courants_faibles' | 'photovoltaique'
export type StatutProjet = 'en_etude' | 'en_cours' | 'termine' | 'sav'
export type TypeDocument = 'devis' | 'rapport' | 'plan' | 'photo' | 'contrat' | 'autre'
export type PrioriteTask = 'haute' | 'normale' | 'basse'
export type StatutTache = 'a_faire' | 'fait'
export type TypeInteraction = 'appel' | 'email' | 'visite' | 'reunion' | 'autre'

export interface Client {
  id: string
  nom: string
  secteur: Secteur
  adresse: string | null
  siret: string | null
  statut: StatutClient
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  client_id: string
  prenom: string
  nom: string
  poste: string | null
  telephone: string | null
  email: string | null
  est_principal: boolean
  created_at: string
  updated_at: string
}

export interface Projet {
  id: string
  client_id: string
  titre: string
  type: TypeProjet
  secteur: SecteurProjet
  statut: StatutProjet
  avancement: number
  montant_devis: number | null
  montant_facture: number | null
  date_debut_estimee: string | null
  date_fin_estimee: string | null
  date_fin_reelle: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string | null
  projet_id: string | null
  type: TypeDocument
  nom: string
  description: string | null
  storage_path: string | null
  taille_octets: number | null
  genere_par_app: boolean
  created_at: string
}

export interface Tache {
  id: string
  client_id: string | null
  projet_id: string | null
  titre: string
  description: string | null
  date_echeance: string | null
  priorite: PrioriteTask
  statut: StatutTache
  notification_active: boolean
  notification_email: boolean
  notification_push: boolean
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  client_id: string | null
  projet_id: string | null
  type: TypeInteraction
  date: string
  resume: string
  suite_a_donner: string | null
  created_at: string
}

export interface ModuleConfig {
  id: string
  cle: string
  label: string
  icone: string
  ordre: number
  visible: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>
      }
      projets: {
        Row: Projet
        Insert: Omit<Projet, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Projet, 'id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at'>>
      }
      taches: {
        Row: Tache
        Insert: Omit<Tache, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tache, 'id' | 'created_at'>>
      }
      interactions: {
        Row: Interaction
        Insert: Omit<Interaction, 'id' | 'created_at'>
        Update: Partial<Omit<Interaction, 'id' | 'created_at'>>
      }
      modules_config: {
        Row: ModuleConfig
        Insert: Omit<ModuleConfig, 'id' | 'created_at'>
        Update: Partial<Omit<ModuleConfig, 'id' | 'created_at'>>
      }
    }
  }
}
