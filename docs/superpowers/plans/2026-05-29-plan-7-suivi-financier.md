# Plan 7 — Suivi Financier ATEXIA CRM

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le module suivi financier ATEXIA CRM : catalogue de prestations, devis complet avec cycle brouillon→envoyé→accepté→facture, facturation en paiement unique ou acompte+solde, génération PDF via @react-pdf/renderer, envoi email via Resend, et relances automatiques J+7/J+30 pour factures impayées.

**Architecture:** Cinq tables Supabase (prestations, devis, devis_lignes, factures, factures_lignes) avec RLS. Les APIs Next.js App Router gèrent le cycle complet. Les PDFs sont générés server-side avec `renderToBuffer` et téléchargeables via `GET /api/devis/[id]/pdf` et `GET /api/factures/[id]/pdf`. L'envoi email utilise Resend déjà installé. Le cron `/api/cron/rappels` est étendu pour les relances financières.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Zod, Supabase PostgreSQL, Resend, @react-pdf/renderer, Tailwind CSS, Jest + Testing Library (jsdom).

---

## Structure des fichiers

### Nouveaux fichiers
```
supabase/migrations/004_finances.sql
src/lib/supabase/finance-types.ts
src/lib/validations/finance.ts
src/lib/validations/__tests__/finance.test.ts
src/lib/utils/numero.ts
src/lib/utils/__tests__/numero.test.ts
src/lib/utils/finance-totaux.ts
src/lib/utils/__tests__/finance-totaux.test.ts
src/lib/pdf/finance-pdf-data.ts
src/lib/pdf/__tests__/finance-pdf-data.test.ts
src/lib/pdf/facture-template.tsx
src/lib/email/relance-facture-template.ts
src/lib/email/__tests__/relance-facture-template.test.ts
src/app/api/prestations/route.ts
src/app/api/prestations/[id]/route.ts
src/app/api/devis/route.ts
src/app/api/devis/[id]/route.ts
src/app/api/devis/[id]/envoyer/route.ts
src/app/api/devis/[id]/statut/route.ts
src/app/api/devis/[id]/convertir/route.ts
src/app/api/devis/[id]/pdf/route.ts
src/app/api/factures/route.ts
src/app/api/factures/[id]/route.ts
src/app/api/factures/[id]/envoyer/route.ts
src/app/api/factures/[id]/pdf/route.ts
src/components/finances/finances-kpis.tsx
src/components/finances/__tests__/finances-kpis.test.tsx
src/components/finances/devis-card.tsx
src/components/finances/__tests__/devis-card.test.tsx
src/components/finances/facture-card.tsx
src/components/finances/__tests__/facture-card.test.tsx
src/components/finances/devis-form.tsx
src/components/finances/devis-ligne-row.tsx
src/components/finances/__tests__/devis-form.test.tsx
src/components/finances/convertir-modal.tsx
src/components/finances/marquer-payee-button.tsx
src/components/finances/envoyer-devis-button.tsx
src/components/finances/envoyer-facture-button.tsx
src/components/parametres/catalogue-form.tsx
src/app/(app)/finances/page.tsx
src/app/(app)/finances/loading.tsx
src/app/(app)/finances/devis/nouveau/page.tsx
src/app/(app)/finances/devis/[id]/page.tsx
src/app/(app)/finances/factures/[id]/page.tsx
```

### Fichiers modifiés
```
src/lib/supabase/types.ts            — ajouter les 5 tables finances au type Database
src/lib/pdf/pdf-data.ts              — corriger TVA 20% → 8,5%
src/lib/pdf/__tests__/pdf-data.test.ts — corriger assertion TVA
src/lib/pdf/devis-template.tsx       — corriger label "TVA 20%" → "TVA 8,5% (DOM)"
src/lib/validations/parametres.ts   — ajouter FINANCE_CLES, RibSchema
src/app/(app)/plus/page.tsx         — ajouter carte Finances
src/components/projets/projet-tabs.tsx — ajouter onglet Finances
src/components/clients/client-tabs.tsx — ajouter onglet Finances
src/app/(app)/parametres/page.tsx   — ajouter onglet Catalogue
src/components/parametres/parametres-tabs.tsx — ajouter onglet Catalogue
src/app/api/cron/rappels/route.ts   — étendre avec relances factures
```

---

## Task 1 : Migration SQL + Types Supabase + Schémas Zod + Utilitaires

**Files:**
- Create: `supabase/migrations/004_finances.sql`
- Create: `src/lib/supabase/finance-types.ts`
- Modify: `src/lib/supabase/types.ts` (add finance tables to Database)
- Create: `src/lib/validations/finance.ts`
- Create: `src/lib/validations/__tests__/finance.test.ts`
- Create: `src/lib/utils/numero.ts`
- Create: `src/lib/utils/__tests__/numero.test.ts`
- Create: `src/lib/utils/finance-totaux.ts`
- Create: `src/lib/utils/__tests__/finance-totaux.test.ts`
- Modify: `src/lib/validations/parametres.ts` (ajouter FINANCE_CLES + RibSchema)

---

- [ ] **Step 1 : Écrire les tests utilitaires (numero.ts + finance-totaux.ts)**

Créer `src/lib/utils/__tests__/numero.test.ts` :
```typescript
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
```

Créer `src/lib/utils/__tests__/finance-totaux.test.ts` :
```typescript
import { computeTotaux, computeTotalHtLigne } from '../finance-totaux'

describe('computeTotaux', () => {
  it('retourne zéros pour tableau vide', () => {
    const r = computeTotaux([])
    expect(r).toEqual({ montant_ht: 0, montant_tva: 0, montant_ttc: 0 })
  })

  it('calcule HT = somme quantite * prix_unitaire', () => {
    const r = computeTotaux([{ quantite: 2, prix_unitaire: 100, taux_tva: 8.5 }])
    expect(r.montant_ht).toBe(200)
  })

  it('calcule TVA à 8,5%', () => {
    const r = computeTotaux([{ quantite: 1, prix_unitaire: 1000, taux_tva: 8.5 }])
    expect(r.montant_tva).toBe(85)
  })

  it('calcule TTC = HT + TVA', () => {
    const r = computeTotaux([{ quantite: 1, prix_unitaire: 1000, taux_tva: 8.5 }])
    expect(r.montant_ttc).toBe(1085)
  })

  it('arrondit à 2 décimales', () => {
    const r = computeTotaux([{ quantite: 3, prix_unitaire: 10.333, taux_tva: 8.5 }])
    expect(r.montant_ht).toBe(31)
  })
})

describe('computeTotalHtLigne', () => {
  it('calcule quantite * prix arrondi 2 décimales', () => {
    expect(computeTotalHtLigne(3, 10.333)).toBe(31)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```
npx jest --testPathPattern="numero|finance-totaux" --no-coverage
```
Attendu : FAIL avec "Cannot find module '../numero'"

- [ ] **Step 3 : Implémenter les utilitaires**

Créer `src/lib/utils/numero.ts` :
```typescript
export function nextNumero(prefix: string, lastNumero: string | null | undefined): string {
  if (!lastNumero) return `${prefix}001`
  const parts = lastNumero.split('-')
  const lastN = parseInt(parts[parts.length - 1] ?? '0', 10)
  return `${prefix}${String(lastN + 1).padStart(3, '0')}`
}

export function devisPrefix(year: number): string {
  return `DEV-${year}-`
}

export function facturePrefix(year: number): string {
  return `FACT-${year}-`
}
```

Créer `src/lib/utils/finance-totaux.ts` :
```typescript
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
```

- [ ] **Step 4 : Écrire les tests Zod**

Créer `src/lib/validations/__tests__/finance.test.ts` :
```typescript
import {
  PrestationCreateSchema,
  DevisCreateSchema,
  DevisStatutSchema,
  ConvertirSchema,
  FactureUpdateSchema,
  FactureListQuerySchema,
} from '../finance'

describe('PrestationCreateSchema', () => {
  it('accepte une prestation valide', () => {
    const r = PrestationCreateSchema.safeParse({ libelle: 'Câblage réseau', prix_unitaire: 80 })
    expect(r.success).toBe(true)
  })

  it('rejette un libellé vide', () => {
    const r = PrestationCreateSchema.safeParse({ libelle: '', prix_unitaire: 80 })
    expect(r.success).toBe(false)
  })

  it('applique TVA par défaut 8.5', () => {
    const r = PrestationCreateSchema.safeParse({ libelle: 'Test', prix_unitaire: 100 })
    if (r.success) expect(r.data.taux_tva).toBe(8.5)
  })
})

describe('DevisCreateSchema', () => {
  it('accepte un devis valide avec lignes', () => {
    const r = DevisCreateSchema.safeParse({
      client_id: 'c0e9cd12-1111-1111-1111-111111111111',
      date_validite: '2026-06-30',
      lignes: [{ libelle: 'Câblage', quantite: 2, unite: 'h', prix_unitaire: 80, taux_tva: 8.5 }],
    })
    expect(r.success).toBe(true)
  })

  it('rejette sans client_id', () => {
    const r = DevisCreateSchema.safeParse({ date_validite: '2026-06-30', lignes: [] })
    expect(r.success).toBe(false)
  })

  it('rejette une ligne avec prix_unitaire négatif', () => {
    const r = DevisCreateSchema.safeParse({
      client_id: 'c0e9cd12-1111-1111-1111-111111111111',
      date_validite: '2026-06-30',
      lignes: [{ libelle: 'Test', quantite: 1, unite: 'u', prix_unitaire: -10, taux_tva: 8.5 }],
    })
    expect(r.success).toBe(false)
  })
})

describe('DevisStatutSchema', () => {
  it('accepte accepté', () => {
    expect(DevisStatutSchema.safeParse({ statut: 'accepté' }).success).toBe(true)
  })

  it('rejette brouillon (non autorisé via cet endpoint)', () => {
    expect(DevisStatutSchema.safeParse({ statut: 'brouillon' }).success).toBe(false)
  })
})

describe('ConvertirSchema', () => {
  it('accepte mode unique', () => {
    expect(ConvertirSchema.safeParse({ mode: 'unique' }).success).toBe(true)
  })

  it('accepte acompte_solde avec pourcentage', () => {
    const r = ConvertirSchema.safeParse({ mode: 'acompte_solde', pourcentage_acompte: 30 })
    expect(r.success).toBe(true)
  })

  it('rejette acompte_solde sans pourcentage', () => {
    expect(ConvertirSchema.safeParse({ mode: 'acompte_solde' }).success).toBe(false)
  })
})

describe('FactureUpdateSchema', () => {
  it('accepte une date de paiement valide', () => {
    const r = FactureUpdateSchema.safeParse({ date_paiement: '2026-06-15' })
    expect(r.success).toBe(true)
  })
})

describe('FactureListQuerySchema', () => {
  it('applique page=1 par défaut', () => {
    const r = FactureListQuerySchema.safeParse({})
    if (r.success) expect(r.data.page).toBe(1)
  })
})
```

- [ ] **Step 5 : Vérifier que les tests Zod échouent**

```
npx jest --testPathPattern="validations/__tests__/finance" --no-coverage
```
Attendu : FAIL avec "Cannot find module '../finance'"

- [ ] **Step 6 : Implémenter les schémas Zod**

Créer `src/lib/validations/finance.ts` :
```typescript
import { z } from 'zod'

const LigneSchema = z.object({
  prestation_id: z.string().uuid().nullable().optional(),
  libelle: z.string().min(1, 'Libellé requis').max(300),
  quantite: z.number().positive('Quantité doit être positive'),
  unite: z.string().min(1).max(20).default('u'),
  prix_unitaire: z.number().nonnegative('Prix doit être positif ou nul'),
  taux_tva: z.number().min(0).max(100).default(8.5),
  ordre: z.number().int().nonnegative().default(0),
})

export const PrestationCreateSchema = z.object({
  libelle: z.string().min(1, 'Libellé requis').max(300),
  description: z.string().max(1000).nullable().optional(),
  unite: z.string().min(1).max(20).default('u'),
  prix_unitaire: z.number().nonnegative().default(0),
  taux_tva: z.number().min(0).max(100).default(8.5),
})

export const PrestationUpdateSchema = PrestationCreateSchema.partial().extend({
  actif: z.boolean().optional(),
})

export const DevisCreateSchema = z.object({
  client_id: z.string().uuid(),
  projet_id: z.string().uuid().nullable().optional(),
  date_emission: z.string().date().optional(),
  date_validite: z.string().date(),
  notes: z.string().max(2000).nullable().optional(),
  lignes: z.array(LigneSchema).min(0),
})

export const DevisUpdateSchema = DevisCreateSchema

