import type { DevisPdfData, FacturePdfData } from '../finance-pdf-data'

const ENTREPRISE = { nom: 'ATEXIA', adresse: '12 rue des Flamboyants, Saint-Denis' }
const CLIENT = { nom: 'Carrefour Grand Nord', adresse: '1 rue du Commerce', siret: null }

describe('DevisPdfData interface', () => {
  it('construit un objet DevisPdfData valide', () => {
    const data: DevisPdfData = {
      numero: 'DEV-2026-001',
      date_emission: '2026-06-01',
      date_validite: '2026-07-01',
      client: CLIENT,
      lignes: [{ libelle: 'Câblage', quantite: 2, unite: 'h', prix_unitaire: 80, taux_tva: 8.5, total_ht: 160, ordre: 0 }],
      montant_ht: 160,
      montant_tva: 13.6,
      montant_ttc: 173.6,
      entreprise: ENTREPRISE,
    }
    expect(data.numero).toBe('DEV-2026-001')
    expect(data.montant_ttc).toBe(173.6)
  })
})

describe('FacturePdfData interface', () => {
  it('construit une facture type acompte', () => {
    const data: FacturePdfData = {
      numero: 'FACT-2026-001',
      type: 'acompte',
      date_emission: '2026-06-01',
      date_echeance: '2026-07-01',
      devis_numero: 'DEV-2026-001',
      client: CLIENT,
      lignes: [],
      montant_ht: 300,
      montant_tva: 25.5,
      montant_ttc: 325.5,
      pourcentage_acompte: 30,
      entreprise: ENTREPRISE,
    }
    expect(data.type).toBe('acompte')
    expect(data.pourcentage_acompte).toBe(30)
  })

  it('construit une facture standard sans devis', () => {
    const data: FacturePdfData = {
      numero: 'FACT-2026-002',
      type: 'facture',
      date_emission: '2026-06-01',
      date_echeance: '2026-07-01',
      devis_numero: null,
      client: CLIENT,
      lignes: [],
      montant_ht: 1000,
      montant_tva: 85,
      montant_ttc: 1085,
      entreprise: { ...ENTREPRISE, rib_iban: 'FR76 3000 4000 0300 0000 0000 042' },
    }
    expect(data.entreprise.rib_iban).toContain('FR76')
  })
})
