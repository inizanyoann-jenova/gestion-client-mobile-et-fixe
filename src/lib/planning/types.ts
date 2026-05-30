export interface CalendarEvent {
  id: string
  type: 'tache' | 'visite' | 'devis' | 'facture'
  label: string
  date: string  // YYYY-MM-DD
  href: string
  color: 'sky' | 'emerald' | 'amber' | 'red'
}

export interface PlanningData {
  taches: Array<{ id: string; titre: string; date_echeance: string | null; statut: string }>
  interactions: Array<{ id: string; type: string; resume: string; date: string }>
  devis: Array<{ id: string; numero: string; statut: string; date_validite: string }>
  factures: Array<{ id: string; numero: string; statut: string; date_echeance: string }>
}