export const DevisListQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  projet_id: z.string().uuid().optional(),
  statut: z.enum(['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

export const DevisStatutSchema = z.object({
  statut: z.enum(['accepté', 'refusé']),
})

export const ConvertirSchema = z
  .discriminatedUnion('mode', [
    z.object({ mode: z.literal('unique') }),
    z.object({
      mode: z.literal('acompte_solde'),
      pourcentage_acompte: z.number().min(1).max(99),
    }),
  ])

export const FactureCreateSchema = z.object({
  client_id: z.string().uuid(),
  projet_id: z.string().uuid().nullable().optional(),
  date_emission: z.string().date().optional(),
  date_echeance: z.string().date(),
  notes: z.string().max(2000).nullable().optional(),
  lignes: z.array(LigneSchema).min(0),
})

export const FactureUpdateSchema = z.object({
  date_paiement: z.string().date(),
})

export const FactureListQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  projet_id: z.string().uuid().optional(),
  statut: z.enum(['émise', 'payée', 'en_retard']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type PrestationCreateInput = z.infer<typeof PrestationCreateSchema>
export type PrestationUpdateInput = z.infer<typeof PrestationUpdateSchema>
export type DevisCreateInput = z.infer<typeof DevisCreateSchema>
export type DevisUpdateInput = z.infer<typeof DevisUpdateSchema>
export type DevisListQuery = z.infer<typeof DevisListQuerySchema>
export type DevisStatutInput = z.infer<typeof DevisStatutSchema>
export type ConvertirInput = z.infer<typeof ConvertirSchema>
export type FactureCreateInput = z.infer<typeof FactureCreateSchema>
export type FactureUpdateInput = z.infer<typeof FactureUpdateSchema>
export type FactureListQuery = z.infer<typeof FactureListQuerySchema>
```

- [ ] **Step 7 : Créer la migration SQL**

Créer `supabase/migrations/004_finances.sql` :
```sql
-- prestations (catalogue)
CREATE TABLE IF NOT EXISTS prestations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle       text NOT NULL,
  description   text,
  unite         text NOT NULL DEFAULT 'u',
  prix_unitaire numeric(10,2) NOT NULL DEFAULT 0,
  taux_tva      numeric(4,2)  NOT NULL DEFAULT 8.5,
  actif         boolean       NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON prestations FOR ALL USING (auth.uid() IS NOT NULL);

-- devis
CREATE TABLE IF NOT EXISTS devis (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero         text NOT NULL UNIQUE,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  projet_id      uuid REFERENCES projets(id) ON DELETE SET NULL,
  statut         text NOT NULL DEFAULT 'brouillon',
  date_emission  date NOT NULL DEFAULT CURRENT_DATE,
  date_validite  date NOT NULL,
  montant_ht     numeric(10,2) NOT NULL DEFAULT 0,
  montant_tva    numeric(10,2) NOT NULL DEFAULT 0,
  montant_ttc    numeric(10,2) NOT NULL DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON devis FOR ALL USING (auth.uid() IS NOT NULL);

-- devis_lignes
CREATE TABLE IF NOT EXISTS devis_lignes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id       uuid NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  prestation_id  uuid REFERENCES prestations(id) ON DELETE SET NULL,
  libelle        text NOT NULL,
  quantite       numeric(10,3) NOT NULL DEFAULT 1,
  unite          text NOT NULL DEFAULT 'u',
  prix_unitaire  numeric(10,2) NOT NULL,
  taux_tva       numeric(4,2)  NOT NULL DEFAULT 8.5,
  total_ht       numeric(10,2) NOT NULL,
  ordre          integer       NOT NULL DEFAULT 0
);
ALTER TABLE devis_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON devis_lignes FOR ALL USING (auth.uid() IS NOT NULL);

-- factures
CREATE TABLE IF NOT EXISTS factures (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero              text NOT NULL UNIQUE,
  devis_id            uuid REFERENCES devis(id) ON DELETE SET NULL,
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  projet_id           uuid REFERENCES projets(id) ON DELETE SET NULL,
  type                text NOT NULL DEFAULT 'facture',
  statut              text NOT NULL DEFAULT 'émise',
  date_emission       date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance       date NOT NULL,
  pourcentage_acompte numeric(5,2),
  montant_ht          numeric(10,2) NOT NULL DEFAULT 0,
  montant_tva         numeric(10,2) NOT NULL DEFAULT 0,
  montant_ttc         numeric(10,2) NOT NULL DEFAULT 0,
  date_paiement       date,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON factures FOR ALL USING (auth.uid() IS NOT NULL);

-- factures_lignes
CREATE TABLE IF NOT EXISTS factures_lignes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id     uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  libelle        text NOT NULL,
  quantite       numeric(10,3) NOT NULL DEFAULT 1,
  unite          text NOT NULL DEFAULT 'u',
  prix_unitaire  numeric(10,2) NOT NULL,
  taux_tva       numeric(4,2)  NOT NULL DEFAULT 8.5,
  total_ht       numeric(10,2) NOT NULL,
  ordre          integer       NOT NULL DEFAULT 0
);
ALTER TABLE factures_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON factures_lignes FOR ALL USING (auth.uid() IS NOT NULL);

-- Nouvelles clés app_settings
INSERT INTO app_settings (cle, valeur) VALUES
  ('rib_iban', NULL),
  ('rib_bic', NULL),
  ('rib_banque', NULL),
  ('devis_validite_jours', '30'),
  ('facture_echeance_jours', '30'),
  ('facture_mentions', NULL)
ON CONFLICT (cle) DO NOTHING;
```

- [ ] **Step 8 : Créer finance-types.ts**

Créer `src/lib/supabase/finance-types.ts` :
```typescript
export type StatutDevis = 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'expiré'
export type TypeFacture = 'facture' | 'acompte' | 'solde'
export type StatutFacture = 'émise' | 'payée' | 'en_retard'

export interface Prestation {
  id: string
  libelle: string
  description: string | null
  unite: string
  prix_unitaire: number
  taux_tva: number
  actif: boolean
  created_at: string
}

export interface Devis {
  id: string
  numero: string
  client_id: string
  projet_id: string | null
  statut: StatutDevis
  date_emission: string
  date_validite: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DevisLigne {
  id: string
  devis_id: string
  prestation_id: string | null
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  total_ht: number
  ordre: number
}

export interface Facture {
  id: string
  numero: string
  devis_id: string | null
  client_id: string
  projet_id: string | null
  type: TypeFacture
  statut: StatutFacture
  date_emission: string
  date_echeance: string
  pourcentage_acompte: number | null
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  date_paiement: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FactureLigne {
  id: string
  facture_id: string
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  total_ht: number
  ordre: number
}

export interface DevisAvecLignes extends Devis {
  lignes: DevisLigne[]
  client: { id: string; nom: string; adresse: string | null; siret: string | null }
  projet: { id: string; titre: string } | null
}

export interface FactureAvecLignes extends Facture {
  lignes: FactureLigne[]
  client: { id: string; nom: string; adresse: string | null; siret: string | null }
  projet: { id: string; titre: string } | null
  devis_numero?: string | null
}

export interface FinancesKpisData {
  devis_en_cours_montant: number
  ca_facture_annee: number
  montant_impaye: number
  factures_en_retard: number
}
```

- [ ] **Step 9 : Ajouter les clés finance dans parametres.ts**

Modifier `src/lib/validations/parametres.ts` — ajouter à la fin du fichier (après les exports existants) :
```typescript
export const FINANCE_CLES = [
  'rib_iban',
  'rib_bic',
  'rib_banque',
  'devis_validite_jours',
  'facture_echeance_jours',
  'facture_mentions',
] as const

export const RIB_CLES = ['rib_iban', 'rib_bic', 'rib_banque'] as const

export const RibSchema = z.object({
  rib_iban: z.string().max(50).optional(),
  rib_bic: z.string().max(20).optional(),
  rib_banque: z.string().max(100).optional(),
})

export type RibData = z.infer<typeof RibSchema>
```

- [ ] **Step 10 : Vérifier tous les tests**

```
npx jest --testPathPattern="numero|finance-totaux|validations/__tests__/finance" --no-coverage
```
Attendu : 3 suites, 16+ tests, tous PASS

- [ ] **Step 11 : Commit**

```
git add supabase/migrations/004_finances.sql src/lib/supabase/finance-types.ts src/lib/validations/finance.ts src/lib/validations/__tests__/finance.test.ts src/lib/validations/parametres.ts src/lib/utils/numero.ts src/lib/utils/__tests__/numero.test.ts src/lib/utils/finance-totaux.ts src/lib/utils/__tests__/finance-totaux.test.ts
git commit -m "feat(finance): migration SQL, types, schémas Zod et utilitaires numérotation/totaux"
```

---

## Task 2 : API Prestations CRUD

**Files:**
- Create: `src/app/api/prestations/route.ts`
- Create: `src/app/api/prestations/[id]/route.ts`

---

- [ ] **Step 1 : Implémenter GET /POST /api/prestations**

Créer `src/app/api/prestations/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrestationCreateSchema } from '@/lib/validations/finance'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const actif = new URL(request.url).searchParams.get('actif')

  let query = supabase
    .from('prestations')
    .select('*')
    .order('libelle')

  if (actif === 'true') query = query.eq('actif', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ prestations: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = PrestationCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('prestations')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2 : Implémenter PUT /DELETE /api/prestations/[id]**

Créer `src/app/api/prestations/[id]/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrestationUpdateSchema } from '@/lib/validations/finance'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = PrestationUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('prestations')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  // Désactivation logique uniquement
  const { error } = await supabase
    .from('prestations')
    .update({ actif: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3 : Vérifier que le build passe**

```
npx tsc --noEmit
```
Attendu : 0 erreurs

- [ ] **Step 4 : Commit**

```
git add src/app/api/prestations/
git commit -m "feat(finance): API prestations CRUD"
```

---

## Task 3 : API Devis CRUD

**Files:**
- Create: `src/app/api/devis/route.ts`
- Create: `src/app/api/devis/[id]/route.ts`

---

- [ ] **Step 1 : Implémenter GET /POST /api/devis**

Créer `src/app/api/devis/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DevisCreateSchema, DevisListQuerySchema } from '@/lib/validations/finance'
import { computeTotaux, computeTotalHtLigne } from '@/lib/utils/finance-totaux'
import { nextNumero, devisPrefix } from '@/lib/utils/numero'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = DevisListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { client_id, projet_id, statut, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('devis')
    .select('*, client:clients(id, nom)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (client_id) query = query.eq('client_id', client_id)
  if (projet_id) query = query.eq('projet_id', projet_id)
  if (statut) query = query.eq('statut', statut)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ devis: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = DevisCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const year = new Date().getFullYear()
  const prefix = devisPrefix(year)

  const { data: lastDevis } = await supabase
    .from('devis')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = nextNumero(prefix, lastDevis?.numero ?? null)

  const { lignes: lignesInput, ...devisData } = parsed.data
  const totaux = computeTotaux(lignesInput)

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .insert({ ...devisData, numero, ...totaux })
    .select()
    .single()

  if (devisError) return NextResponse.json({ error: devisError.message }, { status: 500 })

  if (lignesInput.length > 0) {
    const lignesRows = lignesInput.map((l, i) => ({
      devis_id: devis.id,
      prestation_id: l.prestation_id ?? null,
      libelle: l.libelle,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      total_ht: computeTotalHtLigne(l.quantite, l.prix_unitaire),
      ordre: l.ordre ?? i,
    }))

    const { error: lignesError } = await supabase.from('devis_lignes').insert(lignesRows)
    if (lignesError) return NextResponse.json({ error: lignesError.message }, { status: 500 })
  }

  return NextResponse.json(devis, { status: 201 })
}
```

- [ ] **Step 2 : Implémenter GET /PUT /DELETE /api/devis/[id]**

Créer `src/app/api/devis/[id]/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DevisUpdateSchema } from '@/lib/validations/finance'
import { computeTotaux, computeTotalHtLigne } from '@/lib/utils/finance-totaux'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabase
    .from('devis')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.statut !== 'brouillon') {
    return NextResponse.json({ error: 'Seul un devis en brouillon peut être modifié' }, { status: 409 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = DevisUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { lignes: lignesInput, ...devisData } = parsed.data
  const totaux = computeTotaux(lignesInput)

  const { data: devis, error: updateError } = await supabase
    .from('devis')
    .update({ ...devisData, ...totaux, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('devis_lignes').delete().eq('devis_id', id)

  if (lignesInput.length > 0) {
    const lignesRows = lignesInput.map((l, i) => ({
      devis_id: id,
      prestation_id: l.prestation_id ?? null,
      libelle: l.libelle,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      total_ht: computeTotalHtLigne(l.quantite, l.prix_unitaire),
      ordre: l.ordre ?? i,
    }))
    await supabase.from('devis_lignes').insert(lignesRows)
  }

  return NextResponse.json(devis)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabase
    .from('devis')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.statut !== 'brouillon') {
    return NextResponse.json({ error: 'Seul un devis en brouillon peut être supprimé' }, { status: 409 })
  }

  const { error } = await supabase.from('devis').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```
npx tsc --noEmit
```
Attendu : 0 erreurs

- [ ] **Step 4 : Commit**

```
git add src/app/api/devis/
git commit -m "feat(finance): API devis CRUD avec numérotation auto et calcul totaux"
```

---

## Task 4 : API Devis — actions envoyer / statut / convertir / pdf

**Files:**
- Create: `src/app/api/devis/[id]/envoyer/route.ts`
- Create: `src/app/api/devis/[id]/statut/route.ts`
- Create: `src/app/api/devis/[id]/convertir/route.ts`
- Create: `src/app/api/devis/[id]/pdf/route.ts`

---

- [ ] **Step 1 : Implémenter POST /api/devis/[id]/statut**

Créer `src/app/api/devis/[id]/statut/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DevisStatutSchema } from '@/lib/validations/finance'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = DevisStatutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: existing } = await supabase
    .from('devis')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.statut !== 'envoyé') {
    return NextResponse.json({ error: 'Le devis doit être en statut envoyé pour changer de statut' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('devis')
    .update({ statut: parsed.data.statut, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2 : Implémenter GET /api/devis/[id]/pdf**

Créer `src/app/api/devis/[id]/pdf/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { DevisFinanceTemplate } from '@/lib/pdf/devis-finance-template'
import React from 'react'
import type { DevisPdfData } from '@/lib/pdf/finance-pdf-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const [devisRes, settingsRes] = await Promise.all([
    supabase
      .from('devis')
      .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret)')
      .eq('id', id)
      .single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_siret']),
  ])

  if (devisRes.error || !devisRes.data) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  }

  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const d = devisRes.data
  const client = d.client as { nom: string; adresse: string | null; siret: string | null }
  const lignes = (d.lignes as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>).sort((a, b) => a.ordre - b.ordre)

  const pdfData: DevisPdfData = {
    numero: d.numero,
    date_emission: d.date_emission,
    date_validite: d.date_validite,
    client: { nom: client.nom, adresse: client.adresse, siret: client.siret },
    lignes,
    montant_ht: d.montant_ht,
    montant_tva: d.montant_tva,
    montant_ttc: d.montant_ttc,
    notes: d.notes,
    entreprise: {
      nom: settings['entreprise_nom'] ?? 'ATEXIA',
      adresse: settings['entreprise_adresse'] || undefined,
      telephone: settings['entreprise_telephone'] || undefined,
      email: settings['entreprise_email'] || undefined,
      siret: settings['entreprise_siret'] || undefined,
    },
  }

  const buffer = Buffer.from(
    await renderToBuffer(
      React.createElement(DevisFinanceTemplate, { data: pdfData }) as React.ReactElement<React.ComponentProps<typeof Document>>,
    ),
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${d.numero}.pdf"`,
    },
  })
}
```

- [ ] **Step 3 : Implémenter POST /api/devis/[id]/envoyer**

Créer `src/app/api/devis/[id]/envoyer/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { DevisFinanceTemplate } from '@/lib/pdf/devis-finance-template'
import { Resend } from 'resend'
import React from 'react'
import type { DevisPdfData } from '@/lib/pdf/finance-pdf-data'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const [devisRes, settingsRes] = await Promise.all([
    supabase
      .from('devis')
      .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret)')
      .eq('id', id)
      .single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_siret']),
  ])

  if (devisRes.error || !devisRes.data) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  }

  const d = devisRes.data
  if (!['brouillon', 'envoyé'].includes(d.statut as string)) {
    return NextResponse.json({ error: 'Ce devis ne peut plus être envoyé' }, { status: 409 })
  }

  const toEmail = process.env.NOTIF_EMAIL
  if (!toEmail) return NextResponse.json({ error: 'NOTIF_EMAIL manquant' }, { status: 500 })

  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const client = d.client as { nom: string; adresse: string | null; siret: string | null }
  const lignes = (d.lignes as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>).sort((a, b) => a.ordre - b.ordre)

  const pdfData: DevisPdfData = {
    numero: d.numero,
    date_emission: d.date_emission,
    date_validite: d.date_validite,
    client: { nom: client.nom, adresse: client.adresse, siret: client.siret },
    lignes,
    montant_ht: d.montant_ht,
    montant_tva: d.montant_tva,
    montant_ttc: d.montant_ttc,
    notes: d.notes,
    entreprise: {
      nom: settings['entreprise_nom'] ?? 'ATEXIA',
      adresse: settings['entreprise_adresse'] || undefined,
      telephone: settings['entreprise_telephone'] || undefined,
      email: settings['entreprise_email'] || undefined,
      siret: settings['entreprise_siret'] || undefined,
    },
  }

  const buffer = Buffer.from(
    await renderToBuffer(
      React.createElement(DevisFinanceTemplate, { data: pdfData }) as React.ReactElement<React.ComponentProps<typeof Document>>,
    ),
  )

  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA CRM <notifications@atexia.re>',
    to: toEmail,
    subject: `Devis ${d.numero} — ${client.nom}`,
    html: `<p>Veuillez trouver en pièce jointe le devis <strong>${d.numero}</strong>.<br>Montant TTC : <strong>${Number(d.montant_ttc).toFixed(2)} €</strong><br>Valable jusqu'au ${d.date_validite}.</p>`,
    attachments: [{ filename: `devis-${d.numero}.pdf`, content: buffer }],
  })

  if (emailError) return NextResponse.json({ error: `Erreur email : ${emailError.message}` }, { status: 500 })

  const { data, error: updateError } = await supabase
    .from('devis')
    .update({ statut: 'envoyé', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 4 : Implémenter POST /api/devis/[id]/convertir**

Créer `src/app/api/devis/[id]/convertir/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ConvertirSchema } from '@/lib/validations/finance'
import { nextNumero, facturePrefix } from '@/lib/utils/numero'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = ConvertirSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*)')
    .eq('id', id)
    .single()

  if (devisError || !devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (devis.statut !== 'accepté') {
    return NextResponse.json({ error: 'Le devis doit être accepté pour créer une facture' }, { status: 409 })
  }

  const year = new Date().getFullYear()
  const prefix = facturePrefix(year)

  const { data: lastFacture } = await supabase
    .from('factures')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const facturesToCreate: Array<{
    type: 'facture' | 'acompte' | 'solde'
    numero: string
    montant_ht: number
    montant_tva: number
    montant_ttc: number
    pourcentage_acompte: number | null
  }> = []

  if (parsed.data.mode === 'unique') {
    const numero = nextNumero(prefix, lastFacture?.numero ?? null)
    facturesToCreate.push({
      type: 'facture',
      numero,
      montant_ht: Number(devis.montant_ht),
      montant_tva: Number(devis.montant_tva),
      montant_ttc: Number(devis.montant_ttc),
      pourcentage_acompte: null,
    })
  } else {
    const pct = parsed.data.pourcentage_acompte
    const round2 = (n: number) => Math.round(n * 100) / 100
    const aHt = round2(Number(devis.montant_ht) * pct / 100)
    const aTva = round2(Number(devis.montant_tva) * pct / 100)
    const aTtc = round2(aHt + aTva)
    const sHt = round2(Number(devis.montant_ht) - aHt)
    const sTva = round2(Number(devis.montant_tva) - aTva)
    const sTtc = round2(sHt + sTva)

    const num1 = nextNumero(prefix, lastFacture?.numero ?? null)
    const num2 = nextNumero(prefix, num1)

    facturesToCreate.push(
      { type: 'acompte', numero: num1, montant_ht: aHt, montant_tva: aTva, montant_ttc: aTtc, pourcentage_acompte: pct },
      { type: 'solde', numero: num2, montant_ht: sHt, montant_tva: sTva, montant_ttc: sTtc, pourcentage_acompte: null },
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const echeance = new Date()
  echeance.setDate(echeance.getDate() + 30)
  const dateEcheance = echeance.toISOString().slice(0, 10)

  const lignesSource = devis.lignes as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>

  const createdFactures = []
  for (const f of facturesToCreate) {
    const { data: facture, error: fErr } = await supabase
      .from('factures')
      .insert({
        numero: f.numero,
        devis_id: id,
        client_id: devis.client_id,
        projet_id: devis.projet_id,
        type: f.type,
        date_emission: today,
        date_echeance: dateEcheance,
        montant_ht: f.montant_ht,
        montant_tva: f.montant_tva,
        montant_ttc: f.montant_ttc,
        pourcentage_acompte: f.pourcentage_acompte,
      })
      .select()
      .single()

    if (fErr || !facture) return NextResponse.json({ error: fErr?.message ?? 'Erreur création facture' }, { status: 500 })

    await supabase.from('factures_lignes').insert(
      lignesSource.map((l) => ({
        facture_id: facture.id,
        libelle: l.libelle,
        quantite: l.quantite,
        unite: l.unite,
        prix_unitaire: l.prix_unitaire,
        taux_tva: l.taux_tva,
        total_ht: l.total_ht,
        ordre: l.ordre,
      })),
    )

    createdFactures.push(facture)
  }

  return NextResponse.json({ factures: createdFactures }, { status: 201 })
}
```

- [ ] **Step 5 : Vérifier TypeScript**

```
npx tsc --noEmit
```
Attendu : 0 erreurs

- [ ] **Step 6 : Commit**

```
git add src/app/api/devis/[id]/envoyer/ src/app/api/devis/[id]/statut/ src/app/api/devis/[id]/convertir/ src/app/api/devis/[id]/pdf/
git commit -m "feat(finance): API devis actions — envoyer, statut, convertir, pdf"
```

---

## Task 5 : API Factures CRUD + actions

**Files:**
- Create: `src/app/api/factures/route.ts`
- Create: `src/app/api/factures/[id]/route.ts`
- Create: `src/app/api/factures/[id]/envoyer/route.ts`
- Create: `src/app/api/factures/[id]/pdf/route.ts`

---

- [ ] **Step 1 : Implémenter GET /POST /api/factures**

Créer `src/app/api/factures/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FactureCreateSchema, FactureListQuerySchema } from '@/lib/validations/finance'
import { computeTotaux, computeTotalHtLigne } from '@/lib/utils/finance-totaux'
import { nextNumero, facturePrefix } from '@/lib/utils/numero'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = FactureListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { client_id, projet_id, statut, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('factures')
    .select('*, client:clients(id, nom)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (client_id) query = query.eq('client_id', client_id)
  if (projet_id) query = query.eq('projet_id', projet_id)
  if (statut) query = query.eq('statut', statut)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ factures: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = FactureCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const year = new Date().getFullYear()
  const prefix = facturePrefix(year)

  const { data: lastFacture } = await supabase
    .from('factures')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = nextNumero(prefix, lastFacture?.numero ?? null)
  const { lignes: lignesInput, ...factureData } = parsed.data
  const totaux = computeTotaux(lignesInput)

  const { data: facture, error: factureError } = await supabase
    .from('factures')
    .insert({ ...factureData, numero, ...totaux })
    .select()
    .single()

  if (factureError) return NextResponse.json({ error: factureError.message }, { status: 500 })

  if (lignesInput.length > 0) {
    const lignesRows = lignesInput.map((l, i) => ({
      facture_id: facture.id,
      libelle: l.libelle,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      total_ht: computeTotalHtLigne(l.quantite, l.prix_unitaire),
      ordre: l.ordre ?? i,
    }))
    const { error: lignesError } = await supabase.from('factures_lignes').insert(lignesRows)
    if (lignesError) return NextResponse.json({ error: lignesError.message }, { status: 500 })
  }

  return NextResponse.json(facture, { status: 201 })
}
```

- [ ] **Step 2 : Implémenter GET /PUT /api/factures/[id]**

Créer `src/app/api/factures/[id]/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FactureUpdateSchema } from '@/lib/validations/finance'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('factures')
    .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre), devis:devis(numero)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = FactureUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: existing } = await supabase
    .from('factures')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  if (existing.statut === 'payée') {
    return NextResponse.json({ error: 'Facture déjà payée' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('factures')
    .update({
      statut: 'payée',
      date_paiement: parsed.data.date_paiement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3 : Implémenter GET /api/factures/[id]/pdf**

Créer `src/app/api/factures/[id]/pdf/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { FactureTemplate } from '@/lib/pdf/facture-template'
import React from 'react'
import type { FacturePdfData } from '@/lib/pdf/finance-pdf-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const [factureRes, settingsRes] = await Promise.all([
    supabase
      .from('factures')
      .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), devis:devis(numero)')
      .eq('id', id)
      .single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_siret', 'rib_iban', 'rib_bic', 'rib_banque']),
  ])

  if (factureRes.error || !factureRes.data) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  const f = factureRes.data
  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const client = f.client as { nom: string; adresse: string | null; siret: string | null }
  const devis = f.devis as { numero: string } | null
  const lignes = (f.lignes as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>).sort((a, b) => a.ordre - b.ordre)

  const pdfData: FacturePdfData = {
    numero: f.numero,
    type: f.type as 'facture' | 'acompte' | 'solde',
    date_emission: f.date_emission,
    date_echeance: f.date_echeance,
    devis_numero: devis?.numero ?? null,
    client: { nom: client.nom, adresse: client.adresse, siret: client.siret },
    lignes,
    montant_ht: f.montant_ht,
    montant_tva: f.montant_tva,
    montant_ttc: f.montant_ttc,
    pourcentage_acompte: f.pourcentage_acompte,
    notes: f.notes,
    entreprise: {
      nom: settings['entreprise_nom'] ?? 'ATEXIA',
      adresse: settings['entreprise_adresse'] || undefined,
      telephone: settings['entreprise_telephone'] || undefined,
      email: settings['entreprise_email'] || undefined,
      siret: settings['entreprise_siret'] || undefined,
      rib_iban: settings['rib_iban'] || undefined,
      rib_bic: settings['rib_bic'] || undefined,
      rib_banque: settings['rib_banque'] || undefined,
    },
  }

  const buffer = Buffer.from(
    await renderToBuffer(
      React.createElement(FactureTemplate, { data: pdfData }) as React.ReactElement<React.ComponentProps<typeof Document>>,
    ),
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${f.numero}.pdf"`,
    },
  })
}
```

- [ ] **Step 4 : Implémenter POST /api/factures/[id]/envoyer**

Créer `src/app/api/factures/[id]/envoyer/route.ts` :
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { FactureTemplate } from '@/lib/pdf/facture-template'
import { Resend } from 'resend'
import React from 'react'
import type { FacturePdfData } from '@/lib/pdf/finance-pdf-data'

const resend = new Resend(process.env.RESEND_API_KEY)

const TYPE_LABEL = { facture: 'Facture', acompte: "Facture d'acompte", solde: 'Facture de solde' } as const

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const [factureRes, settingsRes] = await Promise.all([
    supabase
      .from('factures')
      .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), devis:devis(numero)')
      .eq('id', id)
      .single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_siret', 'rib_iban', 'rib_bic', 'rib_banque']),
  ])

  if (factureRes.error || !factureRes.data) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  const toEmail = process.env.NOTIF_EMAIL
  if (!toEmail) return NextResponse.json({ error: 'NOTIF_EMAIL manquant' }, { status: 500 })

  const f = factureRes.data
  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const client = f.client as { nom: string; adresse: string | null; siret: string | null }
  const devis = f.devis as { numero: string } | null
  const lignes = (f.lignes as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>).sort((a, b) => a.ordre - b.ordre)

  const pdfData: FacturePdfData = {
    numero: f.numero,
    type: f.type as 'facture' | 'acompte' | 'solde',
    date_emission: f.date_emission,
    date_echeance: f.date_echeance,
    devis_numero: devis?.numero ?? null,
    client: { nom: client.nom, adresse: client.adresse, siret: client.siret },
    lignes,
    montant_ht: f.montant_ht,
    montant_tva: f.montant_tva,
    montant_ttc: f.montant_ttc,
    pourcentage_acompte: f.pourcentage_acompte,
    notes: f.notes,
    entreprise: {
      nom: settings['entreprise_nom'] ?? 'ATEXIA',
      adresse: settings['entreprise_adresse'] || undefined,
      telephone: settings['entreprise_telephone'] || undefined,
      email: settings['entreprise_email'] || undefined,
      siret: settings['entreprise_siret'] || undefined,
      rib_iban: settings['rib_iban'] || undefined,
      rib_bic: settings['rib_bic'] || undefined,
      rib_banque: settings['rib_banque'] || undefined,
    },
  }

  const buffer = Buffer.from(
    await renderToBuffer(
      React.createElement(FactureTemplate, { data: pdfData }) as React.ReactElement<React.ComponentProps<typeof Document>>,
    ),
  )

  const label = TYPE_LABEL[f.type as keyof typeof TYPE_LABEL] ?? 'Facture'
  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA CRM <notifications@atexia.re>',
    to: toEmail,
    subject: `${label} ${f.numero} — ${client.nom}`,
    html: `<p>Veuillez trouver en pièce jointe la ${label.toLowerCase()} <strong>${f.numero}</strong>.<br>Montant TTC : <strong>${Number(f.montant_ttc).toFixed(2)} €</strong><br>Échéance : ${f.date_echeance}.</p>`,
    attachments: [{ filename: `facture-${f.numero}.pdf`, content: buffer }],
  })

  if (emailError) return NextResponse.json({ error: `Erreur email : ${emailError.message}` }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5 : Vérifier TypeScript**

```
npx tsc --noEmit
```
Attendu : quelques erreurs sur les imports `@/lib/pdf/devis-finance-template` et `@/lib/pdf/facture-template` — normal, ces fichiers sont créés en Task 6. Vérifier qu'il n'y a pas d'autres erreurs.

- [ ] **Step 6 : Commit**

```
git add src/app/api/factures/
git commit -m "feat(finance): API factures CRUD + envoyer + pdf"
```

---

## Task 6 : PDF — correction TVA + templates finance

**Files:**
- Modify: `src/lib/pdf/pdf-data.ts` (fix TVA 20% → 8,5%)
- Modify: `src/lib/pdf/__tests__/pdf-data.test.ts` (corriger assertion)
- Modify: `src/lib/pdf/devis-template.tsx` (corriger label)
- Create: `src/lib/pdf/finance-pdf-data.ts`
- Create: `src/lib/pdf/__tests__/finance-pdf-data.test.ts`
- Create: `src/lib/pdf/devis-finance-template.tsx`
- Create: `src/lib/pdf/facture-template.tsx`

---

- [ ] **Step 1 : Corriger pdf-data.ts (TVA 20% → 8,5%)**

Dans `src/lib/pdf/pdf-data.ts`, remplacer la ligne :
```typescript
  const tva = round2(totalHT * 0.2)
