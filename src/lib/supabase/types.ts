export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          adresse: string | null
          created_at: string
          id: string
          nom: string
          notes: string | null
          secteur: string
          siret: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          id?: string
          nom: string
          notes?: string | null
          secteur: string
          siret?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          id?: string
          nom?: string
          notes?: string | null
          secteur?: string
          siret?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          est_principal: boolean
          id: string
          nom: string
          poste: string | null
          prenom: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          est_principal?: boolean
          id?: string
          nom: string
          poste?: string | null
          prenom: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          est_principal?: boolean
          id?: string
          nom?: string
          poste?: string | null
          prenom?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          genere_par_app: boolean
          id: string
          nom: string
          projet_id: string | null
          storage_path: string | null
          taille_octets: number | null
          type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          genere_par_app?: boolean
          id?: string
          nom: string
          projet_id?: string | null
          storage_path?: string | null
          taille_octets?: number | null
          type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          genere_par_app?: boolean
          id?: string
          nom?: string
          projet_id?: string | null
          storage_path?: string | null
          taille_octets?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          id: string
          projet_id: string | null
          resume: string
          suite_a_donner: string | null
          type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date?: string
          id?: string
          projet_id?: string | null
          resume: string
          suite_a_donner?: string | null
          type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          id?: string
          projet_id?: string | null
          resume?: string
          suite_a_donner?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      modules_config: {
        Row: {
          cle: string
          created_at: string
          icone: string
          id: string
          label: string
          ordre: number
          visible: boolean
        }
        Insert: {
          cle: string
          created_at?: string
          icone: string
          id?: string
          label: string
          ordre?: number
          visible?: boolean
        }
        Update: {
          cle?: string
          created_at?: string
          icone?: string
          id?: string
          label?: string
          ordre?: number
          visible?: boolean
        }
        Relationships: []
      }
      projets: {
        Row: {
          avancement: number
          client_id: string
          created_at: string
          date_debut_estimee: string | null
          date_fin_estimee: string | null
          date_fin_reelle: string | null
          id: string
          montant_devis: number | null
          montant_facture: number | null
          notes: string | null
          secteur: string
          statut: string
          titre: string
          type: string
          updated_at: string
        }
        Insert: {
          avancement?: number
          client_id: string
          created_at?: string
          date_debut_estimee?: string | null
          date_fin_estimee?: string | null
          date_fin_reelle?: string | null
          id?: string
          montant_devis?: number | null
          montant_facture?: number | null
          notes?: string | null
          secteur: string
          statut?: string
          titre: string
          type: string
          updated_at?: string
        }
        Update: {
          avancement?: number
          client_id?: string
          created_at?: string
          date_debut_estimee?: string | null
          date_fin_estimee?: string | null
          date_fin_reelle?: string | null
          id?: string
          montant_devis?: number | null
          montant_facture?: number | null
          notes?: string | null
          secteur?: string
          statut?: string
          titre?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      taches: {
        Row: {
          client_id: string | null
          created_at: string
          date_echeance: string | null
          description: string | null
          id: string
          notification_active: boolean
          notification_email: boolean
          notification_push: boolean
          priorite: string
          projet_id: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          description?: string | null
          id?: string
          notification_active?: boolean
          notification_email?: boolean
          notification_push?: boolean
          priorite?: string
          projet_id?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          description?: string | null
          id?: string
          notification_active?: boolean
          notification_email?: boolean
          notification_push?: boolean
          priorite?: string
          projet_id?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          endpoint: string
          p256dh: string
          auth_key: string
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          p256dh: string
          auth_key: string
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          p256dh?: string
          auth_key?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Domain union types ───────────────────────────────────────────────────────

export type Secteur = 'courants_forts' | 'courants_faibles' | 'photovoltaique' | 'mixte'
export type StatutClient = 'prospect' | 'actif' | 'inactif'
export type TypeProjet = 'installation' | 'etude' | 'maintenance' | 'sav'
export type SecteurProjet = 'courants_forts' | 'courants_faibles' | 'photovoltaique'
export type StatutProjet = 'en_etude' | 'en_cours' | 'termine' | 'sav'
export type TypeDocument = 'devis' | 'rapport' | 'plan' | 'photo' | 'contrat' | 'autre'
export type PrioriteTask = 'haute' | 'normale' | 'basse'
export type StatutTache = 'a_faire' | 'fait'
export type TypeInteraction = 'appel' | 'email' | 'visite' | 'reunion' | 'autre'

// ─── Row interfaces (narrowed from generated Database) ───────────────────────

export type Client = Omit<Database['public']['Tables']['clients']['Row'], 'secteur' | 'statut'> & {
  secteur: Secteur
  statut: StatutClient
}

export type Contact = Database['public']['Tables']['contacts']['Row']

export type Projet = Omit<Database['public']['Tables']['projets']['Row'], 'type' | 'secteur' | 'statut'> & {
  type: TypeProjet
  secteur: SecteurProjet
  statut: StatutProjet
}

export type Document = Omit<Database['public']['Tables']['documents']['Row'], 'type'> & {
  type: TypeDocument
}

export type Tache = Omit<Database['public']['Tables']['taches']['Row'], 'priorite' | 'statut'> & {
  priorite: PrioriteTask
  statut: StatutTache
}

export type Interaction = Omit<Database['public']['Tables']['interactions']['Row'], 'type'> & {
  type: TypeInteraction
}

export type ModuleConfig = Database['public']['Tables']['modules_config']['Row']

export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row']
