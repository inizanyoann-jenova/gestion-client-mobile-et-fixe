# Spec — Dashboard Financier Graphiques (Amélioration #1)

**Date :** 2026-05-30  
**Statut :** Approuvé

---

## Objectif

Ajouter un onglet "Rapport" à la page `/finances` qui affiche des graphiques visuels permettant au patron d'ATEXIA de suivre son activité financière en un coup d'œil.

---

## Intégration

- **Route :** `/finances?tab=rapport` — 3e onglet après Devis et Factures
- **Pas de nouvelle route** — s'intègre dans la page existante
- **Lib :** `recharts` (à installer via npm)

---

## Composants et données

### 4 sections visuelles

**1. CA mensuel (12 mois glissants)**
- Type : BarChart vertical (Recharts)
- Couleur : emerald
- Source : `factures` WHERE `statut = 'payée'` AND `date_emission >= 12 mois` — groupé par mois en JS
- Axe X : mois abrégé (janv., févr., …), Axe Y : montant TTC en €

**2. Pipeline devis**
- Type : PieChart / Donut (Recharts)
- 5 couleurs : brouillon (slate), envoyé (sky), accepté (emerald), refusé (red), expiré (amber)
- Source : `devis` — tous, groupés par `statut` en JS
- Légende avec count par statut

**3. Top 5 clients par CA**
- Type : BarChart horizontal (Recharts)
- Couleur : sky
- Source : `factures` WHERE `statut = 'payée'` + JOIN `clients(nom)` — groupé par `client_id` en JS, top 5

**4. Indicateurs taux d'acceptation**
- Chiffre en grand + badge couleur
- Calcul : `devis.accepté / (devis.accepté + devis.refusé + devis.expiré)` × 100
- Source : même requête devis que le pipeline

---

## Architecture

### Fichiers nouveaux

- `src/lib/validations/rapport.ts` — types Zod : `CaMensuelItem`, `PipelineDevisItem`, `TopClientItem`, `RapportFinancierData`
- `src/components/finances/rapport-financier.tsx` — Client Component, reçoit `RapportFinancierData`, affiche les 4 sections Recharts
- `src/components/finances/__tests__/rapport-financier.test.tsx` — tests rendu et calculs

### Fichiers modifiés

- `src/app/(app)/finances/page.tsx` — ajout onglet "Rapport", branche `tab=rapport` dans `getFinancesData()`, fetch 2 requêtes supplémentaires
- `src/lib/supabase/finance-types.ts` — ajout types `RapportData`

### Requêtes Supabase (server-side)

```ts
// CA mensuel : factures payées des 12 derniers mois
supabase.from('factures')
  .select('date_emission, montant_ttc')
  .eq('statut', 'payée')
  .gte('date_emission', dateMoins12Mois)

// Pipeline + taux acceptation : tous les devis
supabase.from('devis')
  .select('statut, montant_ttc')

// Top 5 clients : factures payées avec nom client
supabase.from('factures')
  .select('client_id, montant_ttc, client:clients(nom)')
  .eq('statut', 'payée')
```

Le groupement par mois / par client est fait en JS côté serveur avant de passer les données au Client Component.

---

## Tests

- Rendu du composant `RapportFinancier` avec données mock
- Calcul du taux d'acceptation (cas : 0 devis clôturés)
- Groupement CA par mois (données non triées → ordre chronologique)
- Groupement top clients (ex-aequo → ordre CA desc)

---

## Non-inclus dans cette spec

- Filtre par période (trimestre, année) → amélioration future
- Export PDF du rapport → plan 6 (déjà fait pour devis/factures)
- Comparaison N vs N-1 → amélioration future
