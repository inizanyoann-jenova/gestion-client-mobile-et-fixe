# Guide utilisateur dans Paramètres — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un onglet "Guide" dans la page Paramètres avec démarrage rapide + référence des 6 modules, 100 % statique, accessible via `?tab=guide`.

**Architecture:** La page `/parametres` reçoit `searchParams` (Next.js 16, Promise), lit `tab`, et affiche soit le contenu existant soit `GuideUtilisateur`. La barre d'onglets est un client component (`ParametresTabs`) qui utilise des `Link` vers `?tab=parametres` et `?tab=guide`. Le guide est un server component purement statique, sans BDD.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS, Jest + @testing-library/react

---

## Structure des fichiers

| Action | Fichier |
|---|---|
| Créer | `src/components/parametres/guide-utilisateur.tsx` |
| Créer | `src/components/parametres/parametres-tabs.tsx` |
| Créer | `src/components/parametres/__tests__/guide-utilisateur.test.tsx` |
| Créer | `src/components/parametres/__tests__/parametres-tabs.test.tsx` |
| Modifier | `src/app/(app)/parametres/page.tsx` |

---

## Task 1 — Composant GuideUtilisateur (statique)

**Files:**
- Create: `src/components/parametres/guide-utilisateur.tsx`
- Test: `src/components/parametres/__tests__/guide-utilisateur.test.tsx`

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `src/components/parametres/__tests__/guide-utilisateur.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import { GuideUtilisateur } from '../guide-utilisateur'

describe('GuideUtilisateur', () => {
  it('affiche le titre Démarrage rapide', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText(/démarrage rapide/i)).toBeInTheDocument()
  })

  it('affiche les 5 étapes numérotées', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('affiche le titre Référence des modules', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText(/référence des modules/i)).toBeInTheDocument()
  })

  it('affiche les 6 titres de modules', () => {
    render(<GuideUtilisateur />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Clients & Contacts')).toBeInTheDocument()
    expect(screen.getByText('Projets & Chantiers')).toBeInTheDocument()
    expect(screen.getByText('Tâches & Rappels')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Échanges')).toBeInTheDocument()
  })

  it('affiche la section Astuce pour chaque module', () => {
    render(<GuideUtilisateur />)
    const astuces = screen.getAllByText(/astuce/i)
    expect(astuces.length).toBe(6)
  })
})
```

- [ ] **Étape 2 : Lancer le test — vérifier qu'il échoue**

```bash
npx jest guide-utilisateur.test --no-coverage
```

Résultat attendu : FAIL — `Cannot find module '../guide-utilisateur'`

- [ ] **Étape 3 : Créer le composant**

Créer `src/components/parametres/guide-utilisateur.tsx` :

