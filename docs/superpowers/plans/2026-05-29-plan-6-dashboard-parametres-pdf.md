# Plan 6 — Tableau de bord, Page Plus, Paramètres & Génération PDF

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter l'application ATEXIA CRM avec un tableau de bord réel, la page Plus, les sous-onglets Échanges/Documents dans les fiches client, le module Paramètres et la génération PDF.

**Architecture:** Server Components avec Suspense pour le dashboard (requêtes parallèles Supabase). Nouvelle table `app_settings` (clé/valeur) pour les paramètres entreprise. Génération PDF côté serveur via `@react-pdf/renderer` dans une API route qui renvoie un buffer `application/pdf` et sauvegarde dans Supabase Storage.

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript strict, Zod, Tailwind, @react-pdf/renderer v4, React Testing Library

**Prérequis:** Plan 5 doit être terminé — les routes `GET /api/interactions` et `GET /api/documents` doivent exister avec filtres `client_id` et `projet_id`.

---

## Carte des fichiers

**Créés :**
- `src/lib/validations/dashboard.ts` — schemas Zod KPIs + types dashboard
- `src/lib/validations/parametres.ts` — schemas Zod settings entreprise
- `src/lib/pdf/rapport-template.tsx` — template PDF React rapport d'intervention
- `src/lib/pdf/devis-template.tsx` — template PDF React devis
- `src/components/dashboard/dashboard-kpis.tsx` — 4 cartes KPI
- `src/components/dashboard/taches-aujourd-hui.tsx` — liste tâches du jour
- `src/components/dashboard/projets-recents.tsx` — liste projets récents
- `src/components/plus/module-card.tsx` — carte cliquable module
- `src/components/clients/client-echanges.tsx` — onglet échanges fiche client
- `src/components/clients/client-documents.tsx` — onglet documents fiche client
- `src/components/parametres/entreprise-form.tsx` — formulaire infos entreprise
- `src/components/documents/pdf-generate-button.tsx` — bouton génération PDF
- `src/components/ui/offline-message.tsx` — bandeau hors ligne
- `src/app/(app)/parametres/page.tsx` — page paramètres
- `src/app/(app)/parametres/loading.tsx` — skeleton paramètres
- `src/app/api/parametres/route.ts` — GET/PUT paramètres entreprise
- `src/app/api/documents/generate-pdf/route.ts` — génération + upload PDF
- `supabase/migrations/003_app_settings.sql` — table app_settings

**Modifiés :**
- `src/app/(app)/page.tsx` — dashboard complet
- `src/app/(app)/plus/page.tsx` — grille modules
- `src/components/clients/client-tabs.tsx` — ajout onglets Échanges + Documents fonctionnels
- `src/lib/supabase/types.ts` — ajout type AppSettings
- `src/app/(app)/layout.tsx` — ajout OfflineMessage

**Tests :**
- `src/lib/validations/__tests__/dashboard.test.ts`
- `src/lib/validations/__tests__/parametres.test.ts`
- `src/lib/pdf/__tests__/pdf-data.test.ts`
- `src/components/dashboard/__tests__/dashboard-kpis.test.tsx`
- `src/components/dashboard/__tests__/taches-aujourd-hui.test.tsx`
- `src/components/plus/__tests__/module-card.test.tsx`
- `src/components/clients/__tests__/client-echanges.test.tsx`
- `src/components/parametres/__tests__/entreprise-form.test.tsx`
- `src/components/documents/__tests__/pdf-generate-button.test.tsx`
- `src/components/ui/__tests__/offline-message.test.tsx`

---

## Task 1 : Schemas Zod dashboard

**Files:**
- Create: `src/lib/validations/dashboard.ts`
- Test: `src/lib/validations/__tests__/dashboard.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```typescript
// src/lib/validations/__tests__/dashboard.test.ts
import { DashboardKpisSchema, TacheLiteSchema, ProjetLiteSchema, DashboardResponseSchema } from '../dashboard'

