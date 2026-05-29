import { nextNumero, devisPrefix, facturePrefix } from '../numero'

describe('nextNumero', () => {
  it('génère 001 quand lastNumero est null', () => {
    expect(nextNumero('DEV-2026-', null)).toBe('DEV-2026-001')
  })

  it('incrémente à partir du dernier numéro', () => {
    expect(nextNumero('DEV-2026-', 'DEV-2026-003')).toBe('DEV-2026-004')
  })

  it('pad à 3 chiffres', () => {
    expect(nextNumero('DEV-2026-', 'DEV-2026-009')).toBe('DEV-2026-010')
  })

  it('gère les numéros à 3 chiffres sans troncature', () => {
    expect(nextNumero('DEV-2026-', 'DEV-2026-099')).toBe('DEV-2026-100')
  })
})

describe('devisPrefix / facturePrefix', () => {
  it('construit le préfixe devis', () => {
    expect(devisPrefix(2026)).toBe('DEV-2026-')
  })

  it('construit le préfixe facture', () => {
    expect(facturePrefix(2026)).toBe('FACT-2026-')
  })
})
