# Dashboard Financier Graphiques — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un onglet "Rapport" à `/finances` avec 4 graphiques Recharts : CA mensuel 12 mois, pipeline devis (donut), top 5 clients, taux d'acceptation.

**Architecture:** Server Component `page.tsx` fetche les données Supabase côté serveur et les passe à un Client Component `rapport-financier.tsx` qui affiche les graphiques Recharts. Les calculs de groupement (par mois, par statut, par client) sont isolés dans `src/lib/utils/rapport.ts` pour être testables indépendamment.

**Tech Stack:** Next.js 14 App Router, Recharts, TypeScript strict, Zod, Supabase JS, @testing-library/react

---

## Fichiers

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Créer | `src/lib/validations/rapport.ts` | Types Zod : CaMensuelItem, PipelineDevisItem, TopClientItem, RapportFinancierData |
| Créer | `src/lib/utils/rapport.ts` | Fonctions pures de groupement : buildCaMensuel, buildPipelineDevis, buildTopClients, calcTauxAcceptation |
| Créer | `src/lib/utils/__tests__/rapport.test.ts` | Tests unitaires des 4 fonctions de calcul |
| Créer | `src/components/finances/rapport-financier.tsx` | Client Component : 4 sections visuelles avec Recharts |
| Créer | `src/components/finances/__tests__/rapport-financier.test.tsx` | Test rendu composant avec données mock |
| Modifier | `src/app/(app)/finances/page.tsx` | Ajout onglet "Rapport" + fetch des données rapport |

---

### Task 1 : Install recharts + types Zod + helpers de calcul + tests

**Files:**
- Install: `recharts`
- Créer: `src/lib/validations/rapport.ts`
- Créer: `src/lib/utils/rapport.ts`
- Créer: `src/lib/utils/__tests__/rapport.test.ts`

- [ ] **Step 1 : Installer recharts**

```bash
npm install recharts
```

Vérifier que l'installation s'est bien passée :
```bash
node -e "require('recharts'); console.log('OK')"
```
Résultat attendu : `OK`

- [ ] **Step 2 : Créer `src/lib/validations/rapport.ts`**

```ts
import { z } from 'zod'

export const CaMensuelItemSchema = z.object({
  mois: z.string(),
  label: z.string(),
  ca: z.number(),
})

export const PipelineDevisItemSchema = z.object({
  statut: z.string(),
  count: z.number().int().nonnegative(),
})

export const TopClientItemSchema = z.object({
  nom: z.string(),
  ca: z.number(),
})

export const RapportFinancierDataSchema = z.object({
  caMensuel: z.array(CaMensuelItemSchema),
  pipelineDevis: z.array(PipelineDevisItemSchema),
  topClients: z.array(TopClientItemSchema),
  tauxAcceptation: z.number().int().min(0).max(100),
})

export type CaMensuelItem = z.infer<typeof CaMensuelItemSchema>
export type PipelineDevisItem = z.infer<typeof PipelineDevisItemSchema>
export type TopClientItem = z.infer<typeof TopClientItemSchema>
export type RapportFinancierData = z.infer<typeof RapportFinancierDataSchema>
```

- [ ] **Step 3 : Écrire les tests dans `src/lib/utils/__tests__/rapport.test.ts`**

```ts
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
    const moisCourant = new Date().toISOString().split('T')[0].slice(0, 7) + '-15'
    const factures = [
      { date_emission: moisCourant, montant_ttc: 1000 },
      { date_emission: moisCourant, montant_ttc: 500 },
    ]
    const result = buildCaMensuel(factures)
    const dernier = result[result.length - 1]
    expect(dernier.ca).toBe(1500)
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
    }))
    expect(buildTopClients(factures)).toHaveLength(5)
  })

  it('additionne le CA par client', () => {
    const factures = [
      { client_id: 'c1', montant_ttc: 2000, client: { nom: 'Client A' } },
      { client_id: 'c1', montant_ttc: 1000, client: { nom: 'Client A' } },
      { client_id: 'c2', montant_ttc: 5000, client: { nom: 'Client B' } },
    ]
    const result = buildTopClients(factures)
    expect(result[0].nom).toBe('Client B')
    expect(result[0].ca).toBe(5000)
    expect(result[1].ca).toBe(3000)
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
    // 2 acceptés / 3 clôturés = 67%
    expect(calcTauxAcceptation(devis)).toBe(67)
  })

  it('retourne 100 si tous acceptés', () => {
    expect(calcTauxAcceptation([{ statut: 'accepté' }, { statut: 'accepté' }])).toBe(100)
  })

  it('retourne 0 si tous refusés', () => {
    expect(calcTauxAcceptation([{ statut: 'refusé' }, { statut: 'expiré' }])).toBe(0)
  })
})
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils échouent**

```bash
npx jest src/lib/utils/__tests__/rapport.test.ts --no-coverage
```

Résultat attendu : FAIL — Cannot find module `'../rapport'`

- [ ] **Step 5 : Créer `src/lib/utils/rapport.ts`**

```ts
import type { CaMensuelItem, PipelineDevisItem, TopClientItem } from '@/lib/validations/rapport'

