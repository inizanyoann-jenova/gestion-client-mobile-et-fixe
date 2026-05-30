import {
  buildCaMensuel,
  buildPipelineDevis,
  buildTopClients,
  calcTauxAcceptation,
} from '../rapport'

describe('buildCaMensuel', () => {
  it('retourne toujours 12 mois', () => {
    expect(buildCaMensuel([])).toHaveLength(12)
  })

  it('additionne les montants du même mois', () => {
    const moisCourant = new Date().toISOString().split('T')[0]!.slice(0, 7) + '-15'
    const factures = [
      { date_emission: moisCourant, montant_ttc: 1000 },
      { date_emission: moisCourant, montant_ttc: 500 },
    ]
    const result = buildCaMensuel(factures)
    expect(result.at(-1)!.ca).toBe(1500)
  })

  it('retourne 0 pour les mois sans facture', () => {
    const result = buildCaMensuel([])
    result.forEach(m => expect(m.ca).toBe(0))
  })

  it('les mois sont dans l ordre chronologique', () => {
    const result = buildCaMensuel([])
    const mois = result.map(m => m.mois)
    const sorted = [...mois].sort()
    expect(mois).toEqual(sorted)
  })
})

describe('buildPipelineDevis', () => {
  it('retourne un tableau vide si aucun devis', () => {
    expect(buildPipelineDevis([])).toEqual([])
  })

  it('groupe les devis par statut dans l ordre défini', () => {
    const devis = [
      { statut: 'envoyé' },
      { statut: 'envoyé' },
      { statut: 'accepté' },
      { statut: 'brouillon' },
    ]
    const result = buildPipelineDevis(devis)
    const statuts = result.map(r => r.statut)
    expect(statuts).toContain('brouillon')
    expect(statuts).toContain('envoyé')
    expect(statuts).toContain('accepté')
    expect(result.find(r => r.statut === 'envoyé')?.count).toBe(2)
  })

  it('filtre les statuts avec count 0', () => {
    const devis = [{ statut: 'accepté' }]
    const result = buildPipelineDevis(devis)
    expect(result.every(r => r.count > 0)).toBe(true)
    expect(result).toHaveLength(1)
  })
})

describe('buildTopClients', () => {
  it('retourne au maximum 5 clients', () => {
    const factures = Array.from({ length: 8 }, (_, i) => ({
      client_id: `id-${i}`,
      montant_ttc: 1000 - i * 100,
      client: { nom: `Client ${i}` },
      date_emission: '2026-01-15',
    }))
    expect(buildTopClients(factures)).toHaveLength(5)
  })

  it('additionne le CA par client', () => {
    const factures = [
      { client_id: 'c1', montant_ttc: 2000, client: { nom: 'Client A' }, date_emission: '2026-01-15' },
      { client_id: 'c1', montant_ttc: 1000, client: { nom: 'Client A' }, date_emission: '2026-02-15' },
      { client_id: 'c2', montant_ttc: 5000, client: { nom: 'Client B' }, date_emission: '2026-03-15' },
    ]
    const result = buildTopClients(factures)
    expect(result[0]!.nom).toBe('Client B')
    expect(result[0]!.ca).toBe(5000)
    expect(result[1]!.ca).toBe(3000)
  })

  it('retourne tableau vide si aucune facture', () => {
    expect(buildTopClients([])).toEqual([])
  })
})

describe('calcTauxAcceptation', () => {
  it('retourne 0 si aucun devis cloturé', () => {
    expect(calcTauxAcceptation([])).toBe(0)
    expect(calcTauxAcceptation([{ statut: 'brouillon' }, { statut: 'envoyé' }])).toBe(0)
  })

  it('calcule correctement le taux', () => {
    const devis = [
      { statut: 'accepté' },
      { statut: 'accepté' },
      { statut: 'refusé' },
      { statut: 'brouillon' },
    ]
    expect(calcTauxAcceptation(devis)).toBe(67)
  })

  it('retourne 100 si tous acceptés', () => {
    expect(calcTauxAcceptation([{ statut: 'accepté' }, { statut: 'accepté' }])).toBe(100)
  })

  it('retourne 0 si tous refusés', () => {
    expect(calcTauxAcceptation([{ statut: 'refusé' }, { statut: 'expiré' }])).toBe(0)
  })
})