```
par :
```typescript
  const tva = round2(totalHT * 0.085)
```

- [ ] **Step 2 : Corriger le test pdf-data.test.ts**

Dans `src/lib/pdf/__tests__/pdf-data.test.ts`, remplacer le test :
```typescript
  it('calcule les données avec calcul TVA 20%', () => {
    const lignes = [{ description: 'Câblage réseau', quantite: 10, prixUnitaire: 80 }]
    const data = buildDevisData({ client: CLIENT, projet: PROJET, lignes })
    expect(data.totalHT).toBe(800)
    expect(data.tva).toBe(160)
    expect(data.totalTTC).toBe(960)
  })
```
par :
```typescript
  it('calcule les données avec TVA 8,5% (DOM)', () => {
    const lignes = [{ description: 'Câblage réseau', quantite: 10, prixUnitaire: 80 }]
    const data = buildDevisData({ client: CLIENT, projet: PROJET, lignes })
    expect(data.totalHT).toBe(800)
    expect(data.tva).toBe(68)
    expect(data.totalTTC).toBe(868)
  })
```

- [ ] **Step 3 : Corriger devis-template.tsx (label TVA)**

Dans `src/lib/pdf/devis-template.tsx`, remplacer :
```typescript
          <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA 20%</Text><Text>{eur(data.tva)}</Text></View>