type FactureRow = {
  date_emission: string
  montant_ttc: number
  client_id: string
  client: { nom: string } | null
}

type DevisRow = { statut: string }

const STATUTS_DEVIS = ['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré'] as const

export function buildCaMensuel(
  factures: Pick<FactureRow, 'date_emission' | 'montant_ttc'>[]
): CaMensuelItem[] {
  const map = new Map<string, number>()
  factures.forEach(f => {
    const d = new Date(f.date_emission)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + Number(f.montant_ttc))
  })
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    return { mois: key, label, ca: map.get(key) ?? 0 }
  })
}

export function buildPipelineDevis(devis: DevisRow[]): PipelineDevisItem[] {
  const map = new Map<string, number>()
  devis.forEach(d => map.set(d.statut, (map.get(d.statut) ?? 0) + 1))
  return STATUTS_DEVIS
    .map(s => ({ statut: s, count: map.get(s) ?? 0 }))
    .filter(s => s.count > 0)
}

export function buildTopClients(factures: FactureRow[]): TopClientItem[] {
  const map = new Map<string, { nom: string; ca: number }>()
  factures.forEach(f => {
    const nom = (f.client as { nom: string } | null)?.nom ?? 'Inconnu'
    const prev = map.get(f.client_id) ?? { nom, ca: 0 }
    map.set(f.client_id, { nom: prev.nom, ca: prev.ca + Number(f.montant_ttc) })
  })
  return [...map.values()].sort((a, b) => b.ca - a.ca).slice(0, 5)
}

export function calcTauxAcceptation(devis: DevisRow[]): number {
  const clotures = devis.filter(d => ['accepté', 'refusé', 'expiré'].includes(d.statut))
  if (clotures.length === 0) return 0
  const acceptes = devis.filter(d => d.statut === 'accepté').length
  return Math.round((acceptes / clotures.length) * 100)
}
```

- [ ] **Step 6 : Relancer les tests pour vérifier qu'ils passent**

```bash
npx jest src/lib/utils/__tests__/rapport.test.ts --no-coverage
```

Résultat attendu : PASS — 12 tests passent

- [ ] **Step 7 : Commit**

```bash
git add src/lib/validations/rapport.ts src/lib/utils/rapport.ts src/lib/utils/__tests__/rapport.test.ts
git commit -m "feat(rapport): types Zod + helpers groupement CA/pipeline/clients/taux"
```

---

### Task 2 : Composant RapportFinancier + test rendu

**Files:**
- Créer: `src/components/finances/rapport-financier.tsx`
- Créer: `src/components/finances/__tests__/rapport-financier.test.tsx`

- [ ] **Step 1 : Écrire le test de rendu dans `src/components/finances/__tests__/rapport-financier.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { RapportFinancier } from '../rapport-financier'
import type { RapportFinancierData } from '@/lib/validations/rapport'

jest.mock('recharts', () => {
  const React = require('react')
  const Mock = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return {
    ResponsiveContainer: Mock,
    BarChart: Mock,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    PieChart: Mock,
    Pie: () => null,
    Cell: () => null,
    Legend: () => null,
  }
})

const data: RapportFinancierData = {
  caMensuel: [
    { mois: '2026-04', label: 'avr. 26', ca: 5000 },
    { mois: '2026-05', label: 'mai 26', ca: 12000 },
  ],
  pipelineDevis: [
    { statut: 'envoyé', count: 3 },
    { statut: 'accepté', count: 5 },
  ],
  topClients: [
    { nom: 'Carrefour Grand Nord', ca: 45000 },
    { nom: 'E. Leclerc', ca: 28000 },
  ],
  tauxAcceptation: 62,
}