describe('DashboardKpisSchema', () => {
  it('valide des KPIs valides', () => {
    const result = DashboardKpisSchema.safeParse({
      clients_actifs: 5,
      projets_en_cours: 3,
      taches_urgentes: 2,
      documents_devis: 4,
    })
    expect(result.success).toBe(true)
  })

  it('rejette une valeur négative', () => {
    const result = DashboardKpisSchema.safeParse({
      clients_actifs: -1,
      projets_en_cours: 0,
      taches_urgentes: 0,
      documents_devis: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('TacheLiteSchema', () => {
  it('valide une tâche avec client null', () => {
    const result = TacheLiteSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      titre: 'Vérifier chantier',
      priorite: 'haute',
      date_echeance: '2026-05-29T08:00:00.000Z',
      client: null,
      projet: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejette une priorité invalide', () => {
    const result = TacheLiteSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      titre: 'Test',
      priorite: 'extreme',
      date_echeance: null,
      client: null,
      projet: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('DashboardResponseSchema', () => {
  it('valide une réponse complète', () => {
    const result = DashboardResponseSchema.safeParse({
      kpis: { clients_actifs: 3, projets_en_cours: 2, taches_urgentes: 1, documents_devis: 5 },
      taches_du_jour: [],
      projets_recents: [],
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/lib/validations/__tests__/dashboard.test.ts --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3 : Implémenter le schema**

```typescript
// src/lib/validations/dashboard.ts
import { z } from 'zod'

export const DashboardKpisSchema = z.object({
  clients_actifs: z.number().int().nonnegative(),
  projets_en_cours: z.number().int().nonnegative(),
  taches_urgentes: z.number().int().nonnegative(),
  documents_devis: z.number().int().nonnegative(),
})

export const TacheLiteSchema = z.object({
  id: z.string().uuid(),
  titre: z.string(),
  priorite: z.enum(['haute', 'normale', 'basse']),
  date_echeance: z.string().nullable(),
  client: z.object({ id: z.string(), nom: z.string() }).nullable(),
  projet: z.object({ id: z.string(), titre: z.string() }).nullable(),
})

export const ProjetLiteSchema = z.object({
  id: z.string().uuid(),
  titre: z.string(),
  statut: z.string(),
  avancement: z.number(),
  updated_at: z.string(),
  client: z.object({ id: z.string(), nom: z.string() }),
})

export const DashboardResponseSchema = z.object({
  kpis: DashboardKpisSchema,
  taches_du_jour: z.array(TacheLiteSchema),
  projets_recents: z.array(ProjetLiteSchema),
})

export type DashboardKpis = z.infer<typeof DashboardKpisSchema>
export type TacheLite = z.infer<typeof TacheLiteSchema>
export type ProjetLite = z.infer<typeof ProjetLiteSchema>
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>
```

- [ ] **Step 4 : Vérifier que les tests passent**

```
npx jest src/lib/validations/__tests__/dashboard.test.ts --no-coverage
```
Expected: PASS — 5 tests

- [ ] **Step 5 : Commit**

```bash
git add src/lib/validations/dashboard.ts src/lib/validations/__tests__/dashboard.test.ts
git commit -m "feat: schemas Zod dashboard (KPIs, TacheLite, ProjetLite)"
```

---

## Task 2 : DashboardKpis component

**Files:**
- Create: `src/components/dashboard/dashboard-kpis.tsx`
- Test: `src/components/dashboard/__tests__/dashboard-kpis.test.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/dashboard/__tests__/dashboard-kpis.test.tsx
import { render, screen } from '@testing-library/react'
import { DashboardKpis } from '../dashboard-kpis'

const kpis = {
  clients_actifs: 5,
  projets_en_cours: 3,
  taches_urgentes: 2,
  documents_devis: 4,
}

describe('DashboardKpis', () => {
  it('affiche les 4 valeurs numériques', () => {
    render(<DashboardKpis kpis={kpis} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('affiche les 4 labels', () => {
    render(<DashboardKpis kpis={kpis} />)
    expect(screen.getByText('Clients actifs')).toBeInTheDocument()
    expect(screen.getByText('Projets en cours')).toBeInTheDocument()
    expect(screen.getByText('Tâches urgentes')).toBeInTheDocument()
    expect(screen.getByText('Devis')).toBeInTheDocument()
  })

  it('affiche 0 sans crasher', () => {
    render(<DashboardKpis kpis={{ clients_actifs: 0, projets_en_cours: 0, taches_urgentes: 0, documents_devis: 0 }} />)
    expect(screen.getAllByText('0')).toHaveLength(4)
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/dashboard/__tests__/dashboard-kpis.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter le composant**

```typescript
// src/components/dashboard/dashboard-kpis.tsx
import type { DashboardKpis as DashboardKpisType } from '@/lib/validations/dashboard'

interface KpiCardProps {
  label: string
  value: number
  icon: string
  colorClass: string
}

function KpiCard({ label, value, icon, colorClass }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-300 mt-1">{label}</div>
    </div>
  )
}

interface DashboardKpisProps {
  kpis: DashboardKpisType
}

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard label="Clients actifs" value={kpis.clients_actifs} icon="🏢" colorClass="bg-sky-500/20" />
      <KpiCard label="Projets en cours" value={kpis.projets_en_cours} icon="🔧" colorClass="bg-violet-500/20" />
      <KpiCard label="Tâches urgentes" value={kpis.taches_urgentes} icon="⚡" colorClass="bg-red-500/20" />
      <KpiCard label="Devis" value={kpis.documents_devis} icon="📄" colorClass="bg-amber-500/20" />
    </div>
  )
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```
npx jest src/components/dashboard/__tests__/dashboard-kpis.test.tsx --no-coverage
```
Expected: PASS — 3 tests

- [ ] **Step 5 : Commit**

```bash
git add src/components/dashboard/dashboard-kpis.tsx src/components/dashboard/__tests__/dashboard-kpis.test.tsx
git commit -m "feat: DashboardKpis component (4 cartes KPI)"
```

---

## Task 3 : TachesAujourdhui + ProjetsRecents + page Dashboard complète

**Files:**
- Create: `src/components/dashboard/taches-aujourd-hui.tsx`
- Create: `src/components/dashboard/projets-recents.tsx`
- Test: `src/components/dashboard/__tests__/taches-aujourd-hui.test.tsx`
- Modify: `src/app/(app)/page.tsx`

- [ ] **Step 1 : Écrire les tests TachesAujourdhui**

```typescript
// src/components/dashboard/__tests__/taches-aujourd-hui.test.tsx
import { render, screen } from '@testing-library/react'
import { TachesAujourdhui } from '../taches-aujourd-hui'
import type { TacheLite } from '@/lib/validations/dashboard'

const tache: TacheLite = {
  id: '00000000-0000-0000-0000-000000000001',
  titre: 'Vérifier tableau électrique',
  priorite: 'haute',
  date_echeance: '2026-05-29T08:00:00.000Z',
  client: { id: 'c1', nom: 'Carrefour Grand Nord' },
  projet: null,
}

describe('TachesAujourdhui', () => {
  it('affiche le message vide quand aucune tâche', () => {
    render(<TachesAujourdhui taches={[]} />)
    expect(screen.getByText(/aucune tâche/i)).toBeInTheDocument()
  })

  it('affiche le titre de la tâche', () => {
    render(<TachesAujourdhui taches={[tache]} />)
    expect(screen.getByText('Vérifier tableau électrique')).toBeInTheDocument()
  })

  it('affiche le nom du client', () => {
    render(<TachesAujourdhui taches={[tache]} />)
    expect(screen.getByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('affiche plusieurs tâches', () => {
    const t2 = { ...tache, id: '00000000-0000-0000-0000-000000000002', titre: 'Réunion chantier' }
    render(<TachesAujourdhui taches={[tache, t2]} />)
    expect(screen.getByText('Vérifier tableau électrique')).toBeInTheDocument()
    expect(screen.getByText('Réunion chantier')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/dashboard/__tests__/taches-aujourd-hui.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter TachesAujourdhui**

```typescript
// src/components/dashboard/taches-aujourd-hui.tsx
import Link from 'next/link'
import type { TacheLite } from '@/lib/validations/dashboard'

const PRIORITE_BORDER: Record<string, string> = {
  haute: 'border-l-red-500',
  normale: 'border-l-amber-500',
  basse: 'border-l-slate-500',
}

interface TachesAujourdhuiProps {
  taches: TacheLite[]
}

export function TachesAujourdhui({ taches }: TachesAujourdhuiProps) {
  if (taches.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">
        Aucune tâche pour aujourd&apos;hui 🎉
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {taches.map((tache) => (
        <Link
          key={tache.id}
          href="/taches"
          className={`block bg-slate-800 rounded-lg p-3 border-l-4 ${PRIORITE_BORDER[tache.priorite] ?? 'border-l-slate-500'}`}
        >
          <p className="text-white text-sm font-medium line-clamp-1">{tache.titre}</p>
          {tache.client && (
            <p className="text-slate-400 text-xs mt-0.5">{tache.client.nom}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 4 : Implémenter ProjetsRecents**

```typescript
// src/components/dashboard/projets-recents.tsx
import Link from 'next/link'
import type { ProjetLite } from '@/lib/validations/dashboard'

const STATUT_BADGE: Record<string, string> = {
  en_cours: 'bg-amber-500/20 text-amber-400',
  en_etude: 'bg-sky-500/20 text-sky-400',
  sav: 'bg-red-500/20 text-red-400',
}

const STATUT_LABEL: Record<string, string> = {
  en_cours: 'En cours',
  en_etude: 'En étude',
  sav: 'SAV',
  termine: 'Terminé',
}

interface ProjetsRecentsProps {
  projets: ProjetLite[]
}

export function ProjetsRecents({ projets }: ProjetsRecentsProps) {
  if (projets.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">Aucun projet en cours</p>
    )
  }

  return (
    <div className="space-y-2">
      {projets.map((projet) => (
        <Link
          key={projet.id}
          href={`/projets/${projet.id}`}
          className="block bg-slate-800 rounded-lg p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium line-clamp-1">{projet.titre}</p>
              <p className="text-slate-400 text-xs mt-0.5">{projet.client.nom}</p>
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_BADGE[projet.statut] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {STATUT_LABEL[projet.statut] ?? projet.statut}
            </span>
          </div>
          <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${projet.avancement}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier que les tests TachesAujourdhui passent**

```
npx jest src/components/dashboard/__tests__/taches-aujourd-hui.test.tsx --no-coverage
```
Expected: PASS — 4 tests

- [ ] **Step 6 : Remplacer la page Dashboard**

Remplacer entièrement `src/app/(app)/page.tsx` :

```typescript
// src/app/(app)/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardKpis } from '@/components/dashboard/dashboard-kpis'
import { TachesAujourdhui } from '@/components/dashboard/taches-aujourd-hui'
import { ProjetsRecents } from '@/components/dashboard/projets-recents'
import { FabCreate } from '@/components/dashboard/fab-create'
import { Skeleton } from '@/components/ui/skeleton'
import type { TacheLite, ProjetLite } from '@/lib/validations/dashboard'

async function DashboardContent() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = new Date(today.getTime() + 86_400_000).toISOString().split('T')[0]

  const [
    clientsRes,
    projetsEnCoursRes,
    tachesUrgentesRes,
    devisRes,
    tachesDuJourRes,
    projetsRecentsRes,
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    supabase.from('projets').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
    supabase.from('taches').select('*', { count: 'exact', head: true }).eq('priorite', 'haute').eq('statut', 'a_faire'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('type', 'devis'),
    supabase
      .from('taches')
      .select('id, titre, priorite, date_echeance, client:clients(id, nom), projet:projets(id, titre)')
      .eq('statut', 'a_faire')
      .gte('date_echeance', `${todayStr}T00:00:00.000Z`)
      .lt('date_echeance', `${tomorrowStr}T00:00:00.000Z`)
      .order('priorite', { ascending: true })
      .limit(5),
    supabase
      .from('projets')
      .select('id, titre, statut, avancement, updated_at, client:clients(id, nom)')
      .neq('statut', 'termine')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const kpis = {
    clients_actifs: clientsRes.count ?? 0,
    projets_en_cours: projetsEnCoursRes.count ?? 0,
    taches_urgentes: tachesUrgentesRes.count ?? 0,
    documents_devis: devisRes.count ?? 0,
  }

  return (
    <div className="space-y-6">
      <DashboardKpis kpis={kpis} />

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Tâches du jour
        </h2>
        <TachesAujourdhui taches={(tachesDuJourRes.data ?? []) as TacheLite[]} />
      </section>

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Projets récents
        </h2>
        <ProjetsRecents projets={(projetsRecentsRes.data ?? []) as ProjetLite[]} />
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <p className="text-slate-400 text-sm">Bonjour 👋</p>
        <h1 className="text-xl font-bold text-white">ATEXIA</h1>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
      <FabCreate />
    </div>
  )
}
```

- [ ] **Step 7 : Build de vérification**

```
npm run build
```
Expected: compilation OK, 0 erreur TypeScript

- [ ] **Step 8 : Commit**

```bash
git add src/components/dashboard/taches-aujourd-hui.tsx src/components/dashboard/projets-recents.tsx src/components/dashboard/__tests__/taches-aujourd-hui.test.tsx src/app/(app)/page.tsx
git commit -m "feat: dashboard complet — KPIs réels, tâches du jour, projets récents"
```

---

## Task 4 : Page Plus — grille modules

**Files:**
- Create: `src/components/plus/module-card.tsx`
- Test: `src/components/plus/__tests__/module-card.test.tsx`
- Modify: `src/app/(app)/plus/page.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/plus/__tests__/module-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ModuleCard } from '../module-card'

describe('ModuleCard', () => {
  it('affiche le label et l\'icône', () => {
    render(<ModuleCard href="/documents" icon="📂" label="Documents" description="Fichiers et PDF" />)
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Fichiers et PDF')).toBeInTheDocument()
    expect(screen.getByText('📂')).toBeInTheDocument()
  })

  it('génère un lien vers le href', () => {
    render(<ModuleCard href="/echanges" icon="💬" label="Échanges" description="Journal des contacts" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/echanges')
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/plus/__tests__/module-card.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter ModuleCard**

```typescript
// src/components/plus/module-card.tsx
import Link from 'next/link'

interface ModuleCardProps {
  href: string
  icon: string
  label: string
  description: string
}

export function ModuleCard({ href, icon, label, description }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 bg-slate-800 rounded-2xl p-5 active:bg-slate-700 transition-colors text-center"
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-white text-sm font-semibold">{label}</span>
      <span className="text-slate-400 text-xs">{description}</span>
    </Link>
  )
}
```

- [ ] **Step 4 : Remplacer la page Plus**

```typescript
// src/app/(app)/plus/page.tsx
import { ModuleCard } from '@/components/plus/module-card'

const MODULES = [
  { href: '/echanges', icon: '💬', label: 'Échanges', description: 'Appels, emails, visites' },
  { href: '/documents', icon: '📂', label: 'Documents', description: 'Fichiers et PDF' },
  { href: '/parametres', icon: '⚙️', label: 'Paramètres', description: 'Entreprise et compte' },
]

export default function PlusPage() {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Plus</h1>
      <div className="grid grid-cols-2 gap-4">
        {MODULES.map((mod) => (
          <ModuleCard key={mod.href} {...mod} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier les tests**

```
npx jest src/components/plus/__tests__/module-card.test.tsx --no-coverage
```
Expected: PASS — 2 tests

- [ ] **Step 6 : Commit**

```bash
git add src/components/plus/ src/app/(app)/plus/page.tsx
git commit -m "feat: page Plus avec grille modules (Échanges, Documents, Paramètres)"
```

---

## Task 5 : ClientTabs — onglets Échanges + Documents fonctionnels

**Prérequis :** Plan 5 terminé — `GET /api/interactions?client_id=X` et `GET /api/documents?client_id=X` existent.

**Files:**
- Create: `src/components/clients/client-echanges.tsx`
- Create: `src/components/clients/client-documents.tsx`
- Test: `src/components/clients/__tests__/client-echanges.test.tsx`
- Modify: `src/components/clients/client-tabs.tsx`

- [ ] **Step 1 : Écrire les tests ClientEchanges**

```typescript
// src/components/clients/__tests__/client-echanges.test.tsx
import { render, screen } from '@testing-library/react'
import { ClientEchanges } from '../client-echanges'

const INTERACTION = {
  id: 'i1',
  type: 'appel',
  date: '2026-05-20T10:00:00.000Z',
  resume: 'Discussion sur le devis photovoltaïque',
  suite_a_donner: 'Envoyer offre révisée',
  client_id: 'c1',
  projet_id: null,
  created_at: '2026-05-20T10:00:00.000Z',
}

global.fetch = jest.fn()

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ interactions: [INTERACTION], total: 1 }),
  })
})

afterEach(() => jest.clearAllMocks())

describe('ClientEchanges', () => {
  it('affiche un état de chargement puis le résumé', async () => {
    render(<ClientEchanges clientId="c1" />)
    expect(await screen.findByText('Discussion sur le devis photovoltaïque')).toBeInTheDocument()
  })

  it('affiche la suite à donner', async () => {
    render(<ClientEchanges clientId="c1" />)
    expect(await screen.findByText(/Envoyer offre révisée/)).toBeInTheDocument()
  })

  it('affiche le message vide si aucune interaction', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interactions: [], total: 0 }),
    })
    render(<ClientEchanges clientId="c1" />)
    expect(await screen.findByText(/aucun échange/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/clients/__tests__/client-echanges.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter ClientEchanges**

```typescript
// src/components/clients/client-echanges.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Interaction {
  id: string
  type: string
  date: string
  resume: string
  suite_a_donner: string | null
  projet_id: string | null
}

const TYPE_LABEL: Record<string, string> = {
  appel: 'Appel', email: 'Email', visite: 'Visite', reunion: 'Réunion', autre: 'Autre',
}
const TYPE_COLOR: Record<string, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

interface ClientEchangesProps {
  clientId: string
}

export function ClientEchanges({ clientId }: ClientEchangesProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/interactions?client_id=${clientId}&page=1`)
      .then((r) => r.json())
      .then((data) => setInteractions(data.interactions ?? []))
      .catch(() => setInteractions([]))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">{interactions.length} échange{interactions.length !== 1 ? 's' : ''}</span>
        <Link href={`/echanges/nouveau?client=${clientId}`} className="text-sky-400 text-sm font-medium">
          + Nouvel échange
        </Link>
      </div>

      {interactions.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun échange enregistré</p>
      )}

      {interactions.map((interaction) => (
        <div key={interaction.id} className="bg-slate-900 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[interaction.type] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {TYPE_LABEL[interaction.type] ?? interaction.type}
            </span>
            <span className="text-slate-500 text-xs ml-auto">
              {new Date(interaction.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <p className="text-white text-sm line-clamp-2">{interaction.resume}</p>
          {interaction.suite_a_donner && (
            <p className="text-amber-400 text-xs mt-2">→ {interaction.suite_a_donner}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4 : Implémenter ClientDocuments**

```typescript
// src/components/clients/client-documents.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DocRow {
  id: string
  nom: string
  type: string
  taille_octets: number | null
  storage_path: string | null
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  devis: '📄', rapport: '📋', plan: '📐', photo: '📷', contrat: '📝', autre: '📎',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

interface ClientDocumentsProps {
  clientId: string
}

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/documents?client_id=${clientId}&page=1`)
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        <Link href="/documents" className="text-sky-400 text-sm font-medium">
          Voir tous →
        </Link>
      </div>

      {documents.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun document</p>
      )}

      {documents.map((doc) => (
        <div key={doc.id} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">{TYPE_ICON[doc.type] ?? '📎'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
            <p className="text-slate-500 text-xs">{formatSize(doc.taille_octets)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5 : Modifier client-tabs.tsx pour brancher les nouveaux onglets**

Dans `src/components/clients/client-tabs.tsx`, ajouter les imports et remplacer la section tabs :

```typescript
// Ajouter les imports (après les imports existants) :
import { ClientEchanges } from './client-echanges'
import { ClientDocuments } from './client-documents'

// Remplacer le tableau TABS :
const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'documents', label: 'Documents' },
  { id: 'taches', label: 'Tâches' },
]

// Remplacer le bloc `{activeTab !== 'activite' && activeTab !== 'projets' && (...)}`
// par :
{activeTab === 'echanges' && (
  <ClientEchanges clientId={clientId} />
)}
{activeTab === 'documents' && (
  <ClientDocuments clientId={clientId} />
)}
{activeTab === 'taches' && (
  <p className="text-slate-400 text-sm text-center py-6">
    Voir l&apos;onglet Tâches global
  </p>
)}
```

- [ ] **Step 6 : Vérifier les tests**

```
npx jest src/components/clients/__tests__/client-echanges.test.tsx --no-coverage
```
Expected: PASS — 3 tests

- [ ] **Step 7 : Build TypeScript**

```
npm run build
```
Expected: 0 erreur TypeScript

- [ ] **Step 8 : Commit**

```bash
git add src/components/clients/client-echanges.tsx src/components/clients/client-documents.tsx src/components/clients/__tests__/client-echanges.test.tsx src/components/clients/client-tabs.tsx
git commit -m "feat: ClientTabs — onglets Échanges et Documents fonctionnels"
```

---

## Task 6 : Migration app_settings + Schema Zod + API Paramètres

**Files:**
- Create: `supabase/migrations/003_app_settings.sql`
- Create: `src/lib/validations/parametres.ts`
- Test: `src/lib/validations/__tests__/parametres.test.ts`
- Create: `src/app/api/parametres/route.ts`
- Modify: `src/lib/supabase/types.ts`

- [ ] **Step 1 : Écrire les tests Zod paramètres**

```typescript
// src/lib/validations/__tests__/parametres.test.ts
import { EntrepriseSchema, ParametresClesSchema } from '../parametres'

describe('EntrepriseSchema', () => {
  it('valide les infos entreprise complètes', () => {
    const result = EntrepriseSchema.safeParse({
      entreprise_nom: 'ATEXIA',
      entreprise_adresse: '12 rue des Flamboyants, Saint-Denis',
      entreprise_siret: '12345678901234',
      entreprise_telephone: '0262123456',
      entreprise_email: 'contact@atexia.re',
    })
    expect(result.success).toBe(true)
  })

  it('valide avec champs optionnels vides', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: 'ATEXIA' })
    expect(result.success).toBe(true)
  })

  it('rejette un nom vide', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: '' })
    expect(result.success).toBe(false)
  })

  it('rejette un email invalide', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: 'ATEXIA', entreprise_email: 'pas-un-email' })
    expect(result.success).toBe(false)
  })

  it('rejette un SIRET de mauvaise longueur', () => {
    const result = EntrepriseSchema.safeParse({ entreprise_nom: 'ATEXIA', entreprise_siret: '1234' })
    expect(result.success).toBe(false)
  })
})

describe('ParametresClesSchema', () => {
  it('valide les clés autorisées', () => {
    const result = ParametresClesSchema.safeParse('entreprise_nom')
    expect(result.success).toBe(true)
  })

  it('rejette une clé inconnue', () => {
    const result = ParametresClesSchema.safeParse('clé_inconnue')
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/lib/validations/__tests__/parametres.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter le schema Zod**

```typescript
// src/lib/validations/parametres.ts
import { z } from 'zod'

export const PARAMETRES_CLES = [
  'entreprise_nom',
  'entreprise_adresse',
  'entreprise_siret',
  'entreprise_telephone',
  'entreprise_email',
] as const

export const ParametresClesSchema = z.enum(PARAMETRES_CLES)

export const EntrepriseSchema = z.object({
  entreprise_nom: z.string().min(1, 'Nom requis').max(200),
  entreprise_adresse: z.string().max(500).optional(),
  entreprise_siret: z.string().length(14, 'SIRET = 14 chiffres').regex(/^\d{14}$/, 'SIRET doit être 14 chiffres').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  entreprise_telephone: z.string().max(20).optional(),
  entreprise_email: z.string().email('Email invalide').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
})

export type EntrepriseData = z.infer<typeof EntrepriseSchema>
export type ParametresCle = z.infer<typeof ParametresClesSchema>
```

- [ ] **Step 4 : Vérifier que les tests passent**

```
npx jest src/lib/validations/__tests__/parametres.test.ts --no-coverage
```
Expected: PASS — 5 tests

- [ ] **Step 5 : Appliquer la migration Supabase**

Créer le fichier de migration :

```sql
-- supabase/migrations/003_app_settings.sql
CREATE TABLE IF NOT EXISTS app_settings (
  cle TEXT PRIMARY KEY,
  valeur TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON app_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO app_settings (cle, valeur) VALUES
  ('entreprise_nom', 'ATEXIA'),
  ('entreprise_adresse', NULL),
  ('entreprise_siret', NULL),
  ('entreprise_telephone', NULL),
  ('entreprise_email', NULL)
ON CONFLICT (cle) DO NOTHING;
```

Appliquer via Supabase MCP :
```
mcp__claude_ai_Supabase__apply_migration avec le SQL ci-dessus
```

- [ ] **Step 6 : Ajouter le type AppSettings dans types.ts**

Dans `src/lib/supabase/types.ts`, ajouter dans `Tables` (après `modules_config`) :

```typescript
app_settings: {
  Row: {
    cle: string
    valeur: string | null
    updated_at: string
  }
  Insert: {
    cle: string
    valeur?: string | null
    updated_at?: string
  }
  Update: {
    cle?: string
    valeur?: string | null
    updated_at?: string
  }
  Relationships: []
}
```

Ajouter aussi l'export de type en bas de `types.ts` :
```typescript
export type AppSetting = Database['public']['Tables']['app_settings']['Row']
```

- [ ] **Step 7 : Implémenter l'API route paramètres**

```typescript
// src/app/api/parametres/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EntrepriseSchema, PARAMETRES_CLES } from '@/lib/validations/parametres'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('app_settings')
    .select('cle, valeur')
    .in('cle', PARAMETRES_CLES)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings = Object.fromEntries((data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = EntrepriseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const upserts = Object.entries(parsed.data)
    .filter(([, v]) => v !== undefined)
    .map(([cle, valeur]) => ({ cle, valeur: valeur ?? null, updated_at: new Date().toISOString() }))

  const { error } = await supabase.from('app_settings').upsert(upserts, { onConflict: 'cle' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 8 : Commit**

```bash
git add supabase/migrations/003_app_settings.sql src/lib/validations/parametres.ts src/lib/validations/__tests__/parametres.test.ts src/app/api/parametres/route.ts src/lib/supabase/types.ts
git commit -m "feat: migration app_settings, schemas Zod paramètres, API GET/PUT /api/parametres"
```

---

## Task 7 : Module Paramètres — EntrepriseForm + page /parametres

**Files:**
- Create: `src/components/parametres/entreprise-form.tsx`
- Test: `src/components/parametres/__tests__/entreprise-form.test.tsx`
- Create: `src/app/(app)/parametres/loading.tsx`
- Create: `src/app/(app)/parametres/page.tsx`

- [ ] **Step 1 : Écrire les tests EntrepriseForm**

```typescript
// src/components/parametres/__tests__/entreprise-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EntrepriseForm } from '../entreprise-form'

global.fetch = jest.fn()

const INITIAL = {
  entreprise_nom: 'ATEXIA',
  entreprise_adresse: '12 rue des Flamboyants',
  entreprise_siret: '',
  entreprise_telephone: '0262123456',
  entreprise_email: 'contact@atexia.re',
}

describe('EntrepriseForm', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })
  afterEach(() => jest.clearAllMocks())

  it('affiche les champs pré-remplis', () => {
    render(<EntrepriseForm initial={INITIAL} />)
    expect(screen.getByDisplayValue('ATEXIA')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0262123456')).toBeInTheDocument()
  })

  it('affiche le bouton Enregistrer', () => {
    render(<EntrepriseForm initial={INITIAL} />)
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument()
  })

  it('appelle PUT /api/parametres à la soumission', async () => {
    render(<EntrepriseForm initial={INITIAL} />)
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/parametres', expect.objectContaining({ method: 'PUT' }))
    })
  })

  it('affiche un message de succès après sauvegarde', async () => {
    render(<EntrepriseForm initial={INITIAL} />)
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(await screen.findByText(/enregistré/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/parametres/__tests__/entreprise-form.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter EntrepriseForm**

```typescript
// src/components/parametres/entreprise-form.tsx
'use client'

import { useState } from 'react'
import { EntrepriseSchema, type EntrepriseData } from '@/lib/validations/parametres'

interface EntrepriseFormProps {
  initial: Partial<EntrepriseData>
}

export function EntrepriseForm({ initial }: EntrepriseFormProps) {
  const [nom, setNom] = useState(initial.entreprise_nom ?? '')
  const [adresse, setAdresse] = useState(initial.entreprise_adresse ?? '')
  const [siret, setSiret] = useState(initial.entreprise_siret ?? '')
  const [telephone, setTelephone] = useState(initial.entreprise_telephone ?? '')
  const [email, setEmail] = useState(initial.entreprise_email ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const parsed = EntrepriseSchema.safeParse({
      entreprise_nom: nom,
      entreprise_adresse: adresse || undefined,
      entreprise_siret: siret || undefined,
      entreprise_telephone: telephone || undefined,
      entreprise_email: email || undefined,
    })

    if (!parsed.success) {
      const msgs = Object.values(parsed.error.flatten().fieldErrors).flat()
      setError(msgs[0] ?? 'Données invalides')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Erreur serveur')
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, value: string, onChange: (v: string) => void, rest?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        {...rest}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field('Nom de l\'entreprise *', nom, setNom, { placeholder: 'ATEXIA' })}
      {field('Adresse', adresse, setAdresse, { placeholder: '12 rue des Flamboyants, Saint-Denis' })}
      {field('SIRET', siret, setSiret, { placeholder: '14 chiffres', maxLength: 14 })}
      {field('Téléphone', telephone, setTelephone, { type: 'tel', placeholder: '0262 XX XX XX' })}
      {field('Email', email, setEmail, { type: 'email', placeholder: 'contact@atexia.re' })}

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
      {success && <p className="text-emerald-400 text-sm">Enregistré ✓</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4 : Créer le skeleton de chargement**

```typescript
// src/app/(app)/parametres/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ParametresLoading() {
  return (
    <div className="p-4 space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Créer la page Paramètres**

```typescript
// src/app/(app)/parametres/page.tsx
import { createClient } from '@/lib/supabase/server'
import { EntrepriseForm } from '@/components/parametres/entreprise-form'
import { PARAMETRES_CLES } from '@/lib/validations/parametres'

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('cle, valeur')
    .in('cle', PARAMETRES_CLES)
  return Object.fromEntries((data ?? []).map((r) => [r.cle, r.valeur ?? '']))
}

export default async function ParametresPage() {
  const settings = await getSettings()

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Paramètres</h1>

      <section className="mb-8">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Informations entreprise
        </h2>
        <EntrepriseForm
          initial={{
            entreprise_nom: settings['entreprise_nom'] ?? 'ATEXIA',
            entreprise_adresse: settings['entreprise_adresse'],
            entreprise_siret: settings['entreprise_siret'],
            entreprise_telephone: settings['entreprise_telephone'],
            entreprise_email: settings['entreprise_email'],
          }}
        />
      </section>

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Compte
        </h2>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  )
}
```

Note : La route `POST /api/auth/signout` a été créée dans le Plan 1. Si elle n'existe pas, créer `src/app/api/auth/signout/route.ts` :
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
}
```

- [ ] **Step 6 : Vérifier les tests**

```
npx jest src/components/parametres/__tests__/entreprise-form.test.tsx --no-coverage
```
Expected: PASS — 4 tests

- [ ] **Step 7 : Build TypeScript**

```
npm run build
```
Expected: 0 erreur TypeScript

- [ ] **Step 8 : Commit**

```bash
git add src/components/parametres/ src/app/(app)/parametres/
git commit -m "feat: module Paramètres — EntrepriseForm, page /parametres, déconnexion"
```

---

## Task 8 : PDF — install + templates

**Files:**
- Test: `src/lib/pdf/__tests__/pdf-data.test.ts`
- Create: `src/lib/pdf/rapport-template.tsx`
- Create: `src/lib/pdf/devis-template.tsx`

- [ ] **Step 1 : Installer @react-pdf/renderer**

```bash
npm install @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

Note : si `@types/react-pdf` n'existe pas sur npm, ignorer (les types sont inclus dans `@react-pdf/renderer` v4+).

- [ ] **Step 2 : Écrire les tests de structure de données PDF**

```typescript
// src/lib/pdf/__tests__/pdf-data.test.ts
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
```

- [ ] **Step 3 : Vérifier que le test échoue**

```
npx jest src/lib/pdf/__tests__/pdf-data.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 4 : Créer pdf-data.ts (helpers de construction des données)**

```typescript
// src/lib/pdf/pdf-data.ts

interface ClientLite { nom: string; adresse?: string | null; siret?: string | null }
interface ProjetLite { titre: string; type: string; secteur: string }

export interface RapportData {
  reference: string
  date: string
  client: ClientLite
  projet: ProjetLite
  resume: string
  entreprise: { nom: string; adresse?: string; telephone?: string; email?: string }
}

export interface LigneDevis { description: string; quantite: number; prixUnitaire: number }
export interface DevisData {
  reference: string
  date: string
  client: ClientLite
  projet: ProjetLite
  lignes: (LigneDevis & { total: number })[]
  totalHT: number
  tva: number
  totalTTC: number
  entreprise: { nom: string; adresse?: string; telephone?: string; email?: string }
}

function today(): string {
  return new Date().toLocaleDateString('fr-FR')
}

function ref(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function buildRapportData(params: {
  client: ClientLite
  projet: ProjetLite
  resume: string
  entreprise?: RapportData['entreprise']
}): RapportData {
  return {
    reference: ref('RAP'),
    date: today(),
    client: params.client,
    projet: params.projet,
    resume: params.resume,
    entreprise: params.entreprise ?? { nom: 'ATEXIA' },
  }
}

export function buildDevisData(params: {
  client: ClientLite
  projet: ProjetLite
  lignes: LigneDevis[]
  entreprise?: DevisData['entreprise']
}): DevisData {
  const lignes = params.lignes.map((l) => ({
    ...l,
    total: round2(l.quantite * l.prixUnitaire),
  }))
  const totalHT = round2(lignes.reduce((s, l) => s + l.total, 0))
  const tva = round2(totalHT * 0.2)
  const totalTTC = round2(totalHT + tva)

  return {
    reference: ref('DEV'),
    date: today(),
    client: params.client,
    projet: params.projet,
    lignes,
    totalHT,
    tva,
    totalTTC,
    entreprise: params.entreprise ?? { nom: 'ATEXIA' },
  }
}
```

- [ ] **Step 5 : Vérifier que les tests passent**

```
npx jest src/lib/pdf/__tests__/pdf-data.test.ts --no-coverage
```
Expected: PASS — 3 tests

- [ ] **Step 6 : Créer le template PDF Rapport**

```typescript
// src/lib/pdf/rapport-template.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { RapportData } from './pdf-data'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0284c7' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  ref: { fontSize: 9, color: '#94a3b8', textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0284c7', borderBottom: '1pt solid #e2e8f0', paddingBottom: 4, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: '#64748b' },
  value: { flex: 1, color: '#1e293b' },
  resumeBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 4, lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 8 },
})

interface Props { data: RapportData }

export function RapportTemplate({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>Rapport d&apos;intervention</Text>
          </View>
          <View>
            <Text style={styles.ref}>Réf. {data.reference}</Text>
            <Text style={styles.ref}>Date : {data.date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}><Text style={styles.label}>Nom</Text><Text style={styles.value}>{data.client.nom}</Text></View>
          {data.client.adresse && (
            <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text style={styles.value}>{data.client.adresse}</Text></View>
          )}
          {data.client.siret && (
            <View style={styles.row}><Text style={styles.label}>SIRET</Text><Text style={styles.value}>{data.client.siret}</Text></View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chantier</Text>
          <View style={styles.row}><Text style={styles.label}>Projet</Text><Text style={styles.value}>{data.projet.titre}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Type</Text><Text style={styles.value}>{data.projet.type}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Domaine</Text><Text style={styles.value}>{data.projet.secteur.replace(/_/g, ' ')}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte-rendu d&apos;intervention</Text>
          <View style={styles.resumeBox}>
            <Text>{data.resume}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {data.entreprise.nom} — {data.entreprise.adresse ?? ''} — {data.entreprise.telephone ?? ''} — {data.entreprise.email ?? ''}
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 7 : Créer le template PDF Devis**

```typescript
// src/lib/pdf/devis-template.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DevisData } from './pdf-data'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0284c7' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  ref: { fontSize: 9, color: '#94a3b8', textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0284c7', borderBottom: '1pt solid #e2e8f0', paddingBottom: 4, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: '#64748b' },
  value: { flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0284c7', padding: '6pt', borderRadius: 2, marginBottom: 4 },
  tableHeaderText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', padding: '5pt', borderBottom: '0.5pt solid #e2e8f0' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPU: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 180, justifyContent: 'space-between', marginBottom: 3 },
  totalTTC: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#0284c7' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 8 },
})

function eur(n: number): string {
  return `${n.toFixed(2)} €`
}

interface Props { data: DevisData }

export function DevisTemplate({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>Devis</Text>
          </View>
          <View>
            <Text style={styles.ref}>Réf. {data.reference}</Text>
            <Text style={styles.ref}>Date : {data.date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}><Text style={styles.label}>Nom</Text><Text style={styles.value}>{data.client.nom}</Text></View>
          {data.client.adresse && (
            <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text style={styles.value}>{data.client.adresse}</Text></View>
          )}
          {data.client.siret && (
            <View style={styles.row}><Text style={styles.label}>SIRET</Text><Text style={styles.value}>{data.client.siret}</Text></View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet : {data.projet.titre}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {data.lignes.map((ligne, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{ligne.description}</Text>
              <Text style={styles.colQty}>{ligne.quantite}</Text>
              <Text style={styles.colPU}>{eur(ligne.prixUnitaire)}</Text>
              <Text style={styles.colTotal}>{eur(ligne.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}><Text style={{ color: '#64748b' }}>Total HT</Text><Text>{eur(data.totalHT)}</Text></View>
          <View style={styles.totalRow}><Text style={{ color: '#64748b' }}>TVA 20%</Text><Text>{eur(data.tva)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalTTC}>Total TTC</Text><Text style={styles.totalTTC}>{eur(data.totalTTC)}</Text></View>
        </View>

        <Text style={styles.footer}>
          {data.entreprise.nom} — {data.entreprise.adresse ?? ''} — {data.entreprise.telephone ?? ''} — {data.entreprise.email ?? ''}
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 8 : Vérifier le build**

```
npm run build
```
Expected: 0 erreur TypeScript. Si @react-pdf/renderer génère un warning ESM, ajouter dans `next.config.js` :
```js
transpilePackages: ['@react-pdf/renderer'],
```

- [ ] **Step 9 : Commit**

```bash
git add src/lib/pdf/ 
git commit -m "feat: templates PDF React (@react-pdf/renderer) — rapport + devis"
```

---

## Task 9 : API génération PDF + PdfGenerateButton

**Files:**
- Create: `src/app/api/documents/generate-pdf/route.ts`
- Create: `src/components/documents/pdf-generate-button.tsx`
- Test: `src/components/documents/__tests__/pdf-generate-button.test.tsx`

- [ ] **Step 1 : Écrire les tests PdfGenerateButton**

```typescript
// src/components/documents/__tests__/pdf-generate-button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PdfGenerateButton } from '../pdf-generate-button'

global.fetch = jest.fn()

describe('PdfGenerateButton', () => {
  afterEach(() => jest.clearAllMocks())

  it('affiche le bouton avec le label du type', () => {
    render(<PdfGenerateButton type="rapport" projetId="p1" clientId="c1" />)
    expect(screen.getByRole('button', { name: /rapport/i })).toBeInTheDocument()
  })

  it('appelle l\'API à la génération', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['pdf'], { type: 'application/pdf' }),
    })
    render(<PdfGenerateButton type="rapport" projetId="p1" clientId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: /rapport/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/generate-pdf'),
        expect.anything()
      )
    })
  })

  it('affiche une erreur si l\'API échoue', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Données manquantes' }),
    })
    render(<PdfGenerateButton type="rapport" projetId="p1" clientId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: /rapport/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/documents/__tests__/pdf-generate-button.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter l'API route generate-pdf**

```typescript
// src/app/api/documents/generate-pdf/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { RapportTemplate } from '@/lib/pdf/rapport-template'
import { DevisTemplate } from '@/lib/pdf/devis-template'
import { buildRapportData, buildDevisData, type LigneDevis } from '@/lib/pdf/pdf-data'
import { z } from 'zod'
import React from 'react'

const GeneratePdfSchema = z.object({
  type: z.enum(['rapport', 'devis']),
  projet_id: z.string().uuid(),
  client_id: z.string().uuid(),
  resume: z.string().max(5000).optional(),
  lignes: z.array(z.object({
    description: z.string(),
    quantite: z.number().positive(),
    prixUnitaire: z.number().nonnegative(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = GeneratePdfSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, projet_id, client_id, resume, lignes } = parsed.data

  const [clientRes, projetRes, settingsRes] = await Promise.all([
    supabase.from('clients').select('nom, adresse, siret').eq('id', client_id).single(),
    supabase.from('projets').select('titre, type, secteur').eq('id', projet_id).single(),
    supabase.from('app_settings').select('cle, valeur').in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email']),
  ])

  if (clientRes.error || projetRes.error) {
    return NextResponse.json({ error: 'Client ou projet introuvable' }, { status: 404 })
  }

  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const entreprise = {
    nom: settings['entreprise_nom'] ?? 'ATEXIA',
    adresse: settings['entreprise_adresse'],
    telephone: settings['entreprise_telephone'],
    email: settings['entreprise_email'],
  }

  let pdfBuffer: Buffer
  let nomFichier: string

  if (type === 'rapport') {
    const data = buildRapportData({
      client: clientRes.data,
      projet: projetRes.data,
      resume: resume ?? '—',
      entreprise,
    })
    pdfBuffer = await renderToBuffer(React.createElement(RapportTemplate, { data }))
    nomFichier = `rapport-${data.reference}.pdf`
  } else {
    const data = buildDevisData({
      client: clientRes.data,
      projet: projetRes.data,
      lignes: (lignes ?? []) as LigneDevis[],
      entreprise,
    })
    pdfBuffer = await renderToBuffer(React.createElement(DevisTemplate, { data }))
    nomFichier = `devis-${data.reference}.pdf`
  }

  const storagePath = `documents/${user.id}/${nomFichier}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Erreur upload Storage' }, { status: 500 })
  }

  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert({
      client_id,
      projet_id,
      type,
      nom: nomFichier,
      storage_path: storagePath,
      taille_octets: pdfBuffer.length,
      genere_par_app: true,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json(doc, { status: 201 })
}
```

- [ ] **Step 4 : Implémenter PdfGenerateButton**

```typescript
// src/components/documents/pdf-generate-button.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PdfType = 'rapport' | 'devis'

const TYPE_LABEL: Record<PdfType, string> = {
  rapport: 'Rapport d\'intervention',
  devis: 'Devis',
}

interface PdfGenerateButtonProps {
  type: PdfType
  projetId: string
  clientId: string
  resume?: string
}

export function PdfGenerateButton({ type, projetId, clientId, resume }: PdfGenerateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/documents/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, projet_id: projetId, client_id: clientId, resume }),
    }).catch(() => null)

    if (!res || !res.ok) {
      const json = await res?.json().catch(() => ({}))
      setError(json?.error ?? 'Erreur génération PDF')
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg hover:bg-sky-500/30 transition-colors disabled:opacity-50"
      >
        {loading ? '⏳' : '📄'} {TYPE_LABEL[type]}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1" role="alert">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier les tests**

```
npx jest src/components/documents/__tests__/pdf-generate-button.test.tsx --no-coverage
```
Expected: PASS — 3 tests

- [ ] **Step 6 : Vérifier que le bucket Supabase Storage existe**

Dans Supabase Dashboard → Storage, créer le bucket `documents` si absent :
- Name: `documents`
- Public: false (accès via signed URL uniquement)

Ou via MCP :
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 7 : Tester les routes en production (optionnel)**

```
npm run build && npm run start
```
Naviguer vers un projet, tester la génération d'un rapport.

- [ ] **Step 8 : Commit**

```bash
git add src/app/api/documents/generate-pdf/ src/components/documents/
git commit -m "feat: génération PDF (rapport + devis) — API route + PdfGenerateButton"
```

---

## Task 10 : Offline graceful + finalisation

**Files:**
- Create: `src/components/ui/offline-message.tsx`
- Test: `src/components/ui/__tests__/offline-message.test.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1 : Écrire les tests OfflineMessage**

```typescript
// src/components/ui/__tests__/offline-message.test.tsx
import { render, screen, act } from '@testing-library/react'
import { OfflineMessage } from '../offline-message'

describe('OfflineMessage', () => {
  const originalNavigator = { ...navigator }

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('n\'affiche rien quand en ligne', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    render(<OfflineMessage />)
    expect(screen.queryByText(/hors ligne/i)).not.toBeInTheDocument()
  })

  it('affiche le bandeau quand hors ligne', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    render(<OfflineMessage />)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(/hors ligne/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```
npx jest src/components/ui/__tests__/offline-message.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3 : Implémenter OfflineMessage**

```typescript
// src/components/ui/offline-message.tsx
'use client'

import { useEffect, useState } from 'react'

export function OfflineMessage() {
  const [offline, setOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-sm py-2 px-4">
      📵 Vous êtes hors ligne — certaines données peuvent ne pas être à jour
    </div>
  )
}
```

- [ ] **Step 4 : Ajouter OfflineMessage dans le layout app**

Dans `src/app/(app)/layout.tsx`, ajouter l'import et le composant juste avant le contenu principal :

```typescript
// Ajouter l'import :
import { OfflineMessage } from '@/components/ui/offline-message'

// Ajouter dans le JSX, juste avant {children} :
<OfflineMessage />
```

- [ ] **Step 5 : Vérifier les tests**

```
npx jest src/components/ui/__tests__/offline-message.test.tsx --no-coverage
```
Expected: PASS — 2 tests

- [ ] **Step 6 : Suite de tests complète**

```
npx jest --no-coverage
```
Expected: tous les tests passent (objectif ≥ 85 tests)

- [ ] **Step 7 : Build production final**

```
npm run build
```
Expected: 0 erreur TypeScript, 0 erreur de build

- [ ] **Step 8 : Commit final**

```bash
git add src/components/ui/offline-message.tsx src/components/ui/__tests__/offline-message.test.tsx src/app/(app)/layout.tsx
git commit -m "feat: OfflineMessage + finalisation Plan 6 — dashboard, Plus, paramètres, PDF"
```

---

## Vérification spec vs plan

| Spécification | Couvert |
|---|---|
| §5.1 Tableau de bord — 4 KPIs | ✅ Task 1-3 |
| §5.1 Tâches du jour, projets récents | ✅ Task 3 |
| §5.5 Fiche projet — sous-onglets (échanges via ProjetTabs existant) | ✅ Plan 3 (déjà fait) |
| §5.3 Fiche client — sous-onglets Échanges + Documents | ✅ Task 5 |
| §5.9 Paramètres — infos entreprise, compte | ✅ Tasks 6-7 |
| §7 Génération PDF — devis + rapport | ✅ Tasks 8-9 |
| §9 Offline graceful — message clair si pas de réseau | ✅ Task 10 |
| Navigation onglet Plus | ✅ Task 4 |

---

## Variables d'environnement

Aucune nouvelle variable d'environnement requise — les existantes suffisent.

Le bucket Supabase Storage `documents` doit exister (voir Task 9, Step 6).