```
par :
```typescript
          <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA 8,5% (DOM)</Text><Text>{eur(data.tva)}</Text></View>
```

- [ ] **Step 4 : Vérifier que le test corrigé passe**

```
npx jest --testPathPattern="pdf-data" --no-coverage
```
Attendu : PASS, 2 tests

- [ ] **Step 5 : Créer finance-pdf-data.ts + test**

Créer `src/lib/pdf/finance-pdf-data.ts` :
```typescript
export interface EntrepriseInfo {
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  siret?: string
  rib_iban?: string
  rib_bic?: string
  rib_banque?: string
}

export interface ClientInfo {
  nom: string
  adresse?: string | null
  siret?: string | null
}

export interface LignePdf {
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  total_ht: number
  ordre: number
}

export interface DevisPdfData {
  numero: string
  date_emission: string
  date_validite: string
  client: ClientInfo
  lignes: LignePdf[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  notes?: string | null
  entreprise: EntrepriseInfo
}

export interface FacturePdfData {
  numero: string
  type: 'facture' | 'acompte' | 'solde'
  date_emission: string
  date_echeance: string
  devis_numero?: string | null
  client: ClientInfo
  lignes: LignePdf[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  pourcentage_acompte?: number | null
  notes?: string | null
  entreprise: EntrepriseInfo
}
```

Créer `src/lib/pdf/__tests__/finance-pdf-data.test.ts` :
```typescript
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
```

- [ ] **Step 6 : Vérifier le test finance-pdf-data**

```
npx jest --testPathPattern="finance-pdf-data" --no-coverage
```
Attendu : PASS, 3 tests

- [ ] **Step 7 : Créer devis-finance-template.tsx**

Créer `src/lib/pdf/devis-finance-template.tsx` :
```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DevisPdfData } from './finance-pdf-data'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0284c7' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  metaRight: { alignItems: 'flex-end' },
  metaText: { fontSize: 9, color: '#64748b', marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0284c7', borderBottom: '1pt solid #e2e8f0', paddingBottom: 4, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 120, color: '#64748b' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0284c7', padding: 6, borderRadius: 2, marginBottom: 2 },
  tableHeaderText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottom: '0.5pt solid #e2e8f0' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'right' },
  colPU: { flex: 1, textAlign: 'right' },
  colTVA: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { color: '#64748b' },
  totalTTCText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#0284c7' },
  notes: { marginTop: 16, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 },
  notesText: { fontSize: 9, color: '#64748b' },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 6 },
})

function eur(n: number): string { return `${n.toFixed(2)} €` }

