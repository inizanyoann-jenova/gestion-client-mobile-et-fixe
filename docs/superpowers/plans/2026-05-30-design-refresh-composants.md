# Design Refresh — Composants transversaux ATEXIA CRM

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer la direction "Identité ATEXIA" aux 6 composants transversaux : navigation SVG, badges pill, cards avec bordure colorée, KPIs restyled, header gradient, headers de fiche restyled.

**Architecture:** Modifications CSS/JSX uniquement sur des composants existants. Aucune nouvelle dépendance npm. Les icônes SVG Lucide sont inline dans le JSX. Les classes Tailwind restent purement utilitaires.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, Jest + Testing Library

---

## Structure des fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/ui/__tests__/badge.test.tsx` | Mettre à jour les assertions de classes |
| `src/components/ui/badge.tsx` | Pill arrondi, couleurs translucides |
| `src/components/layout/bottom-nav.tsx` | SVG icons, blur, dot indicateur |
| `src/components/dashboard/dashboard-kpis.tsx` | border-l-4, fond sombre |
| `src/app/(app)/page.tsx` | Header gradient brand |
| `src/components/clients/client-card.tsx` | border-l-4 par statut, feedback tactile |
| `src/components/projets/projet-card.tsx` | border-l-4 par statut, feedback tactile |
| `src/components/taches/tache-card.tsx` | border-l-4 par priorité |
| `src/components/echanges/echange-card.tsx` | border-l-4 par type |
| `src/components/documents/document-card.tsx` | border-l-4 sky |
| `src/components/clients/client-header.tsx` | Bandeau gradient, flèche SVG |
| `src/components/projets/projet-header.tsx` | Bandeau gradient, flèche SVG |

---

## Task 1: Badge — pill translucide

**Files:**
- Modify: `src/components/ui/__tests__/badge.test.tsx`
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1 : Mettre à jour les tests pour les nouvelles classes**

Les tests actuels vérifient `bg-emerald-500`, `bg-red-500`, `bg-amber-500` qui vont disparaître. On les met à jour pour exprimer le nouveau contrat (texte coloré, fond translucide).

```tsx
// src/components/ui/__tests__/badge.test.tsx
import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  it('affiche le label', () => {
    render(<Badge label="En cours" variant="info" />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('applique la classe success', () => {
    render(<Badge label="Terminé" variant="success" />)
    expect(screen.getByText('Terminé')).toHaveClass('text-emerald-300')
  })

  it('applique la classe danger', () => {
    render(<Badge label="SAV" variant="danger" />)
    expect(screen.getByText('SAV')).toHaveClass('text-red-300')
  })

  it('applique la classe warning', () => {
    render(<Badge label="En étude" variant="warning" />)
    expect(screen.getByText('En étude')).toHaveClass('text-amber-300')
  })

  it('a la forme pill (rounded-full)', () => {
    render(<Badge label="Test" variant="info" />)
    expect(screen.getByText('Test')).toHaveClass('rounded-full')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npm test -- --testPathPattern=badge --no-coverage
```

