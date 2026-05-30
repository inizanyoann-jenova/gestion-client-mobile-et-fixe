import { normalizeEvents } from '../normalize-events'

describe('normalizeEvents', () => {
  it('retourne un tableau vide si aucune donnée', () => {
    const result = normalizeEvents({ taches: [], interactions: [], devis: [], factures: [] })
    expect(result).toHaveLength(0)
  })

  it('convertit une tâche en CalendarEvent sky', () => {
    const result = normalizeEvents({
      taches: [{ id: 't1', titre: 'Appeler client', date_echeance: '2026-06-15', statut: 'à_faire' }],
      interactions: [], devis: [], factures: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 't1', type: 'tache', label: 'Appeler client',
      date: '2026-06-15', href: '/taches', color: 'sky',
    })
  })

  it('ignore les tâches sans date_echeance', () => {
    const result = normalizeEvents({
      taches: [{ id: 't1', titre: 'Sans date', date_echeance: null, statut: 'à_faire' }],
      interactions: [], devis: [], factures: [],
    })
    expect(result).toHaveLength(0)
  })

  it('convertit une visite en CalendarEvent emerald', () => {
    const result = normalizeEvents({
      taches: [],
      interactions: [{ id: 'i1', type: 'visite', resume: 'Visite chantier', date: '2026-06-10' }],
      devis: [], factures: [],
    })
    expect(result[0]).toEqual({
      id: 'i1', type: 'visite', label: 'Visite',
      date: '2026-06-10', href: '/echanges', color: 'emerald',
    })
  })

  it('ignore les interactions non-visite', () => {
    const result = normalizeEvents({
      taches: [],
      interactions: [{ id: 'i1', type: 'appel', resume: '', date: '2026-06-01' }],
      devis: [], factures: [],
    })
    expect(result).toHaveLength(0)
  })

  it('ignore les visites sans date (type non-visite)', () => {
    const result = normalizeEvents({
      taches: [],
      interactions: [{ id: 'i1', type: 'email', resume: '', date: '2026-06-05' }],
      devis: [], factures: [],
    })
    expect(result).toHaveLength(0)
  })

  it('convertit un devis en CalendarEvent amber', () => {
    const result = normalizeEvents({
      taches: [], interactions: [],
      devis: [{ id: 'd1', numero: 'DEV-2026-001', statut: 'envoyé', date_validite: '2026-06-20' }],
      factures: [],
    })
    expect(result[0]).toEqual({
      id: 'd1', type: 'devis', label: 'DEV-2026-001',
      date: '2026-06-20', href: '/finances/devis/d1', color: 'amber',
    })
  })

  it('convertit une facture en CalendarEvent red', () => {
    const result = normalizeEvents({
      taches: [], interactions: [], devis: [],
      factures: [{ id: 'f1', numero: 'FAC-2026-001', statut: 'émise', date_echeance: '2026-06-30' }],
    })
    expect(result[0]).toEqual({
      id: 'f1', type: 'facture', label: 'FAC-2026-001',
      date: '2026-06-30', href: '/finances/factures/f1', color: 'red',
    })
  })

  it('agrège les 4 sources en un seul tableau', () => {
    const result = normalizeEvents({
      taches: [{ id: 't1', titre: 'Tâche', date_echeance: '2026-06-01', statut: 'à_faire' }],
      interactions: [{ id: 'i1', type: 'visite', resume: '', date: '2026-06-05' }],
      devis: [{ id: 'd1', numero: 'DEV-001', statut: 'envoyé', date_validite: '2026-06-10' }],
      factures: [{ id: 'f1', numero: 'FAC-001', statut: 'émise', date_echeance: '2026-06-15' }],
    })
    expect(result).toHaveLength(4)
  })
})