```tsx
const ETAPES = [
  { num: 1, label: 'Configurer les informations entreprise', detail: 'Onglet Paramètres → Informations entreprise' },
  { num: 2, label: 'Créer le premier client', detail: 'Module Clients → bouton +' },
  { num: 3, label: 'Créer un projet lié à ce client', detail: 'Module Projets → bouton +' },
  { num: 4, label: 'Créer une tâche avec rappel', detail: 'Module Tâches → bouton +' },
  { num: 5, label: 'Activer les notifications push', detail: 'Module Plus → Paramètres → Notifications' },
]

const MODULES = [
  {
    titre: 'Dashboard',
    icone: '📊',
    description: 'KPIs du jour, tâches en retard, projets récents.',
    actions: 'Bouton + pour création rapide (client / projet / tâche).',
    astuce: 'Les KPIs se rafraîchissent à chaque ouverture.',
  },
  {
    titre: 'Clients & Contacts',
    icone: '🏢',
    description: 'Liste des entreprises clientes, fiches avec contacts, KPIs financiers, notes.',
    actions: 'Créer / modifier / archiver un client ; ajouter des contacts.',
    astuce: 'Appui long sur un numéro → composeur direct sur Android.',
  },
  {
    titre: 'Projets & Chantiers',
    icone: '🔧',
    description: 'Suivi des chantiers avec progression et statut.',
    actions: 'Créer un projet depuis la liste ou depuis la fiche client.',
    astuce: 'Filtre par statut (En cours / Terminé / En attente) en haut de liste.',
  },
  {
    titre: 'Tâches & Rappels',
    icone: '✅',
    description: "Actions à faire avec date d'échéance, notifications email J-1 et push J0.",
    actions: 'Créer / compléter / reporter ; activer les notifications push.',
    astuce: 'Les tâches du jour apparaissent aussi sur le Dashboard.',
  },
  {
    titre: 'Documents',
    icone: '📂',
    description: 'Upload de fichiers et génération de PDF depuis templates.',
    actions: 'Uploader (caméra / galerie / fichiers) ; générer un PDF.',
    astuce: 'Les PDF générés sont téléchargeables et partageables directement.',
  },
  {
    titre: 'Échanges',
    icone: '💬',
    description: 'Journal chronologique des interactions (appels, emails, visites).',
    actions: 'Logger un échange ; filtrer par type.',
    astuce: "Noter un échange juste après l'appel pour ne rien oublier.",
  },
]

export function GuideUtilisateur() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Démarrage rapide
        </h2>
        <div className="space-y-3">
          {ETAPES.map((etape) => (
            <div key={etape.num} className="bg-slate-800 rounded-xl p-4 flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                {etape.num}
              </span>
              <div>
                <p className="text-white text-sm font-medium">{etape.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{etape.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Référence des modules
        </h2>
        <div className="space-y-3">
          {MODULES.map((mod) => (
            <div key={mod.titre} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{mod.icone}</span>
                <h3 className="text-white text-sm font-semibold">{mod.titre}</h3>
              </div>
              <p className="text-slate-300 text-xs mb-1">{mod.description}</p>
              <p className="text-slate-300 text-xs mb-2">
                <span className="text-slate-400">Actions : </span>
                {mod.actions}
              </p>
              <p className="text-sky-400 text-xs">
                <span className="font-medium">Astuce : </span>
                {mod.astuce}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Étape 4 : Lancer le test — vérifier qu'il passe**

```bash
npx jest guide-utilisateur.test --no-coverage
```

Résultat attendu : PASS (5 tests)

- [ ] **Étape 5 : Commit**

```bash
git add src/components/parametres/guide-utilisateur.tsx src/components/parametres/__tests__/guide-utilisateur.test.tsx
git commit -m "feat: add GuideUtilisateur static component with onboarding + module reference"
```

---

## Task 2 — Composant ParametresTabs (onglets)

**Files:**
- Create: `src/components/parametres/parametres-tabs.tsx`
- Test: `src/components/parametres/__tests__/parametres-tabs.test.tsx`

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `src/components/parametres/__tests__/parametres-tabs.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import { ParametresTabs } from '../parametres-tabs'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('ParametresTabs', () => {
  it('affiche les deux onglets', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
    expect(screen.getByText('Guide')).toBeInTheDocument()
  })

  it('lien Paramètres pointe vers /parametres', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Paramètres').closest('a')).toHaveAttribute('href', '/parametres')
  })

  it('lien Guide pointe vers /parametres?tab=guide', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Guide').closest('a')).toHaveAttribute('href', '/parametres?tab=guide')
  })

  it('onglet actif a la classe bg-blue-600 quand activeTab=parametres', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Paramètres').closest('a')).toHaveClass('bg-blue-600')
  })

  it('onglet actif a la classe bg-blue-600 quand activeTab=guide', () => {
    render(<ParametresTabs activeTab="guide" />)
    expect(screen.getByText('Guide').closest('a')).toHaveClass('bg-blue-600')
  })

  it('onglet inactif a la classe bg-slate-800', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Guide').closest('a')).toHaveClass('bg-slate-800')
  })
})
```

- [ ] **Étape 2 : Lancer le test — vérifier qu'il échoue**

```bash
npx jest parametres-tabs.test --no-coverage
```

Résultat attendu : FAIL — `Cannot find module '../parametres-tabs'`

- [ ] **Étape 3 : Créer le composant**

Créer `src/components/parametres/parametres-tabs.tsx` :

```tsx
'use client'

import Link from 'next/link'

interface ParametresTabsProps {
  activeTab: 'parametres' | 'guide'
}

export function ParametresTabs({ activeTab }: ParametresTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Link
        href="/parametres"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'parametres'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Paramètres
      </Link>
      <Link
        href="/parametres?tab=guide"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'guide'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Guide
      </Link>
    </div>
  )
}
```

- [ ] **Étape 4 : Lancer le test — vérifier qu'il passe**

```bash
npx jest parametres-tabs.test --no-coverage
```

Résultat attendu : PASS (6 tests)

- [ ] **Étape 5 : Commit**

```bash
git add src/components/parametres/parametres-tabs.tsx src/components/parametres/__tests__/parametres-tabs.test.tsx
git commit -m "feat: add ParametresTabs client component with active state via prop"
```

---

## Task 3 — Mise à jour de parametres/page.tsx

**Files:**
- Modify: `src/app/(app)/parametres/page.tsx`

- [ ] **Étape 1 : Remplacer le contenu de la page**

Remplacer intégralement `src/app/(app)/parametres/page.tsx` par :

```tsx
import { createClient } from '@/lib/supabase/server'
import { EntrepriseForm } from '@/components/parametres/entreprise-form'
import { ParametresTabs } from '@/components/parametres/parametres-tabs'
import { GuideUtilisateur } from '@/components/parametres/guide-utilisateur'
import { PARAMETRES_CLES } from '@/lib/validations/parametres'

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('cle, valeur')
    .in('cle', PARAMETRES_CLES)
  return Object.fromEntries((data ?? []).map((r) => [r.cle, r.valeur ?? '']))
}

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab === 'guide' ? 'guide' : 'parametres'
  const settings = activeTab === 'parametres' ? await getSettings() : {}

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Paramètres</h1>
      <ParametresTabs activeTab={activeTab} />

      {activeTab === 'guide' ? (
        <GuideUtilisateur />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
```

- [ ] **Étape 2 : Lancer tous les tests**

```bash
npx jest --no-coverage
```

Résultat attendu : tous les tests passent (anciens + nouveaux)

- [ ] **Étape 3 : Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur

- [ ] **Étape 4 : Commit**

```bash
git add src/app/(app)/parametres/page.tsx
git commit -m "feat: parametres page — onglets Paramètres / Guide avec searchParams"
```

---

## Task 4 — Vérification finale

- [ ] **Étape 1 : Lancer le build complet**

```bash
npx next build
```

Résultat attendu : Build réussi, aucune erreur TypeScript ni ESLint

- [ ] **Étape 2 : Commit final si nécessaire et push**

```bash
git push
```

Résultat attendu : déploiement Vercel déclenché automatiquement
