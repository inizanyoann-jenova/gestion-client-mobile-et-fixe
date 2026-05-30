// Test the pipeline page data logic inline
describe('pipeline groupement devis', () => {
  type StatutDevis = 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'expiré'
  const STATUTS: StatutDevis[] = ['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré']

  function groupByStatut(devis: { statut: string; montant_ttc: number }[]) {
    const map = new Map<StatutDevis, typeof devis>()
    for (const s of STATUTS) map.set(s, [])
    for (const d of devis) {
      const col = map.get(d.statut as StatutDevis)
      if (col) col.push(d)
    }
    return map
  }

  it('groupe les devis par statut', () => {
    const devis = [
      { statut: 'envoyé', montant_ttc: 1000 },
      { statut: 'envoyé', montant_ttc: 2000 },
      { statut: 'accepté', montant_ttc: 5000 },
    ]
    const map = groupByStatut(devis)
    expect(map.get('envoyé')).toHaveLength(2)
    expect(map.get('accepté')).toHaveLength(1)
    expect(map.get('brouillon')).toHaveLength(0)
  })

  it('ignore les statuts inconnus', () => {
    const devis = [{ statut: 'inconnu', montant_ttc: 1000 }]
    const map = groupByStatut(devis)
    for (const s of STATUTS) {
      expect(map.get(s)).toHaveLength(0)
    }
  })

  it('calcule le total par colonne', () => {
    const cards = [
      { statut: 'envoyé', montant_ttc: 1000 },
      { statut: 'envoyé', montant_ttc: 500 },
    ]
    const map = groupByStatut(cards)
    const total = (map.get('envoyé') ?? []).reduce((s, d) => s + d.montant_ttc, 0)
    expect(total).toBe(1500)
  })
})
