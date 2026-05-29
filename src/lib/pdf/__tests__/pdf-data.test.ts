import { buildRapportData, buildDevisData } from '../pdf-data'

const CLIENT = { nom: 'Carrefour Grand Nord', adresse: '12 rue Victor Hugo', siret: '12345678901234' }
const PROJET = { titre: 'Installation TGBT', type: 'installation', secteur: 'courants_forts' }

describe('buildRapportData', () => {
  it('construit les données avec les champs requis', () => {
    const data = buildRapportData({ client: CLIENT, projet: PROJET, resume: 'Travaux réalisés : installation TGBT' })
    expect(data.client.nom).toBe('Carrefour Grand Nord')
    expect(data.projet.titre).toBe('Installation TGBT')
    expect(data.resume).toBeTruthy()
    expect(data.date).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(data.reference).toMatch(/RAP-\d+/)
  })
})

describe('buildDevisData', () => {
  it('construit les données avec calcul TVA 20%', () => {
    const lignes = [{ description: 'Câblage réseau', quantite: 10, prixUnitaire: 80 }]
    const data = buildDevisData({ client: CLIENT, projet: PROJET, lignes })
    expect(data.totalHT).toBe(800)
    expect(data.tva).toBe(160)
    expect(data.totalTTC).toBe(960)
  })

  it('arrondit à 2 décimales', () => {
    const lignes = [{ description: 'Câble', quantite: 3, prixUnitaire: 10.333 }]
    const data = buildDevisData({ client: CLIENT, projet: PROJET, lignes })
    expect(data.totalHT).toBe(31)
  })
})