Expected : FAIL — `Expected element to have class: text-emerald-300` (l'implémentation utilise encore les anciennes classes)

- [ ] **Step 3 : Mettre à jour le composant Badge**

```tsx
// src/components/ui/badge.tsx
type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  info: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
  success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
  danger: 'bg-red-500/10 text-red-300 border border-red-500/30',
  neutral: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
}

interface BadgeProps {
  label: string
  variant: BadgeVariant
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npm test -- --testPathPattern=badge --no-coverage
```

Expected : PASS — 5 tests

- [ ] **Step 5 : Commit**

```bash
git add src/components/ui/badge.tsx src/components/ui/__tests__/badge.test.tsx
git commit -m "feat(design): badge pill translucide avec bordure colorée"
```

---

## Task 2: BottomNav — icônes SVG Lucide

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx`

- [ ] **Step 1 : Vérifier que les tests existants passent (avant modification)**

```bash
npm test -- --testPathPattern=bottom-nav --no-coverage
```

Expected : PASS — 3 tests

- [ ] **Step 2 : Remplacer le composant**

```tsx
// src/components/layout/bottom-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/projets',
    label: 'Projets',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    href: '/taches',
    label: 'Tâches',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: '/plus',
    label: 'Plus',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t-2 border-sky-500 z-50 md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors duration-150 min-w-[44px] min-h-[44px] justify-center ${
                isActive ? 'text-sky-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {icon}
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-sky-400" aria-hidden="true" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3 : Vérifier que les tests passent toujours**

```bash
npm test -- --testPathPattern=bottom-nav --no-coverage
```

Expected : PASS — 3 tests (les tests vérifient les labels texte et `text-sky-400` sur l'actif, tous conservés)

- [ ] **Step 4 : Commit**

```bash
git add src/components/layout/bottom-nav.tsx
git commit -m "feat(design): bottom-nav icônes SVG Lucide + dot indicateur + blur"
```

---

## Task 3: DashboardKpis — border-l-4 fond sombre

**Files:**
- Modify: `src/components/dashboard/dashboard-kpis.tsx`

- [ ] **Step 1 : Vérifier que les tests existants passent**

```bash
npm test -- --testPathPattern=dashboard-kpis --no-coverage
```

Expected : PASS — 3 tests

- [ ] **Step 2 : Mettre à jour le composant**

```tsx
// src/components/dashboard/dashboard-kpis.tsx
import type { DashboardKpis as DashboardKpisType } from '@/lib/validations/dashboard'

interface KpiCardProps {
  label: string
  value: number
  icon: string
  borderClass: string
}

function KpiCard({ label, value, icon, borderClass }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 bg-slate-900 border border-slate-800 border-l-4 ${borderClass}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

interface DashboardKpisProps {
  kpis: DashboardKpisType
}

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard label="Clients actifs" value={kpis.clients_actifs} icon="🏢" borderClass="border-l-sky-500" />
      <KpiCard label="Projets en cours" value={kpis.projets_en_cours} icon="🔧" borderClass="border-l-violet-500" />
      <KpiCard label="Tâches urgentes" value={kpis.taches_urgentes} icon="⚡" borderClass="border-l-red-500" />
      <KpiCard label="Devis" value={kpis.documents_devis} icon="📄" borderClass="border-l-amber-500" />
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier que les tests passent**

```bash
npm test -- --testPathPattern=dashboard-kpis --no-coverage
```

Expected : PASS — 3 tests

- [ ] **Step 4 : Commit**

```bash
git add src/components/dashboard/dashboard-kpis.tsx
git commit -m "feat(design): dashboard KPIs border-l-4 coloré fond sombre"
```

---

## Task 4: Dashboard header — carte gradient brand

**Files:**
- Modify: `src/app/(app)/page.tsx` (uniquement le bloc header, lignes 92-96)

- [ ] **Step 1 : Remplacer le header brut par la carte gradient**

Dans `src/app/(app)/page.tsx`, remplacer :

```tsx
// AVANT — à supprimer
<div className="mb-6">
  <p className="text-slate-400 text-sm">Bonjour 👋</p>
  <h1 className="text-xl font-bold text-white">ATEXIA</h1>
</div>
```

par :

```tsx
// APRÈS
<div className="bg-gradient-to-r from-sky-900 to-sky-700 rounded-2xl p-4 mb-6 flex justify-between items-center">
  <div>
    <p className="text-sky-200 text-xs">Bonjour 👋</p>
    <h1 className="text-white text-xl font-bold">ATEXIA CRM</h1>
  </div>
  <span className="text-white/80 text-2xl font-black tracking-tighter" aria-hidden="true">AX</span>
</div>
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Expected : aucune erreur

- [ ] **Step 3 : Commit**

```bash
git add "src/app/(app)/page.tsx"
git commit -m "feat(design): dashboard header carte gradient brand ATEXIA"
```

---

## Task 5: ClientCard + ProjetCard — border-l-4 par statut

**Files:**
- Modify: `src/components/clients/client-card.tsx`
- Modify: `src/components/projets/projet-card.tsx`

- [ ] **Step 1 : Vérifier que les tests existants passent**

```bash
npm test -- --testPathPattern="client-card|projet-card" --no-coverage
```

Expected : PASS

- [ ] **Step 2 : Mettre à jour ClientCard**

```tsx
// src/components/clients/client-card.tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Client, Secteur, StatutClient } from '@/lib/supabase/types'

const STATUT_VARIANT: Record<StatutClient, 'success' | 'info' | 'neutral'> = {
  actif: 'success',
  prospect: 'info',
  inactif: 'neutral',
}

const STATUT_LABEL: Record<StatutClient, string> = {
  actif: 'Actif',
  prospect: 'Prospect',
  inactif: 'Inactif',
}

const STATUT_BORDER: Record<StatutClient, string> = {
  actif: 'border-l-sky-500',
  prospect: 'border-l-violet-500',
  inactif: 'border-l-slate-600',
}

const SECTEUR_ICON: Record<Secteur, string> = {
  courants_forts: '⚡',
  courants_faibles: '📡',
  photovoltaique: '☀️',
  mixte: '🔧',
}

const SECTEUR_LABEL: Record<Secteur, string> = {
  courants_forts: 'Courants forts',
  courants_faibles: 'Courants faibles',
  photovoltaique: 'Photovoltaïque',
  mixte: 'Mixte',
}

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className={`block bg-slate-900 border border-slate-800 border-l-4 ${STATUT_BORDER[client.statut]} rounded-xl p-4 active:scale-[0.98] transition-transform duration-150 hover:border-slate-700`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{client.nom}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {SECTEUR_ICON[client.secteur]} {SECTEUR_LABEL[client.secteur]}
          </p>
        </div>
        <Badge label={STATUT_LABEL[client.statut]} variant={STATUT_VARIANT[client.statut]} />
      </div>
      <p className="text-slate-500 text-xs mt-2">
        Client depuis{' '}
        {new Date(client.created_at).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        })}
      </p>
    </Link>
  )
}
```

- [ ] **Step 3 : Mettre à jour ProjetCard**

```tsx
// src/components/projets/projet-card.tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import type { Projet, StatutProjet, SecteurProjet } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }

const STATUT_LABEL: Record<StatutProjet, string> = {
  en_etude: 'En étude',
  en_cours: 'En cours',
  termine: 'Terminé',
  sav: 'SAV',
}

const STATUT_VARIANT: Record<StatutProjet, 'info' | 'warning' | 'success' | 'danger'> = {
  en_etude: 'info',
  en_cours: 'warning',
  termine: 'success',
  sav: 'danger',
}

const STATUT_BORDER: Record<StatutProjet, string> = {
  en_etude: 'border-l-violet-500',
  en_cours: 'border-l-sky-500',
  termine: 'border-l-slate-600',
  sav: 'border-l-red-500',
}

const SECTEUR_ICON: Record<SecteurProjet, string> = {
  courants_forts: '⚡',
  courants_faibles: '📡',
  photovoltaique: '☀️',
}

interface ProjetCardProps {
  projet: ProjetAvecClient
}

export function ProjetCard({ projet }: ProjetCardProps) {
  const isSav = projet.statut === 'sav'

  return (
    <Link
      href={`/projets/${projet.id}`}
      className={`block bg-slate-900 border border-slate-800 border-l-4 ${STATUT_BORDER[projet.statut]} rounded-xl p-4 active:scale-[0.98] transition-transform duration-150 hover:border-slate-700`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{projet.titre}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            <span aria-hidden="true">{SECTEUR_ICON[projet.secteur]} </span>
            <span>{projet.client.nom}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            label={STATUT_LABEL[projet.statut]}
            variant={STATUT_VARIANT[projet.statut]}
          />
          {isSav && (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Avancement</span>
          <span>{projet.avancement}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: `${projet.avancement}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        {projet.montant_devis ? (
          <span>{formatCurrency(projet.montant_devis)}</span>
        ) : (
          <span>Montant non renseigné</span>
        )}
        {projet.date_fin_estimee && (
          <span>
            Fin{' '}
            {new Date(projet.date_fin_estimee).toLocaleDateString('fr-FR', {
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npm test -- --testPathPattern="client-card|projet-card" --no-coverage
```

Expected : PASS

- [ ] **Step 5 : Commit**

```bash
git add src/components/clients/client-card.tsx src/components/projets/projet-card.tsx
git commit -m "feat(design): client-card et projet-card border-l-4 par statut"
```

---

## Task 6: TacheCard — border-l-4 par priorité

**Files:**
- Modify: `src/components/taches/tache-card.tsx`

- [ ] **Step 1 : Vérifier que les tests existants passent**

```bash
npm test -- --testPathPattern=tache-card --no-coverage
```

Expected : PASS

- [ ] **Step 2 : Mettre à jour le wrapper div de TacheCard**

Dans `src/components/taches/tache-card.tsx`, ajouter le mapping de bordure et remplacer uniquement la className du `div` wrapper :

Ajouter après `PRIORITE_LABELS` :

```tsx
const PRIORITE_BORDER: Record<string, string> = {
  haute: 'border-l-red-500',
  normale: 'border-l-amber-500',
  basse: 'border-l-slate-600',
}
```

Remplacer la className du `div` wrapper (ligne 68) :

```tsx
// AVANT
<div
  className={`bg-slate-800 rounded-xl p-4 flex gap-3 items-start transition-opacity${checked ? ' opacity-50' : ''}`}
>

// APRÈS
<div
  className={`bg-slate-900 border border-slate-800 border-l-4 ${PRIORITE_BORDER[tache.priorite] ?? 'border-l-slate-600'} rounded-xl p-4 flex gap-3 items-start transition-opacity${checked ? ' opacity-50' : ''}`}
>
```

- [ ] **Step 3 : Vérifier que les tests passent**

```bash
npm test -- --testPathPattern=tache-card --no-coverage
```

Expected : PASS

- [ ] **Step 4 : Commit**

```bash
git add src/components/taches/tache-card.tsx
git commit -m "feat(design): tache-card border-l-4 par priorité"
```

---

## Task 7: EchangeCard — border-l-4 par type

**Files:**
- Modify: `src/components/echanges/echange-card.tsx`

- [ ] **Step 1 : Vérifier que les tests existants passent**

```bash
npm test -- --testPathPattern=echange-card --no-coverage
```

Expected : PASS

- [ ] **Step 2 : Ajouter le mapping de bordure et mettre à jour le wrapper**

Dans `src/components/echanges/echange-card.tsx`, ajouter après `TYPE_COLOR` :

```tsx
const TYPE_BORDER: Record<TypeInteraction, string> = {
  appel: 'border-l-sky-500',
  email: 'border-l-violet-500',
  visite: 'border-l-emerald-500',
  reunion: 'border-l-amber-500',
  autre: 'border-l-slate-600',
}
```

Remplacer la className du `div` wrapper (ligne 67) :

```tsx
// AVANT
<div className="bg-slate-800 rounded-xl p-3 space-y-2">

// APRÈS
<div className={`bg-slate-900 border border-slate-800 border-l-4 ${TYPE_BORDER[interaction.type]} rounded-xl p-3 space-y-2`}>
```

- [ ] **Step 3 : Vérifier que les tests passent**

```bash
npm test -- --testPathPattern=echange-card --no-coverage
```

Expected : PASS

- [ ] **Step 4 : Commit**

```bash
git add src/components/echanges/echange-card.tsx
git commit -m "feat(design): echange-card border-l-4 par type d'échange"
```

---

## Task 8: DocumentCard — border-l-4 sky

**Files:**
- Modify: `src/components/documents/document-card.tsx`

- [ ] **Step 1 : Vérifier que les tests existants passent**

```bash
npm test -- --testPathPattern=document-card --no-coverage
```

Expected : PASS

- [ ] **Step 2 : Mettre à jour le wrapper div**

Dans `src/components/documents/document-card.tsx`, remplacer la className du `div` wrapper (ligne 67) :

```tsx
// AVANT
<div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">

// APRÈS
<div className="bg-slate-900 border border-slate-800 border-l-4 border-l-sky-500 rounded-xl p-3 flex items-center gap-3">
```

- [ ] **Step 3 : Vérifier que les tests passent**

```bash
npm test -- --testPathPattern=document-card --no-coverage
```

Expected : PASS

- [ ] **Step 4 : Commit**

```bash
git add src/components/documents/document-card.tsx
git commit -m "feat(design): document-card border-l-4 sky"
```

---

## Task 9: ClientHeader + ProjetHeader — bandeau gradient

**Files:**
- Modify: `src/components/clients/client-header.tsx`
- Modify: `src/components/projets/projet-header.tsx`

- [ ] **Step 1 : Mettre à jour ClientHeader**

```tsx
// src/components/clients/client-header.tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ClientForm } from './client-form'
import { DeleteClientButton } from './delete-client-button'
import type { Client, Secteur, StatutClient } from '@/lib/supabase/types'

const SECTEUR_ICON: Record<Secteur, string> = {
  courants_forts: '⚡',
  courants_faibles: '📡',
  photovoltaique: '☀️',
  mixte: '🔧',
}

const SECTEUR_LABEL: Record<Secteur, string> = {
  courants_forts: 'Courants forts',
  courants_faibles: 'Courants faibles',
  photovoltaique: 'Photovoltaïque',
  mixte: 'Mixte',
}

const STATUT_VARIANT: Record<StatutClient, 'success' | 'info' | 'neutral'> = {
  actif: 'success',
  prospect: 'info',
  inactif: 'neutral',
}

const STATUT_LABEL: Record<StatutClient, string> = {
  actif: 'Actif',
  prospect: 'Prospect',
  inactif: 'Inactif',
}

interface ClientHeaderProps {
  client: Client
}

export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-sky-950 to-slate-900 border-b border-sky-800/50 px-4 pt-4 pb-5">
      <Link href="/clients" className="flex items-center gap-1 text-sky-400 text-sm mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Clients
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight">{client.nom}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {SECTEUR_ICON[client.secteur]} {SECTEUR_LABEL[client.secteur]}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {client.adresse ?? 'Adresse non renseignée'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge
            label={STATUT_LABEL[client.statut]}
            variant={STATUT_VARIANT[client.statut]}
          />
          <ClientForm mode="edit" client={client} />
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Mettre à jour ProjetHeader**

```tsx
// src/components/projets/projet-header.tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ProjetForm } from './projet-form'
import { DeleteProjetButton } from './delete-projet-button'
import type { Projet, StatutProjet, SecteurProjet, TypeProjet } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }

const STATUT_LABEL: Record<StatutProjet, string> = {
  en_etude: 'En étude',
  en_cours: 'En cours',
  termine: 'Terminé',
  sav: 'SAV',
}

const STATUT_VARIANT: Record<StatutProjet, 'info' | 'warning' | 'success' | 'danger'> = {
  en_etude: 'info',
  en_cours: 'warning',
  termine: 'success',
  sav: 'danger',
}

const SECTEUR_ICON: Record<SecteurProjet, string> = {
  courants_forts: '⚡',
  courants_faibles: '📡',
  photovoltaique: '☀️',
}

const TYPE_LABEL: Record<TypeProjet, string> = {
  installation: 'Installation',
  etude: 'Étude',
  maintenance: 'Maintenance',
  sav: 'SAV',
}

interface ProjetHeaderProps {
  projet: ProjetAvecClient
}

export function ProjetHeader({ projet }: ProjetHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-sky-950 to-slate-900 border-b border-sky-800/50 px-4 pt-4 pb-5">
      <Link href="/projets" className="flex items-center gap-1 text-sky-400 text-sm mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Projets
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight">{projet.titre}</h1>
          <Link
            href={`/clients/${projet.client.id}`}
            className="text-sky-400 text-sm mt-1 block"
          >
            {projet.client.nom} →
          </Link>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge label={STATUT_LABEL[projet.statut]} variant={STATUT_VARIANT[projet.statut]} />
            <span className="text-slate-400 text-xs">
              {SECTEUR_ICON[projet.secteur]}
            </span>
            <span className="text-slate-400 text-xs">{TYPE_LABEL[projet.type]}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ProjetForm mode="edit" projet={projet} />
          <DeleteProjetButton projetId={projet.id} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Expected : aucune erreur

- [ ] **Step 4 : Commit**

```bash
git add src/components/clients/client-header.tsx src/components/projets/projet-header.tsx
git commit -m "feat(design): client-header et projet-header bandeau gradient brand"
```

---

## Task 10: Vérification finale — build complet

**Files:** aucun fichier modifié dans cette tâche

- [ ] **Step 1 : Lancer la suite complète de tests**

```bash
npm test -- --no-coverage
```

Expected : PASS — tous les tests (le total était ~100+ avant ce plan, tous doivent passer)

- [ ] **Step 2 : Vérifier le build de production**

```bash
npm run build
```

Expected : Build réussi, aucune erreur TypeScript ni erreur Next.js

- [ ] **Step 3 : Commit final si des fichiers traînent**

```bash
git status
```

Si tout est clean, le plan est terminé. Si des fichiers non commités restent, les ajouter et commiter.
