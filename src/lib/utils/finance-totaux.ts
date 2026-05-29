function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface LigneInput {
  quantite: number
  prix_unitaire: number
  taux_tva: number
}

export function computeTotaux(lignes: LigneInput[]): {
  montant_ht: number
  montant_tva: number
  montant_ttc: number
} {
  let ht = 0
  let tva = 0
  for (const l of lignes) {
    const ligneHt = round2(l.quantite * l.prix_unitaire)
    ht += ligneHt
    tva += round2(ligneHt * (l.taux_tva / 100))
  }
  const montant_ht = round2(ht)
  const montant_tva = round2(tva)
  return { montant_ht, montant_tva, montant_ttc: round2(montant_ht + montant_tva) }
}

export function computeTotalHtLigne(quantite: number, prix_unitaire: number): number {
  return Math.round(quantite * prix_unitaire * 100) / 100
}
