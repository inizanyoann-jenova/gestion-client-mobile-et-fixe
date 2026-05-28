import { rappelEmailHtml } from '../rappel-template'

describe('rappelEmailHtml', () => {
  it('contient le titre de la tâche', () => {
    const html = rappelEmailHtml({
      titreTache: 'Envoyer le devis Carrefour',
      dateEcheance: '28 mai 2026',
      clientNom: 'Carrefour Grand Nord',
      projetTitre: null,
      isToday: false,
    })
    expect(html).toContain('Envoyer le devis Carrefour')
  })

  it('affiche "Rappel tâche demain" quand isToday=false', () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '29 mai 2026',
      clientNom: null,
      projetTitre: null,
      isToday: false,
    })
    expect(html).toContain('Rappel tâche demain')
  })

  it("affiche \"Tâche à faire aujourd'hui\" quand isToday=true", () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '28 mai 2026',
      clientNom: null,
      projetTitre: null,
      isToday: true,
    })
    expect(html).toContain("Tâche à faire aujourd'hui")
  })

  it('inclut le contexte client et projet quand fournis', () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '28 mai 2026',
      clientNom: 'Carrefour',
      projetTitre: 'Installation PV',
      isToday: false,
    })
    expect(html).toContain('Carrefour')
    expect(html).toContain('Installation PV')
  })

  it('retourne du HTML valide (doctype + html)', () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '28 mai 2026',
      clientNom: null,
      projetTitre: null,
      isToday: false,
    })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })
})
