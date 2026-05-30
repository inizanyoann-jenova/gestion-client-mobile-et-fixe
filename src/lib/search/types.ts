export interface SearchResult {
  clients: Array<{ id: string; nom: string; adresse: string | null }>
  projets: Array<{ id: string; titre: string; statut: string }>
  contacts: Array<{ id: string; nom: string; email: string | null; telephone: string | null; client_id: string }>
  devis: Array<{ id: string; numero: string; statut: string }>
}