describe('RapportFinancier', () => {
  it('affiche le titre CA mensuel', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText(/CA mensuel/i)).toBeInTheDocument()
  })

  it('affiche le taux d acceptation', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('affiche le titre top clients', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText(/Top 5 clients/i)).toBeInTheDocument()
  })

  it('affiche la section pipeline devis', () => {
    render(<RapportFinancier data={data} />)
    expect(screen.getByText(/Pipeline devis/i)).toBeInTheDocument()
  })

  it('colore le taux en amber si entre 40 et 70', () => {
    const { container } = render(<RapportFinancier data={data} />)
    const span = container.querySelector('.text-amber-400')
    expect(span).toBeInTheDocument()
  })

  it('colore le taux en emerald si >= 70', () => {
    const highData = { ...data, tauxAcceptation: 80 }
    const { container } = render(<RapportFinancier data={highData} />)
    expect(container.querySelector('.text-emerald-400')).toBeInTheDocument()
  })

  it('colore le taux en red si < 40', () => {
    const lowData = { ...data, tauxAcceptation: 20 }
    const { container } = render(<RapportFinancier data={lowData} />)
    expect(container.querySelector('.text-red-400')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx jest src/components/finances/__tests__/rapport-financier.test.tsx --no-coverage
```

Résultat attendu : FAIL — Cannot find module `'../rapport-financier'`

- [ ] **Step 3 : Créer `src/components/finances/rapport-financier.tsx`**

```tsx
'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { RapportFinancierData } from '@/lib/validations/rapport'

const STATUT_COLORS: Record<string, string> = {
  brouillon: '#64748b',
  envoyé: '#0ea5e9',
  accepté: '#10b981',
  refusé: '#ef4444',
  expiré: '#f59e0b',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function tauxColor(taux: number): string {
  if (taux >= 70) return 'text-emerald-400'
  if (taux >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function RapportFinancier({ data }: { data: RapportFinancierData }) {
  return (
    <div className="space-y-6 mt-4">
      {/* CA mensuel */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">CA mensuel (12 mois)</h2>
        <div className="bg-slate-800/60 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.caMensuel} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={1}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip
                formatter={(v: number) => [eur(v), 'CA']}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Bar dataKey="ca" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Pipeline devis */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Pipeline devis</h2>
        <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-4">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data.pipelineDevis}
                  dataKey="count"
                  nameKey="statut"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {data.pipelineDevis.map((entry) => (
                    <Cell
                      key={entry.statut}
                      fill={STATUT_COLORS[entry.statut] ?? '#64748b'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.pipelineDevis.map((item) => (
              <div key={item.statut} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                    style={{ background: STATUT_COLORS[item.statut] ?? '#64748b' }}
                  />
                  <span className="text-slate-400 capitalize">{item.statut}</span>
                </span>
                <span className="text-white font-semibold">{item.count}</span>
              </div>
            ))}
            {data.pipelineDevis.length === 0 && (
              <p className="text-slate-500 text-xs">Aucun devis</p>
            )}
          </div>
        </div>
      </section>

      {/* Top 5 clients */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Top 5 clients (CA facturé)</h2>
        {data.topClients.length === 0 ? (
          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-slate-500 text-xs text-center">Aucune facture payée</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-xl p-3">
            <ResponsiveContainer width="100%" height={data.topClients.length * 40 + 16}>
              <BarChart
                data={data.topClients}
                layout="vertical"
                margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={100}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(v: number) => [eur(v), 'CA']}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Bar dataKey="ca" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Taux d'acceptation */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          Taux d&apos;acceptation des devis
        </h2>
        <div className="bg-slate-800/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Devis acceptés / clôturés</p>
            <p className="text-slate-500 text-xs mt-0.5">
              (acceptés parmi acceptés + refusés + expirés)
            </p>
          </div>
          <span className={`text-3xl font-bold tabular-nums ${tauxColor(data.tauxAcceptation)}`}>
            {data.tauxAcceptation}%
          </span>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4 : Relancer les tests pour vérifier qu'ils passent**

```bash
npx jest src/components/finances/__tests__/rapport-financier.test.tsx --no-coverage
```

Résultat attendu : PASS — 7 tests passent

- [ ] **Step 5 : Commit**

```bash
git add src/components/finances/rapport-financier.tsx src/components/finances/__tests__/rapport-financier.test.tsx
git commit -m "feat(rapport): composant RapportFinancier avec graphiques Recharts"
```

---

### Task 3 : Intégration dans la page /finances + onglet Rapport

**Files:**
- Modifier: `src/app/(app)/finances/page.tsx`

- [ ] **Step 1 : Remplacer `src/app/(app)/finances/page.tsx` par la version avec onglet Rapport**

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FinancesKpis } from '@/components/finances/finances-kpis'
import { DevisCard } from '@/components/finances/devis-card'
import { FactureCard } from '@/components/finances/facture-card'
import { RapportFinancier } from '@/components/finances/rapport-financier'
import {
  buildCaMensuel,
  buildPipelineDevis,
  buildTopClients,
  calcTauxAcceptation,
} from '@/lib/utils/rapport'
import type { FinancesKpisData, Devis, Facture } from '@/lib/supabase/finance-types'
import type { RapportFinancierData } from '@/lib/validations/rapport'

type Tab = 'devis' | 'factures' | 'rapport'

async function getFinancesData(tab: Tab) {
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

  if (tab === 'rapport') {
    const date12MoisAgo = new Date()
    date12MoisAgo.setFullYear(date12MoisAgo.getFullYear() - 1)
    const dateMoins12Mois = date12MoisAgo.toISOString().split('T')[0]

    const [facturesPayeesRes, tousDevisRes, topClientsRes] = await Promise.all([
      supabase
        .from('factures')
        .select('date_emission, montant_ttc')
        .eq('statut', 'payée')
        .gte('date_emission', dateMoins12Mois),
      supabase.from('devis').select('statut'),
      supabase
        .from('factures')
        .select('client_id, montant_ttc, client:clients(nom)')
        .eq('statut', 'payée'),
    ])

    const devisRows = tousDevisRes.data ?? []
    const rapport: RapportFinancierData = {
      caMensuel: buildCaMensuel(facturesPayeesRes.data ?? []),
      pipelineDevis: buildPipelineDevis(devisRows),
      topClients: buildTopClients(
        (topClientsRes.data ?? []) as unknown as {
          client_id: string
          montant_ttc: number
          client: { nom: string } | null
        }[]
      ),
      tauxAcceptation: calcTauxAcceptation(devisRows),
    }

    return { kpis, rapport, devis: [], factures: [] }
  }

  if (tab === 'factures') {
    const { data } = await supabase
      .from('factures')
      .select('*, client:clients(id, nom)')
      .order('created_at', { ascending: false })
      .limit(20)
    return {
      kpis,
      rapport: null,
      factures: (data ?? []) as unknown as (Facture & { client: { id: string; nom: string } })[],
      devis: [],
    }
  }

  const { data } = await supabase
    .from('devis')
    .select('*, client:clients(id, nom)')
    .order('created_at', { ascending: false })
    .limit(20)
  return {
    kpis,
    rapport: null,
    devis: (data ?? []) as unknown as (Devis & { client: { id: string; nom: string } })[],
    factures: [],
  }
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab: Tab =
    params.tab === 'factures' ? 'factures'
    : params.tab === 'rapport' ? 'rapport'
    : 'devis'

  const { kpis, devis, factures, rapport } = await getFinancesData(tab)

  const tabClass = (t: Tab) =>
    `flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
      tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
    }`

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
        <Link href="/finances" className={tabClass('devis')}>Devis</Link>
        <Link href="/finances?tab=factures" className={tabClass('factures')}>Factures</Link>
        <Link href="/finances?tab=rapport" className={tabClass('rapport')}>Rapport</Link>
      </div>

      {tab === 'devis' && (
        <div className="space-y-3">
          {devis.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucun devis</p>}
          {devis.map((d) => (
            <DevisCard key={d.id} devis={d} clientNom={(d.client as { nom: string }).nom} />
          ))}
        </div>
      )}

      {tab === 'factures' && (
        <div className="space-y-3">
          {factures.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aucune facture</p>}
          {factures.map((f) => (
            <FactureCard key={f.id} facture={f} clientNom={(f.client as { nom: string }).nom} />
          ))}
        </div>
      )}

      {tab === 'rapport' && rapport && <RapportFinancier data={rapport} />}
    </div>
  )
}
```

- [ ] **Step 2 : Lancer tous les tests pour vérifier qu'aucune régression**

```bash
npx jest --no-coverage
```

Résultat attendu : PASS — tous les tests existants + les 19 nouveaux passent

- [ ] **Step 3 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : 0 erreurs

- [ ] **Step 4 : Vérifier le build production**

```bash
npm run build
```

Résultat attendu : Build réussi, route `/finances` listée dans la sortie

- [ ] **Step 5 : Commit final**

```bash
git add src/app/(app)/finances/page.tsx
git commit -m "feat(rapport): onglet Rapport dans /finances avec graphiques CA/pipeline/clients/taux"
```