export function DevisFinanceTemplate({ data }: { data: DevisPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>DEVIS</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>N° {data.numero}</Text>
            <Text style={styles.metaText}>Émis le {data.date_emission}</Text>
            <Text style={styles.metaText}>Valable jusqu'au {data.date_validite}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <View style={styles.row}><Text style={styles.label}>Client</Text><Text>{data.client.nom}</Text></View>
          {data.client.adresse ? <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text>{data.client.adresse}</Text></View> : null}
          {data.client.siret ? <View style={styles.row}><Text style={styles.label}>SIRET</Text><Text>{data.client.siret}</Text></View> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Désignation des prestations</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTVA]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {data.lignes.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{l.libelle}</Text>
              <Text style={styles.colQty}>{l.quantite}</Text>
              <Text style={styles.colUnit}>{l.unite}</Text>
              <Text style={styles.colPU}>{eur(l.prix_unitaire)}</Text>
              <Text style={styles.colTVA}>{l.taux_tva}%</Text>
              <Text style={styles.colTotal}>{eur(l.total_ht)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total HT</Text><Text>{eur(data.montant_ht)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA 8,5% (DOM)</Text><Text>{eur(data.montant_tva)}</Text></View>
          <View style={styles.totalRow}>
            <Text style={styles.totalTTCText}>Total TTC</Text>
            <Text style={styles.totalTTCText}>{eur(data.montant_ttc)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {data.entreprise.nom}{data.entreprise.adresse ? ` — ${data.entreprise.adresse}` : ''}{data.entreprise.siret ? ` — SIRET ${data.entreprise.siret}` : ''}{data.entreprise.telephone ? ` — ${data.entreprise.telephone}` : ''}
          {'\n'}Devis valable 30 jours. Conditions de paiement selon accord contractuel.
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 8 : Créer facture-template.tsx**

Créer `src/lib/pdf/facture-template.tsx` :
```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { FacturePdfData } from './finance-pdf-data'

const TYPE_LABEL = {
  facture: 'FACTURE',
  acompte: "FACTURE D'ACOMPTE",
  solde: 'FACTURE DE SOLDE',
} as const

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0284c7' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  metaRight: { alignItems: 'flex-end' },
  metaText: { fontSize: 9, color: '#64748b', marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0284c7', borderBottom: '1pt solid #e2e8f0', paddingBottom: 4, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 140, color: '#64748b' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0284c7', padding: 6, borderRadius: 2, marginBottom: 2 },
  tableHeaderText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottom: '0.5pt solid #e2e8f0' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'right' },
  colPU: { flex: 1, textAlign: 'right' },
  colTVA: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { color: '#64748b' },
  totalTTCText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#0284c7' },
  ribBox: { marginTop: 16, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 4 },
  ribTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0284c7', marginBottom: 6 },
  ribRow: { flexDirection: 'row', marginBottom: 2 },
  ribLabel: { width: 60, fontSize: 9, color: '#64748b' },
  ribValue: { fontSize: 9, color: '#1e293b' },
  legalText: { marginTop: 10, fontSize: 8, color: '#94a3b8' },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 6 },
})

function eur(n: number): string { return `${n.toFixed(2)} €` }

export function FactureTemplate({ data }: { data: FacturePdfData }) {
  const typeLabel = TYPE_LABEL[data.type]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>{typeLabel}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>N° {data.numero}</Text>
            <Text style={styles.metaText}>Émis le {data.date_emission}</Text>
            <Text style={styles.metaText}>Échéance : {data.date_echeance}</Text>
            {data.devis_numero ? <Text style={styles.metaText}>Réf. devis : {data.devis_numero}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <View style={styles.row}><Text style={styles.label}>Client</Text><Text>{data.client.nom}</Text></View>
          {data.client.adresse ? <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text>{data.client.adresse}</Text></View> : null}
          {data.client.siret ? <View style={styles.row}><Text style={styles.label}>SIRET</Text><Text>{data.client.siret}</Text></View> : null}
          {data.pourcentage_acompte != null ? (
            <View style={styles.row}><Text style={styles.label}>Acompte</Text><Text>{data.pourcentage_acompte}% du montant total</Text></View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Désignation des prestations</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTVA]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {data.lignes.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{l.libelle}</Text>
              <Text style={styles.colQty}>{l.quantite}</Text>
              <Text style={styles.colUnit}>{l.unite}</Text>
              <Text style={styles.colPU}>{eur(l.prix_unitaire)}</Text>
              <Text style={styles.colTVA}>{l.taux_tva}%</Text>
              <Text style={styles.colTotal}>{eur(l.total_ht)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total HT</Text><Text>{eur(data.montant_ht)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA 8,5% (DOM)</Text><Text>{eur(data.montant_tva)}</Text></View>
          <View style={styles.totalRow}>
            <Text style={styles.totalTTCText}>Total TTC</Text>
            <Text style={styles.totalTTCText}>{eur(data.montant_ttc)}</Text>
          </View>
        </View>

        {(data.entreprise.rib_iban ?? data.entreprise.rib_bic ?? data.entreprise.rib_banque) ? (
          <View style={styles.ribBox}>
            <Text style={styles.ribTitle}>Coordonnées bancaires</Text>
            {data.entreprise.rib_banque ? <View style={styles.ribRow}><Text style={styles.ribLabel}>Banque</Text><Text style={styles.ribValue}>{data.entreprise.rib_banque}</Text></View> : null}
            {data.entreprise.rib_iban ? <View style={styles.ribRow}><Text style={styles.ribLabel}>IBAN</Text><Text style={styles.ribValue}>{data.entreprise.rib_iban}</Text></View> : null}
            {data.entreprise.rib_bic ? <View style={styles.ribRow}><Text style={styles.ribLabel}>BIC</Text><Text style={styles.ribValue}>{data.entreprise.rib_bic}</Text></View> : null}
          </View>
        ) : null}

        <Text style={styles.legalText}>TVA 8,5% — Taux DOM (Article 296 du CGI). Tout retard de paiement entraîne des pénalités.</Text>

        <Text style={styles.footer}>
          {data.entreprise.nom}{data.entreprise.adresse ? ` — ${data.entreprise.adresse}` : ''}{data.entreprise.siret ? ` — SIRET ${data.entreprise.siret}` : ''}
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 9 : Vérifier TypeScript**

```
npx tsc --noEmit
```
Attendu : 0 erreurs TypeScript

- [ ] **Step 10 : Lancer tous les tests**

```
npx jest --no-coverage
```
Attendu : 100+ tests PASS (toutes les suites existantes + nouvelles)

- [ ] **Step 11 : Commit**

```
git add src/lib/pdf/ src/lib/validations/__tests__/
git commit -m "feat(finance): templates PDF devis + facture, correction TVA 8,5% DOM"
```

---

## Task 7 : Email relances + Extension cron

**Files:**
- Create: `src/lib/email/relance-facture-template.ts`
- Create: `src/lib/email/__tests__/relance-facture-template.test.ts`
- Modify: `src/app/api/cron/rappels/route.ts`

---

- [ ] **Step 1 : Écrire le test du template email relance**

Créer `src/lib/email/__tests__/relance-facture-template.test.ts` :
```typescript
import { relanceFactureEmailHtml } from '../relance-facture-template'

describe('relanceFactureEmailHtml', () => {
  it('inclut le numéro de facture', () => {
    const html = relanceFactureEmailHtml({
      numeroFacture: 'FACT-2026-001',
      montantTtc: 1085,
      dateEcheance: '2026-06-15',
      clientNom: 'Carrefour Grand Nord',
      joursRetard: 7,
    })
    expect(html).toContain('FACT-2026-001')
  })

  it('inclut le montant formaté', () => {
    const html = relanceFactureEmailHtml({
      numeroFacture: 'FACT-2026-001',
      montantTtc: 1085,
      dateEcheance: '2026-06-15',
      clientNom: 'Carrefour',
      joursRetard: 7,
    })
    expect(html).toContain('1085')
  })

  it('mentionne relance ferme à J+30', () => {
    const html = relanceFactureEmailHtml({
      numeroFacture: 'FACT-2026-001',
      montantTtc: 500,
      dateEcheance: '2026-05-15',
      clientNom: 'Client Test',
      joursRetard: 30,
    })
    expect(html.toLowerCase()).toContain('relance')
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest --testPathPattern="relance-facture" --no-coverage
```
Attendu : FAIL avec "Cannot find module"

- [ ] **Step 3 : Implémenter le template email relance**

Créer `src/lib/email/relance-facture-template.ts` :
```typescript
interface RelanceFactureProps {
  numeroFacture: string
  montantTtc: number
  dateEcheance: string
  clientNom: string
  joursRetard: number
}

export function relanceFactureEmailHtml({
  numeroFacture,
  montantTtc,
  dateEcheance,
  clientNom,
  joursRetard,
}: RelanceFactureProps): string {
  const isFerme = joursRetard >= 30
  const sujet = isFerme ? 'Relance ferme — Facture impayée' : 'Relance — Facture en attente de règlement'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atexia-crm.vercel.app'
  const color = isFerme ? '#ef4444' : '#f59e0b'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:16px;padding:28px;color:#e2e8f0;">
    <div style="margin-bottom:20px;">
      <span style="background:${color};color:white;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;">ATEXIA CRM — ${sujet}</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#f1f5f9;">Facture ${escapeHtml(numeroFacture)}</h1>
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#f1f5f9;">${escapeHtml(clientNom)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">💰 Montant TTC : <strong style="color:#f1f5f9;">${montantTtc.toFixed(2)} €</strong></p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">📅 Échéance : ${escapeHtml(dateEcheance)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:${color};">⚠️ Retard : ${joursRetard} jours</p>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #334155;">
      <a href="${escapeHtml(appUrl)}/finances" style="display:inline-block;background:#0ea5e9;color:white;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Voir les finances →</a>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

- [ ] **Step 4 : Vérifier que le test passe**

```
npx jest --testPathPattern="relance-facture" --no-coverage
```
Attendu : PASS, 3 tests

- [ ] **Step 5 : Étendre le cron /api/cron/rappels**

Modifier `src/app/api/cron/rappels/route.ts`. Ajouter les imports suivants après les imports existants :
```typescript
import { relanceFactureEmailHtml } from '@/lib/email/relance-facture-template'
```

Dans la fonction `GET`, après la ligne `const supabase = createServiceClient()`, ajouter la logique de mise à jour des statuts financiers et des relances. Voici le code à insérer juste avant `return NextResponse.json({...})` en fin de fonction :

```typescript
  // ─── Finance : mise à jour des statuts et relances ───────────────────────

  const todayStr = today.toISOString().slice(0, 10)

  // 1. Passer en_retard les factures émises dont l'échéance est dépassée
  await supabase
    .from('factures')
    .update({ statut: 'en_retard', updated_at: new Date().toISOString() })
    .eq('statut', 'émise')
    .lt('date_echeance', todayStr)

  // 2. Passer expiré les devis envoyés dont la date_validite est dépassée
  await supabase
    .from('devis')
    .update({ statut: 'expiré', updated_at: new Date().toISOString() })
    .eq('statut', 'envoyé')
    .lt('date_validite', todayStr)

  // 3. Relances factures en retard (J+7 et J+30)
  const j7 = new Date(today)
  j7.setDate(j7.getDate() - 7)
  const j30 = new Date(today)
  j30.setDate(j30.getDate() - 30)

  const j7Str = j7.toISOString().slice(0, 10)
  const j30Str = j30.toISOString().slice(0, 10)

  const { data: facturesRelance } = await supabase
    .from('factures')
    .select('*, client:clients(nom)')
    .eq('statut', 'en_retard')
    .in('date_echeance', [j7Str, j30Str])

  let relancesSent = 0

  for (const facture of facturesRelance ?? []) {
    if (!toEmail) continue
    const joursRetard = facture.date_echeance === j7Str ? 7 : 30
    const clientNom = (facture.client as { nom: string } | null)?.nom ?? 'Client'
    const { error: relanceError } = await resend.emails.send({
      from: 'ATEXIA CRM <notifications@atexia.re>',
      to: toEmail,
      subject: `${joursRetard === 30 ? '🚨 Relance ferme' : '⚠️ Relance'} — Facture ${facture.numero}`,
      html: relanceFactureEmailHtml({
        numeroFacture: facture.numero,
        montantTtc: Number(facture.montant_ttc),
        dateEcheance: facture.date_echeance,
        clientNom,
        joursRetard,
      }),
    })
    if (!relanceError) relancesSent++
  }
```

Et dans l'objet `return NextResponse.json({...})`, ajouter `relancesSent` :
```typescript
  return NextResponse.json({
    processed: (taches ?? []).length,
    emailSent,
    pushSent,
    expiredCleaned: expiredEndpoints.length,
    relancesSent,
  })
```

- [ ] **Step 6 : Vérifier TypeScript**

```
npx tsc --noEmit
```
Attendu : 0 erreurs

- [ ] **Step 7 : Commit**

```
git add src/lib/email/relance-facture-template.ts src/lib/email/__tests__/relance-facture-template.test.ts src/app/api/cron/rappels/route.ts
git commit -m "feat(finance): email relance factures + extension cron J+7/J+30"
```

---

## Task 8 : Composants display — cards + KPIs

**Files:**
- Create: `src/components/finances/finances-kpis.tsx`
- Create: `src/components/finances/__tests__/finances-kpis.test.tsx`
- Create: `src/components/finances/devis-card.tsx`
- Create: `src/components/finances/__tests__/devis-card.test.tsx`
- Create: `src/components/finances/facture-card.tsx`
- Create: `src/components/finances/__tests__/facture-card.test.tsx`

---

- [ ] **Step 1 : Écrire les tests des composants display**

Créer `src/components/finances/__tests__/finances-kpis.test.tsx` :
```typescript
import { render, screen } from '@testing-library/react'
import { FinancesKpis } from '../finances-kpis'

const kpis = {
  devis_en_cours_montant: 15000,
  ca_facture_annee: 42000,
  montant_impaye: 3200,
  factures_en_retard: 2,
}

describe('FinancesKpis', () => {
  it('affiche le CA facturé', () => {
    render(<FinancesKpis kpis={kpis} />)
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })

  it('affiche le nombre de factures en retard', () => {
    render(<FinancesKpis kpis={kpis} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
```

Créer `src/components/finances/__tests__/devis-card.test.tsx` :
```typescript
import { render, screen } from '@testing-library/react'
import { DevisCard } from '../devis-card'
import type { Devis } from '@/lib/supabase/finance-types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/finances',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockDevis: Devis = {
  id: 'dev-1',
  numero: 'DEV-2026-001',
  client_id: 'cli-1',
  projet_id: null,
  statut: 'envoyé',
  date_emission: '2026-06-01',
  date_validite: '2026-07-01',
  montant_ht: 1000,
  montant_tva: 85,
  montant_ttc: 1085,
  notes: null,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

describe('DevisCard', () => {
  it('affiche le numéro de devis', () => {
    render(<DevisCard devis={mockDevis} clientNom="Carrefour" />)
    expect(screen.getByText('DEV-2026-001')).toBeInTheDocument()
  })

  it('affiche le montant TTC', () => {
    render(<DevisCard devis={mockDevis} clientNom="Carrefour" />)
    expect(screen.getByText(/1\s*085/)).toBeInTheDocument()
  })

  it('affiche le statut envoyé', () => {
    render(<DevisCard devis={mockDevis} clientNom="Carrefour" />)
    expect(screen.getByText(/envoyé/i)).toBeInTheDocument()
  })
})
```

Créer `src/components/finances/__tests__/facture-card.test.tsx` :
```typescript
import { render, screen } from '@testing-library/react'
import { FactureCard } from '../facture-card'
import type { Facture } from '@/lib/supabase/finance-types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/finances',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockFacture: Facture = {
  id: 'fact-1',
  numero: 'FACT-2026-001',
  devis_id: 'dev-1',
  client_id: 'cli-1',
  projet_id: null,
  type: 'facture',
  statut: 'émise',
  date_emission: '2026-06-01',
  date_echeance: '2026-07-01',
  pourcentage_acompte: null,
  montant_ht: 1000,
  montant_tva: 85,
  montant_ttc: 1085,
  date_paiement: null,
  notes: null,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

describe('FactureCard', () => {
  it('affiche le numéro de facture', () => {
    render(<FactureCard facture={mockFacture} clientNom="Leclerc" />)
    expect(screen.getByText('FACT-2026-001')).toBeInTheDocument()
  })

  it('affiche le statut émise', () => {
    render(<FactureCard facture={mockFacture} clientNom="Leclerc" />)
    expect(screen.getByText(/émise/i)).toBeInTheDocument()
  })

  it('affiche le montant TTC', () => {
    render(<FactureCard facture={mockFacture} clientNom="Leclerc" />)
    expect(screen.getByText(/1\s*085/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```
npx jest --testPathPattern="finances-kpis|devis-card|facture-card" --no-coverage
```
Attendu : FAIL avec "Cannot find module"

- [ ] **Step 3 : Implémenter les composants display**

Créer `src/components/finances/finances-kpis.tsx` :
```typescript
import type { FinancesKpisData } from '@/lib/supabase/finance-types'

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface KpiCardProps { label: string; value: string; icon: string; colorClass: string }

function KpiCard({ label, value, icon, colorClass }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-white truncate">{value}</div>
      <div className="text-xs text-slate-300 mt-1">{label}</div>
    </div>
  )
}

export function FinancesKpis({ kpis }: { kpis: FinancesKpisData }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard label="Devis en cours" value={eur(kpis.devis_en_cours_montant)} icon="📋" colorClass="bg-sky-500/20" />
      <KpiCard label="CA facturé (année)" value={eur(kpis.ca_facture_annee)} icon="💰" colorClass="bg-emerald-500/20" />
      <KpiCard label="Impayés" value={eur(kpis.montant_impaye)} icon="⏳" colorClass="bg-amber-500/20" />
      <KpiCard label="En retard" value={String(kpis.factures_en_retard)} icon="🚨" colorClass="bg-red-500/20" />
    </div>
  )
}
```

Créer `src/components/finances/devis-card.tsx` :
```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Devis, StatutDevis } from '@/lib/supabase/finance-types'

const STATUT_VARIANT: Record<StatutDevis, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  brouillon: 'neutral',
  envoyé: 'info',
  accepté: 'success',
  refusé: 'danger',
  expiré: 'neutral',
}

const STATUT_LABEL: Record<StatutDevis, string> = {
  brouillon: 'Brouillon',
  envoyé: 'Envoyé',
  accepté: 'Accepté',
  refusé: 'Refusé',
  expiré: 'Expiré',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface DevisCardProps { devis: Devis; clientNom: string }

export function DevisCard({ devis, clientNom }: DevisCardProps) {
  return (
    <Link
      href={`/finances/devis/${devis.id}`}
      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{devis.numero}</p>
          <p className="text-slate-400 text-sm mt-0.5 truncate">{clientNom}</p>
        </div>
        <Badge label={STATUT_LABEL[devis.statut]} variant={STATUT_VARIANT[devis.statut]} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-white font-bold">{eur(Number(devis.montant_ttc))}</p>
        <p className="text-slate-500 text-xs">Validité : {devis.date_validite}</p>
      </div>
    </Link>
  )
}
```

Créer `src/components/finances/facture-card.tsx` :
```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Facture, StatutFacture, TypeFacture } from '@/lib/supabase/finance-types'

const STATUT_VARIANT: Record<StatutFacture, 'success' | 'info' | 'danger'> = {
  émise: 'info',
  payée: 'success',
  en_retard: 'danger',
}

const STATUT_LABEL: Record<StatutFacture, string> = {
  émise: 'Émise',
  payée: 'Payée',
  en_retard: 'En retard',
}

const TYPE_LABEL: Record<TypeFacture, string> = {
  facture: 'Facture',
  acompte: 'Acompte',
  solde: 'Solde',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface FactureCardProps { facture: Facture; clientNom: string }

export function FactureCard({ facture, clientNom }: FactureCardProps) {
  return (
    <Link
      href={`/finances/factures/${facture.id}`}
      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{facture.numero}</p>
          <p className="text-slate-400 text-sm mt-0.5 truncate">
            {TYPE_LABEL[facture.type]} — {clientNom}
          </p>
        </div>
        <Badge label={STATUT_LABEL[facture.statut]} variant={STATUT_VARIANT[facture.statut]} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-white font-bold">{eur(Number(facture.montant_ttc))}</p>
        <p className="text-slate-500 text-xs">
          {facture.statut === 'payée' ? `Payée le ${facture.date_paiement}` : `Échéance : ${facture.date_echeance}`}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```
npx jest --testPathPattern="finances-kpis|devis-card|facture-card" --no-coverage
```
Attendu : PASS, 8 tests

> Note : si `Badge` n'accepte pas les variants `warning` ou `danger`, adapter `STATUT_VARIANT` en utilisant les variants disponibles dans `src/components/ui/badge.tsx`.

- [ ] **Step 5 : Commit**

```
git add src/components/finances/
git commit -m "feat(finance): composants FinancesKpis, DevisCard, FactureCard"
```

---

## Task 9 : Composants formulaires

**Files:**
- Create: `src/components/finances/devis-ligne-row.tsx`
- Create: `src/components/finances/devis-form.tsx`
- Create: `src/components/finances/__tests__/devis-form.test.tsx`
- Create: `src/components/finances/convertir-modal.tsx`
- Create: `src/components/finances/marquer-payee-button.tsx`
- Create: `src/components/finances/envoyer-devis-button.tsx`
- Create: `src/components/finances/envoyer-facture-button.tsx`

---

- [ ] **Step 1 : Écrire les tests du formulaire devis**

Créer `src/components/finances/__tests__/devis-form.test.tsx` :
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DevisForm } from '../devis-form'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/finances/devis/nouveau',
}))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ id: 'dev-new', numero: 'DEV-2026-001' }),
}) as jest.Mock

const mockClients = [
  { id: 'cli-1', nom: 'Carrefour Grand Nord', statut: 'actif', secteur: 'courants_forts', adresse: null, siret: null, notes: null, created_at: '', updated_at: '' },
]

describe('DevisForm', () => {
  it('affiche le champ client', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument()
  })

  it('affiche le champ date de validité', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByLabelText(/validit/i)).toBeInTheDocument()
  })

  it('affiche le bouton Ajouter une ligne', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument()
  })

  it('affiche le bouton Enregistrer', () => {
    render(<DevisForm clients={mockClients} />)
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```
npx jest --testPathPattern="devis-form" --no-coverage
```
Attendu : FAIL avec "Cannot find module"

- [ ] **Step 3 : Implémenter DevisLigneRow**

Créer `src/components/finances/devis-ligne-row.tsx` :
```typescript
'use client'

import { computeTotalHtLigne } from '@/lib/utils/finance-totaux'
import type { Prestation } from '@/lib/supabase/finance-types'

export interface LigneState {
  prestation_id: string | null
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  ordre: number
}

interface DevisLigneRowProps {
  ligne: LigneState
  index: number
  prestations: Prestation[]
  onChange: (index: number, ligne: LigneState) => void
  onRemove: (index: number) => void
}

const UNITES = ['u', 'h', 'm', 'm²', 'forfait']

export function DevisLigneRow({ ligne, index, prestations, onChange, onRemove }: DevisLigneRowProps) {
  const totalHt = computeTotalHtLigne(ligne.quantite, ligne.prix_unitaire)

  const set = (patch: Partial<LigneState>) => onChange(index, { ...ligne, ...patch })

  const handlePrestationSelect = (prestationId: string) => {
    if (!prestationId) { set({ prestation_id: null }); return }
    const p = prestations.find((pr) => pr.id === prestationId)
    if (p) set({ prestation_id: p.id, libelle: p.libelle, unite: p.unite, prix_unitaire: Number(p.prix_unitaire), taux_tva: Number(p.taux_tva) })
  }

  const inputCls = 'w-full bg-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500'

  return (
    <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">Ligne {index + 1}</span>
        <button type="button" onClick={() => onRemove(index)} className="text-slate-500 hover:text-red-400 text-xs transition-colors">
          Supprimer
        </button>
      </div>

      {prestations.length > 0 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catalogue (optionnel)</label>
          <select
            value={ligne.prestation_id ?? ''}
            onChange={(e) => handlePrestationSelect(e.target.value)}
            className={inputCls}
          >
            <option value="">Saisie libre</option>
            {prestations.map((p) => (
              <option key={p.id} value={p.id}>{p.libelle}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1">Désignation *</label>
        <input
          value={ligne.libelle}
          onChange={(e) => set({ libelle: e.target.value })}
          placeholder="Ex : Installation tableau électrique"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Quantité</label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={ligne.quantite}
            onChange={(e) => set({ quantite: parseFloat(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Unité</label>
          <select value={ligne.unite} onChange={(e) => set({ unite: e.target.value })} className={inputCls}>
            {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">TVA %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={ligne.taux_tva}
            onChange={(e) => set({ taux_tva: parseFloat(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Prix unitaire HT (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={ligne.prix_unitaire}
            onChange={(e) => set({ prix_unitaire: parseFloat(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Total HT</label>
          <p className="text-white text-sm font-semibold py-2">{totalHt.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Implémenter DevisForm**

Créer `src/components/finances/devis-form.tsx` :
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DevisLigneRow, type LigneState } from './devis-ligne-row'
import { computeTotaux } from '@/lib/utils/finance-totaux'
import type { Client } from '@/lib/supabase/types'
import type { Prestation, Devis, DevisLigne } from '@/lib/supabase/finance-types'

interface DevisFormProps {
  clients: Client[]
  prestations?: Prestation[]
  initialDevis?: Devis & { lignes: DevisLigne[] }
}

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function plus30(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

function newLigne(ordre: number): LigneState {
  return { prestation_id: null, libelle: '', quantite: 1, unite: 'u', prix_unitaire: 0, taux_tva: 8.5, ordre }
}

export function DevisForm({ clients, prestations = [], initialDevis }: DevisFormProps) {
  const router = useRouter()
  const isEdit = !!initialDevis

  const [clientId, setClientId] = useState(initialDevis?.client_id ?? '')
  const [dateEmission, setDateEmission] = useState(initialDevis?.date_emission ?? todayStr())
  const [dateValidite, setDateValidite] = useState(initialDevis?.date_validite ?? plus30())
  const [notes, setNotes] = useState(initialDevis?.notes ?? '')
  const [lignes, setLignes] = useState<LigneState[]>(
    initialDevis?.lignes.map((l) => ({
      prestation_id: l.prestation_id,
      libelle: l.libelle,
      quantite: Number(l.quantite),
      unite: l.unite,
      prix_unitaire: Number(l.prix_unitaire),
      taux_tva: Number(l.taux_tva),
      ordre: l.ordre,
    })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totaux = computeTotaux(lignes)

  const addLigne = () => setLignes((prev) => [...prev, newLigne(prev.length)])
  const updateLigne = (i: number, l: LigneState) => setLignes((prev) => prev.map((x, j) => (j === i ? l : x)))
  const removeLigne = (i: number) => setLignes((prev) => prev.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) { setError('Sélectionner un client'); return }
    if (!dateValidite) { setError('Date de validité requise'); return }

    setSaving(true)
    setError(null)

    const payload = {
      client_id: clientId,
      date_emission: dateEmission,
      date_validite: dateValidite,
      notes: notes || null,
      lignes: lignes.map((l, i) => ({ ...l, ordre: i })),
    }

    const url = isEdit ? `/api/devis/${initialDevis!.id}` : '/api/devis'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)

    setSaving(false)

    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }

    const data = await res.json()
    router.push(`/finances/devis/${data.id}`)
    router.refresh()
  }

  const inputCls = 'w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="client" className="block text-sm text-slate-300 mb-1">Client *</label>
        <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
          <option value="">Sélectionner un client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date-emission" className="block text-sm text-slate-300 mb-1">Date d'émission</label>
          <input id="date-emission" type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="date-validite" className="block text-sm text-slate-300 mb-1">Validité jusqu'au *</label>
          <input id="date-validite" type="date" value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-300 text-sm font-semibold">Lignes du devis</h2>
          <button type="button" onClick={addLigne} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
            + Ajouter une ligne
          </button>
        </div>
        {lignes.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">Aucune ligne — cliquer sur &quot;Ajouter une ligne&quot;</p>
        )}
        <div className="space-y-3">
          {lignes.map((l, i) => (
            <DevisLigneRow key={i} ligne={l} index={i} prestations={prestations} onChange={updateLigne} onRemove={removeLigne} />
          ))}
        </div>
      </div>

      {lignes.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{totaux.montant_ht.toFixed(2)} €</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5%</span><span className="text-white">{totaux.montant_tva.toFixed(2)} €</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total TTC</span><span className="text-sky-400">{totaux.montant_ttc.toFixed(2)} €</span></div>
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-300 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Conditions particulières, délais, modalités..." className={inputCls} />
      </div>

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour le devis' : 'Enregistrer le devis'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5 : Vérifier que les tests passent**

```
npx jest --testPathPattern="devis-form" --no-coverage
```
Attendu : PASS, 4 tests

- [ ] **Step 6 : Implémenter les boutons d'action**

Créer `src/components/finances/convertir-modal.tsx` :
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConvertirModalProps {
  devisId: string
}

export function ConvertirModal({ devisId }: ConvertirModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'unique' | 'acompte_solde'>('unique')
  const [pourcentage, setPourcentage] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvertir = async () => {
    setLoading(true)
    setError(null)
    const body = mode === 'unique' ? { mode } : { mode, pourcentage_acompte: pourcentage }
    const res = await fetch(`/api/devis/${devisId}/convertir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }
    setOpen(false)
    router.push('/finances?tab=factures')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
      >
        📄 Créer la facture
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-white font-bold text-lg mb-4">Mode de paiement</h2>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="mode" value="unique" checked={mode === 'unique'} onChange={() => setMode('unique')} className="text-sky-500" />
                <span className="text-white text-sm">Paiement unique (100%)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="mode" value="acompte_solde" checked={mode === 'acompte_solde'} onChange={() => setMode('acompte_solde')} className="text-sky-500" />
                <span className="text-white text-sm">Acompte + Solde</span>
              </label>
            </div>

            {mode === 'acompte_solde' && (
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-1">Pourcentage d'acompte</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={pourcentage}
                    onChange={(e) => setPourcentage(parseInt(e.target.value) || 30)}
                    className="w-24 bg-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-slate-400 text-sm">%</span>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleConvertir}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

Créer `src/components/finances/marquer-payee-button.tsx` :
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarquerPayeeButton({ factureId }: { factureId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMarquer = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/factures/${factureId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_paiement: datePaiement }),
    }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
      >
        ✅ Marquer payée
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-white font-bold text-lg mb-4">Date de paiement</h2>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">Annuler</button>
              <button
                onClick={handleMarquer}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

Créer `src/components/finances/envoyer-devis-button.tsx` :
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EnvoyerDevisButton({ devisId }: { devisId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleEnvoyer = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/devis/${devisId}/envoyer`, { method: 'POST' }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur envoi')
      return
    }
    setSent(true)
    router.refresh()
  }

  if (sent) return <p className="text-emerald-400 text-sm">Email envoyé ✓</p>

  return (
    <div>
      <button
        onClick={handleEnvoyer}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-sky-500/20 text-sky-400 px-4 py-2 rounded-xl hover:bg-sky-500/30 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? '⏳' : '📧'} {loading ? 'Envoi…' : 'Envoyer par email'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1" role="alert">{error}</p>}
    </div>
  )
}
```

Créer `src/components/finances/envoyer-facture-button.tsx` :
```typescript
'use client'

import { useState } from 'react'

export function EnvoyerFactureButton({ factureId }: { factureId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleEnvoyer = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/factures/${factureId}/envoyer`, { method: 'POST' }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur envoi')
      return
    }
    setSent(true)
  }

  if (sent) return <p className="text-emerald-400 text-sm">Facture envoyée ✓</p>

  return (
    <div>
      <button
        onClick={handleEnvoyer}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-sky-500/20 text-sky-400 px-4 py-2 rounded-xl hover:bg-sky-500/30 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? '⏳' : '📧'} {loading ? 'Envoi…' : 'Envoyer par email'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1" role="alert">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 7 : Lancer tous les tests composants finances**

```
npx jest --testPathPattern="src/components/finances" --no-coverage
```
Attendu : PASS, 12+ tests (devis-card, facture-card, finances-kpis, devis-form)

- [ ] **Step 8 : Commit**

```
git add src/components/finances/
git commit -m "feat(finance): composants formulaires devis, boutons action, modal convertir"
```

---

## Task 10 : Pages + intégrations + Catalogue + build final

**Files:**
- Create: `src/app/(app)/finances/page.tsx`
- Create: `src/app/(app)/finances/loading.tsx`
- Create: `src/app/(app)/finances/devis/nouveau/page.tsx`
- Create: `src/app/(app)/finances/devis/[id]/page.tsx`
- Create: `src/app/(app)/finances/factures/[id]/page.tsx`
- Modify: `src/app/(app)/plus/page.tsx`
- Modify: `src/components/projets/projet-tabs.tsx`
- Modify: `src/components/clients/client-tabs.tsx`
- Modify: `src/app/(app)/parametres/page.tsx`
- Modify: `src/components/parametres/parametres-tabs.tsx`
- Create: `src/components/parametres/catalogue-form.tsx`

---

- [ ] **Step 1 : Créer loading.tsx pour /finances**

Créer `src/app/(app)/finances/loading.tsx` :
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function FinancesLoading() {
  return (
    <div className="p-4 pb-24 space-y-6">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer la page /finances**

Créer `src/app/(app)/finances/page.tsx` :
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FinancesKpis } from '@/components/finances/finances-kpis'
import { DevisCard } from '@/components/finances/devis-card'
import { FactureCard } from '@/components/finances/facture-card'
import type { FinancesKpisData, Devis, Facture } from '@/lib/supabase/finance-types'

async function getFinancesData(tab: string) {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const [devisEnCoursRes, caRes, impayeRes, enRetardRes] = await Promise.all([
    supabase.from('devis').select('montant_ttc').eq('statut', 'envoyé'),
    supabase.from('factures').select('montant_ttc').eq('statut', 'payée').gte('date_emission', `${currentYear}-01-01`),
    supabase.from('factures').select('montant_ttc').in('statut', ['émise', 'en_retard']),
    supabase.from('factures').select('id', { count: 'exact', head: true }).eq('statut', 'en_retard'),
  ])

  const kpis: FinancesKpisData = {
    devis_en_cours_montant: (devisEnCoursRes.data ?? []).reduce((s, d) => s + Number(d.montant_ttc), 0),
    ca_facture_annee: (caRes.data ?? []).reduce((s, d) => s + Number(d.montant_ttc), 0),
    montant_impaye: (impayeRes.data ?? []).reduce((s, d) => s + Number(d.montant_ttc), 0),
    factures_en_retard: enRetardRes.count ?? 0,
  }

  if (tab === 'factures') {
    const { data } = await supabase
      .from('factures')
      .select('*, client:clients(id, nom)')
      .order('created_at', { ascending: false })
      .limit(20)
    return { kpis, factures: (data ?? []) as (Facture & { client: { id: string; nom: string } })[], devis: [] }
  }

  const { data } = await supabase
    .from('devis')
    .select('*, client:clients(id, nom)')
    .order('created_at', { ascending: false })
    .limit(20)
  return { kpis, devis: (data ?? []) as (Devis & { client: { id: string; nom: string } })[], factures: [] }
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'factures' ? 'factures' : 'devis'
  const { kpis, devis, factures } = await getFinancesData(tab)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Finances</h1>
        <Link
          href="/finances/devis/nouveau"
          className="text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
        >
          + Devis
        </Link>
      </div>

      <FinancesKpis kpis={kpis} />

      <div className="flex gap-2 mt-6 mb-4">
        <Link
          href="/finances"
          className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
            tab === 'devis' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Devis
        </Link>
        <Link
          href="/finances?tab=factures"
          className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
            tab === 'factures' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Factures
        </Link>
      </div>

      {tab === 'devis' && (
        <div className="space-y-3">
          {devis.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucun devis</p>}
          {devis.map((d) => <DevisCard key={d.id} devis={d} clientNom={(d.client as { nom: string }).nom} />)}
        </div>
      )}

      {tab === 'factures' && (
        <div className="space-y-3">
          {factures.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucune facture</p>}
          {factures.map((f) => <FactureCard key={f.id} facture={f} clientNom={(f.client as { nom: string }).nom} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3 : Créer la page /finances/devis/nouveau**

Créer `src/app/(app)/finances/devis/nouveau/page.tsx` :
```typescript
import { createClient } from '@/lib/supabase/server'
import { DevisForm } from '@/components/finances/devis-form'
import type { Client } from '@/lib/supabase/types'
import type { Prestation } from '@/lib/supabase/finance-types'

export default async function NouveauDevisPage() {
  const supabase = await createClient()

  const [clientsRes, prestationsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('statut', 'actif').order('nom'),
    supabase.from('prestations').select('*').eq('actif', true).order('libelle'),
  ])

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Nouveau devis</h1>
      <DevisForm
        clients={(clientsRes.data ?? []) as Client[]}
        prestations={(prestationsRes.data ?? []) as Prestation[]}
      />
    </div>
  )
}
```

- [ ] **Step 4 : Créer la page /finances/devis/[id]**

Créer `src/app/(app)/finances/devis/[id]/page.tsx` :
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EnvoyerDevisButton } from '@/components/finances/envoyer-devis-button'
import { ConvertirModal } from '@/components/finances/convertir-modal'
import type { DevisAvecLignes } from '@/lib/supabase/finance-types'

const STATUT_LABEL: Record<string, string> = {
  brouillon: 'Brouillon', envoyé: 'Envoyé', accepté: 'Accepté', refusé: 'Refusé', expiré: 'Expiré',
}

const STATUT_COLOR: Record<string, string> = {
  brouillon: 'text-slate-400', envoyé: 'text-sky-400', accepté: 'text-emerald-400',
  refusé: 'text-red-400', expiré: 'text-slate-500',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const devis = data as unknown as DevisAvecLignes
  const lignes = [...devis.lignes].sort((a, b) => a.ordre - b.ordre)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/finances" className="text-slate-400 hover:text-white transition-colors text-sm">← Finances</Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-bold">{devis.numero}</h1>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${STATUT_COLOR[devis.statut] ?? 'text-slate-400'}`}>
            {STATUT_LABEL[devis.statut] ?? devis.statut}
          </span>
          <span className="text-slate-400 text-xs">Émis le {devis.date_emission}</span>
        </div>
        <p className="text-white font-semibold">{devis.client.nom}</p>
        {devis.projet && <p className="text-slate-400 text-sm">{devis.projet.titre}</p>}
        <p className="text-slate-500 text-xs mt-1">Validité : {devis.date_validite}</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Lignes</h2>
        {lignes.length === 0 && <p className="text-slate-500 text-sm">Aucune ligne</p>}
        <div className="space-y-2">
          {lignes.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-2 py-2 border-b border-slate-700 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{l.libelle}</p>
                <p className="text-slate-500 text-xs">{l.quantite} {l.unite} × {eur(Number(l.prix_unitaire))} HT</p>
              </div>
              <p className="text-white text-sm font-medium shrink-0">{eur(Number(l.total_ht))}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{eur(Number(devis.montant_ht))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5%</span><span className="text-white">{eur(Number(devis.montant_tva))}</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total TTC</span><span className="text-sky-400">{eur(Number(devis.montant_ttc))}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/devis/${id}/pdf`}
          className="flex items-center gap-2 text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition-colors font-medium"
        >
          📥 Télécharger PDF
        </a>
        {['brouillon', 'envoyé'].includes(devis.statut) && <EnvoyerDevisButton devisId={id} />}
        {devis.statut === 'brouillon' && (
          <Link href={`/finances/devis/${id}/modifier`} className="flex items-center gap-2 text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition-colors font-medium">
            ✏️ Modifier
          </Link>
        )}
        {devis.statut === 'accepté' && <ConvertirModal devisId={id} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Créer la page /finances/factures/[id]**

Créer `src/app/(app)/finances/factures/[id]/page.tsx` :
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MarquerPayeeButton } from '@/components/finances/marquer-payee-button'
import { EnvoyerFactureButton } from '@/components/finances/envoyer-facture-button'
import type { FactureAvecLignes } from '@/lib/supabase/finance-types'

const STATUT_COLOR: Record<string, string> = {
  émise: 'text-sky-400', payée: 'text-emerald-400', en_retard: 'text-red-400',
}
const TYPE_LABEL: Record<string, string> = {
  facture: 'Facture', acompte: "Facture d'acompte", solde: 'Facture de solde',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('factures')
    .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre), devis:devis(numero)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const facture = data as unknown as FactureAvecLignes & { devis: { numero: string } | null }
  const lignes = [...facture.lignes].sort((a, b) => a.ordre - b.ordre)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/finances?tab=factures" className="text-slate-400 hover:text-white transition-colors text-sm">← Finances</Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-bold">{facture.numero}</h1>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">{TYPE_LABEL[facture.type] ?? 'Facture'}</span>
          <span className={`text-sm font-medium ${STATUT_COLOR[facture.statut] ?? 'text-slate-400'}`}>{facture.statut}</span>
        </div>
        <p className="text-white font-semibold">{facture.client.nom}</p>
        {facture.projet && <p className="text-slate-400 text-sm">{facture.projet.titre}</p>}
        {facture.devis_numero && <p className="text-slate-500 text-xs">Réf. devis : {facture.devis_numero}</p>}
        <div className="flex gap-4 mt-2">
          <p className="text-slate-500 text-xs">Émis le {facture.date_emission}</p>
          <p className="text-slate-500 text-xs">Échéance : {facture.date_echeance}</p>
        </div>
        {facture.date_paiement && <p className="text-emerald-400 text-xs mt-1">Payée le {facture.date_paiement}</p>}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Lignes</h2>
        <div className="space-y-2">
          {lignes.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-2 py-2 border-b border-slate-700 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{l.libelle}</p>
                <p className="text-slate-500 text-xs">{l.quantite} {l.unite} × {eur(Number(l.prix_unitaire))} HT</p>
              </div>
              <p className="text-white text-sm font-medium shrink-0">{eur(Number(l.total_ht))}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{eur(Number(facture.montant_ht))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5%</span><span className="text-white">{eur(Number(facture.montant_tva))}</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total TTC</span><span className="text-sky-400">{eur(Number(facture.montant_ttc))}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`/api/factures/${id}/pdf`} className="flex items-center gap-2 text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition-colors font-medium">
          📥 Télécharger PDF
        </a>
        <EnvoyerFactureButton factureId={id} />
        {facture.statut !== 'payée' && <MarquerPayeeButton factureId={id} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 6 : Ajouter Finances dans /plus**

Dans `src/app/(app)/plus/page.tsx`, remplacer le tableau `MODULES` :
```typescript
const MODULES = [
  { href: '/finances', icon: '💶', label: 'Finances', description: 'Devis et factures' },
  { href: '/echanges', icon: '💬', label: 'Échanges', description: 'Appels, emails, visites' },
  { href: '/documents', icon: '📂', label: 'Documents', description: 'Fichiers et PDF' },
  { href: '/parametres', icon: '⚙️', label: 'Paramètres', description: 'Entreprise et compte' },
]
```

- [ ] **Step 7 : Ajouter onglet Finances dans ProjetTabs**

Dans `src/components/projets/projet-tabs.tsx`, modifier le tableau `TABS` :
```typescript
const TABS = [
  { id: 'taches', label: 'Tâches' },
  { id: 'documents', label: 'Documents' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'finances', label: 'Finances' },
  { id: 'notes', label: 'Notes' },
]
```

Puis, dans le contenu des onglets, ajouter après l'onglet `echanges` :
```typescript
        {activeTab === 'finances' && (
          <div className="text-center py-6">
            <a href={`/finances?tab=devis`} className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Voir les devis et factures liés →
            </a>
          </div>
        )}
```

> Note : l'intégration complète des devis/factures filtrés par projet_id est possible via un composant client qui appelle `GET /api/devis?projet_id=X`. Pour v1, un lien vers `/finances?projet_id=X` suffit.

- [ ] **Step 8 : Ajouter onglet Finances dans ClientTabs**

Dans `src/components/clients/client-tabs.tsx`, modifier le tableau `TABS` en ajoutant l'entrée Finances :
```typescript
const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'documents', label: 'Documents' },
  { id: 'finances', label: 'Finances' },
  { id: 'taches', label: 'Tâches' },
]
```

Puis ajouter le contenu de l'onglet finances après l'onglet documents :
```typescript
        {activeTab === 'finances' && (
          <div className="text-center py-6">
            <a href={`/finances?client_id=${clientId}`} className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Voir les devis et factures de ce client →
            </a>
          </div>
        )}
```

- [ ] **Step 9 : Ajouter onglet Catalogue dans ParametresTabs**

Dans `src/components/parametres/parametres-tabs.tsx`, remplacer le contenu complet :
```typescript
'use client'

import Link from 'next/link'

type ParametresTabId = 'parametres' | 'catalogue' | 'guide'

interface ParametresTabsProps {
  activeTab: ParametresTabId
}

export function ParametresTabs({ activeTab }: ParametresTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Link
        href="/parametres"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'parametres' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Paramètres
      </Link>
      <Link
        href="/parametres?tab=catalogue"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'catalogue' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Catalogue
      </Link>
      <Link
        href="/parametres?tab=guide"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'guide' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Guide
      </Link>
    </div>
  )
}
```

- [ ] **Step 10 : Créer CatalogueForm**

Créer `src/components/parametres/catalogue-form.tsx` :
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Prestation } from '@/lib/supabase/finance-types'

const UNITES = ['u', 'h', 'm', 'm²', 'forfait']

interface CatalogueFormProps {
  prestations: Prestation[]
}

export function CatalogueForm({ prestations }: CatalogueFormProps) {
  const router = useRouter()
  const [libelle, setLibelle] = useState('')
  const [description, setDescription] = useState('')
  const [unite, setUnite] = useState('u')
  const [prixUnitaire, setPrixUnitaire] = useState('')
  const [tauxTva, setTauxTva] = useState('8.5')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const inputCls = 'w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!libelle.trim()) { setError('Libellé requis'); return }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/prestations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libelle: libelle.trim(),
        description: description.trim() || null,
        unite,
        prix_unitaire: parseFloat(prixUnitaire) || 0,
        taux_tva: parseFloat(tauxTva) || 8.5,
      }),
    }).catch(() => null)
    setSaving(false)
    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Erreur serveur')
      return
    }
    setLibelle('')
    setDescription('')
    setPrixUnitaire('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  const handleDesactiver = async (id: string) => {
    await fetch(`/api/prestations/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {prestations.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucune prestation dans le catalogue</p>}
        {prestations.map((p) => (
          <div key={p.id} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{p.libelle}</p>
              <p className="text-slate-400 text-xs">{p.prix_unitaire} € HT / {p.unite} — TVA {p.taux_tva}%</p>
            </div>
            <button
              onClick={() => handleDesactiver(p.id)}
              className="text-slate-500 hover:text-red-400 text-xs shrink-0 transition-colors"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-slate-300 text-sm font-semibold">Ajouter une prestation</h3>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Désignation *</label>
          <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex : Installation tableau électrique" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Description (optionnel)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détail de la prestation" className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Prix HT (€)</label>
            <input type="number" min="0" step="0.01" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Unité</label>
            <select value={unite} onChange={(e) => setUnite(e.target.value)} className={inputCls}>
              {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">TVA %</label>
            <input type="number" min="0" step="0.5" value={tauxTva} onChange={(e) => setTauxTva(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">Prestation ajoutée ✓</p>}
        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
          {saving ? 'Ajout…' : '+ Ajouter au catalogue'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 11 : Mettre à jour la page Paramètres**

Dans `src/app/(app)/parametres/page.tsx`, ajouter les imports manquants et gérer l'onglet catalogue :

Ajouter les imports :
```typescript
import { CatalogueForm } from '@/components/parametres/catalogue-form'
import { FINANCE_CLES } from '@/lib/validations/parametres'
import type { Prestation } from '@/lib/supabase/finance-types'
```

Modifier la fonction `getSettings` pour gérer aussi les prestations :
```typescript
async function getSettings(activeTab: string) {
  const supabase = await createClient()
  if (activeTab === 'catalogue') {
    const { data } = await supabase.from('prestations').select('*').eq('actif', true).order('libelle')
    return { settings: {}, prestations: (data ?? []) as Prestation[] }
  }
  const { data } = await supabase
    .from('app_settings')
    .select('cle, valeur')
    .in('cle', PARAMETRES_CLES)
  return { settings: Object.fromEntries((data ?? []).map((r) => [r.cle, r.valeur ?? ''])), prestations: [] }
}
```

Modifier `ParametresPage` pour gérer l'onglet catalogue :
```typescript
export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab === 'guide' ? 'guide' : params.tab === 'catalogue' ? 'catalogue' : 'parametres'
  const { settings, prestations } = await getSettings(activeTab)
  // ... reste identique sauf ajout du cas catalogue dans le rendu
```

Dans le rendu, ajouter le cas catalogue :
```typescript
      {activeTab === 'catalogue' && (
        <section>
          <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Catalogue de prestations
          </h2>
          <CatalogueForm prestations={prestations} />
        </section>
      )}
```

Et changer `activeTab` de `'parametres' | 'guide'` à `'parametres' | 'catalogue' | 'guide'` partout.

- [ ] **Step 12 : Appliquer la migration sur Supabase**

Depuis la console Supabase ou via CLI, appliquer `supabase/migrations/004_finances.sql` :
```
npx supabase db push
```
Ou depuis le dashboard Supabase → SQL Editor → coller et exécuter le contenu de `004_finances.sql`.

- [ ] **Step 13 : Lancer tous les tests**

```
npx jest --no-coverage
```
Attendu : ≥135 tests PASS, 0 failed

- [ ] **Step 14 : Build de production**

```
npm run build
```
Attendu : 0 erreurs TypeScript/compilation, toutes les routes générées avec succès

- [ ] **Step 15 : Commit final**

```
git add src/app/(app)/finances/ src/app/(app)/plus/page.tsx src/app/(app)/parametres/page.tsx src/components/projets/projet-tabs.tsx src/components/clients/client-tabs.tsx src/components/parametres/
git commit -m "feat(finance): pages finances, intégrations Plus/Projet/Client/Paramètres, build OK"
```

---

## Auto-review : couverture de la spec

### Périmètre ✓
- [x] Catalogue de prestations réutilisables — Task 2 + Task 9 (CatalogueForm)
- [x] Création et suivi de devis (cycle complet) — Tasks 3, 4, 10
- [x] Génération de factures depuis devis accepté — Task 4 (convertir)
- [x] Deux modes paiement : unique et acompte + solde — Task 4 (convertir), Task 9 (ConvertirModal)
- [x] Envoi par email + téléchargement PDF — Tasks 4, 5 (envoyer/pdf)
- [x] Relances automatiques J+7, J+30 — Task 7
- [x] Accès depuis /finances, fiche Projet, fiche Client — Task 10

### TVA ✓
- [x] Correction TVA 20% → 8,5% dans pdf-data.ts, devis-template.tsx, test — Task 6

### Navigation ✓
- [x] /plus → carte Finances — Task 10
- [x] /projets/[id] → onglet Finances — Task 10
- [x] /clients/[id] → onglet Finances — Task 10
- [x] /parametres?tab=catalogue — Tasks 10 (ParametresTabs, ParametresPage, CatalogueForm)

### Numérotation ✓
- [x] DEV-YYYY-NNN — Task 1 (numero.ts), Task 3 (route.ts)
- [x] FACT-YYYY-NNN — Task 1, Task 5

### Tests ✓
- Schémas Zod : 10 tests (finance.test.ts)
- Utilitaires numero : 5 tests
- Utilitaires totaux : 6 tests
- PDF data : 3 tests
- Email relance : 3 tests
- Composants display : 8 tests
- Composants formulaires : 4 tests
- **Total nouveaux : ~39 tests**
- **Total attendu : ≥ 139 tests (100 existants + 39)**

### Contraintes TypeScript ✓
- Aucun `any` implicite
- Zod sur toutes les entrées API
- RLS activé sur toutes les nouvelles tables
- Statuts finaux non modifiables (vérification explicite dans PUT/DELETE)

