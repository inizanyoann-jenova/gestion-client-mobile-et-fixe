# Plan 2 — Module Clients & Contacts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Module complet de gestion clients — liste paginée avec recherche/filtres, fiche détaillée avec KPIs financiers, CRUD clients et contacts, notes autosave, sous-onglets.

**Architecture:** Server Components Next.js pour le rendu initial (données fraîches depuis Supabase directement). Client Components pour les éléments interactifs (modales, filtres, autosave). API Routes REST (POST/PUT/PATCH/DELETE) appelées depuis les Client Components. `router.refresh()` après chaque mutation pour re-rendre le Server Component.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, @supabase/ssr, Zod, Tailwind CSS, next/navigation (useRouter, usePathname)

---

## Contexte technique

- Projet sur branche `main`, déployé sur Vercel
- Types Supabase dans `src/lib/supabase/types.ts` (`Client`, `Contact`, `Projet`, `Interaction`, `Tache`)
- Composants UI existants : `Badge`, `Skeleton`, `ErrorBoundary` dans `src/components/ui/`
- `src/app/page.tsx` est l'ancien scaffold Next.js — **à supprimer** (conflit de route avec `src/app/(app)/page.tsx`)
- Params dynamiques Next.js 16 : `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params`
- `searchParams` dans les Server Components : `{ searchParams }: { searchParams: Promise<...> }` → `const params = await searchParams`

---

## Structure des fichiers

```
src/
  app/
    api/
      clients/
        route.ts                              # POST (create)
        [id]/
          route.ts                            # PUT (update) + PATCH (partial) + DELETE
          contacts/
            route.ts                          # POST (create contact)
            [contactId]/
              route.ts                        # PUT + DELETE contact
    (app)/
      clients/
        page.tsx                              # Server Component — liste paginée
        loading.tsx                           # Skeleton liste
        [id]/
          page.tsx                            # Server Component — fiche client
          loading.tsx                         # Skeleton fiche
  components/
    clients/
      client-card.tsx                         # Carte dans la liste
      clients-filters.tsx                     # Barre recherche + filtres (Client)
      client-form.tsx                         # Modal create/edit client (Client)
      delete-client-button.tsx                # Bouton supprimer client (Client)
      client-header.tsx                       # En-tête fiche (nom, statut, secteur)
      quick-actions.tsx                       # 4 boutons action rapide (Client)
      client-kpis.tsx                         # 3 KPIs financiers
      contacts-section.tsx                    # Liste contacts + CRUD (Client)
      contact-form.tsx                        # Modal contact (Client)
      client-notes.tsx                        # Notes autosave (Client)
      client-tabs.tsx                         # Sous-onglets scrollables (Client)
      __tests__/
        client-card.test.tsx
        client-kpis.test.tsx
  lib/
    utils/
      currency.ts                             # formatCurrency
      initials.ts                             # getInitials, getAvatarColor
      __tests__/
        currency.test.ts
        initials.test.ts
    validations/
      client.ts                               # Zod schema
      contact.ts                              # Zod schema
      __tests__/
        client.test.ts
        contact.test.ts
```

---

## Task 1 : Cleanup + Utilitaires + Schémas Zod

**Files:**
- Delete: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/lib/utils/currency.ts`
- Create: `src/lib/utils/initials.ts`
- Create: `src/lib/utils/__tests__/currency.test.ts`
- Create: `src/lib/utils/__tests__/initials.test.ts`
- Create: `src/lib/validations/client.ts`
- Create: `src/lib/validations/contact.ts`
- Create: `src/lib/validations/__tests__/client.test.ts`
- Create: `src/lib/validations/__tests__/contact.test.ts`

- [ ] **Step 1 : Supprimer `src/app/page.tsx`**

```bash
rm src/app/page.tsx
```

Ce fichier est le scaffold Next.js par défaut. Il crée un conflit de route avec `src/app/(app)/page.tsx` qui gère le dashboard.

- [ ] **Step 2 : Nettoyer `src/app/globals.css`**

Remplacer le contenu entier par :

```css
@import "tailwindcss";

dialog {
  padding: 0;
  border: none;
  background: transparent;
  max-width: calc(100vw - 2rem);
  width: 100%;
}
```

- [ ] **Step 3 : Écrire les tests des utilitaires**

```typescript
// src/lib/utils/__tests__/currency.test.ts
import { formatCurrency } from '../currency'

describe('formatCurrency', () => {
  it('inclut le symbole euro', () => {
    expect(formatCurrency(1500)).toContain('€')
  })

  it('contient le montant', () => {
    expect(formatCurrency(150000)).toMatch(/150/)
  })

  it('retourne une chaîne pour 0', () => {
    expect(formatCurrency(0)).toContain('€')
  })
})
```

```typescript
// src/lib/utils/__tests__/initials.test.ts
import { getInitials, getAvatarColor } from '../initials'

describe('getInitials', () => {
  it('retourne les initiales en majuscules', () => {
    expect(getInitials('Jean', 'Dupont')).toBe('JD')
  })

  it('fonctionne avec des minuscules', () => {
    expect(getInitials('alice', 'martin')).toBe('AM')
  })
})

describe('getAvatarColor', () => {
  it('retourne une classe bg-', () => {
    expect(getAvatarColor('Jean')).toMatch(/^bg-/)
  })

  it('est déterministe', () => {
    expect(getAvatarColor('test')).toBe(getAvatarColor('test'))
  })
})
```

- [ ] **Step 4 : Vérifier que les tests échouent**

```bash
npx jest src/lib/utils/__tests__/
```

Expected: FAIL — modules non trouvés

- [ ] **Step 5 : Créer les utilitaires**

```typescript
// src/lib/utils/currency.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}
```

```typescript
// src/lib/utils/initials.ts
export function getInitials(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-violet-500', 'bg-teal-500',
]

export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] ?? 'bg-slate-500'
}
```

- [ ] **Step 6 : Vérifier que les tests passent**

```bash
npx jest src/lib/utils/__tests__/
```

Expected: PASS — 5 tests

- [ ] **Step 7 : Écrire les tests des schémas Zod**

```typescript
// src/lib/validations/__tests__/client.test.ts
import { clientSchema } from '../client'

describe('clientSchema', () => {
  it('accepte un client valide', () => {
    const result = clientSchema.safeParse({
      nom: 'Carrefour Grand Nord',
      secteur: 'courants_forts',
      statut: 'actif',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un nom vide', () => {
    const result = clientSchema.safeParse({ nom: '', secteur: 'courants_forts' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('nom')
  })

  it('rejette un secteur invalide', () => {
    const result = clientSchema.safeParse({ nom: 'Test', secteur: 'inconnu' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('secteur')
  })

  it('applique le statut par défaut prospect', () => {
    const result = clientSchema.safeParse({ nom: 'Test', secteur: 'mixte' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.statut).toBe('prospect')
  })
})
```

```typescript
// src/lib/validations/__tests__/contact.test.ts
import { contactSchema } from '../contact'

describe('contactSchema', () => {
  it('accepte un contact valide', () => {
    const result = contactSchema.safeParse({
      prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un prénom vide', () => {
    const result = contactSchema.safeParse({ prenom: '', nom: 'Dupont' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('prenom')
  })

  it('rejette un email invalide', () => {
    const result = contactSchema.safeParse({
      prenom: 'Jean', nom: 'Dupont', email: 'pas-un-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepte un email vide (string vide autorisé)', () => {
    const result = contactSchema.safeParse({
      prenom: 'Jean', nom: 'Dupont', email: '',
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 8 : Vérifier que les tests échouent**

```bash
npx jest src/lib/validations/__tests__/
```

Expected: FAIL — modules `client` et `contact` non trouvés

- [ ] **Step 9 : Créer les schémas Zod**

```typescript
// src/lib/validations/client.ts
import { z } from 'zod'

export const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(100),
  secteur: z.enum(['courants_forts', 'courants_faibles', 'photovoltaique', 'mixte']),
  adresse: z.string().max(200).nullable().optional(),
  siret: z.string().nullable().optional(),
  statut: z.enum(['prospect', 'actif', 'inactif']).default('prospect'),
  notes: z.string().nullable().optional(),
})

export type ClientInput = z.infer<typeof clientSchema>
```

```typescript
// src/lib/validations/contact.ts
import { z } from 'zod'

export const contactSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(50),
  nom: z.string().min(1, 'Nom requis').max(50),
  poste: z.string().max(100).nullable().optional(),
  telephone: z.string().max(20).nullable().optional(),
  email: z.union([
    z.string().email('Email invalide'),
    z.literal('').transform(() => null),
    z.null(),
  ]).optional(),
  est_principal: z.boolean().default(false),
})

export type ContactInput = z.infer<typeof contactSchema>
```

- [ ] **Step 10 : Vérifier que tous les tests passent**

```bash
npx jest src/lib/validations/__tests__/ src/lib/utils/__tests__/
```

Expected: PASS — 9 tests

- [ ] **Step 11 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 12 : Commit**

```bash
git add src/lib/utils/ src/lib/validations/ src/app/globals.css
git rm src/app/page.tsx
git commit -m "feat: add Zod schemas, currency/initials utils, clean up scaffold page"
```

---

## Task 2 : API Routes CRUD (clients + contacts)

**Files:**
- Create: `src/app/api/clients/route.ts`
- Create: `src/app/api/clients/[id]/route.ts`
- Create: `src/app/api/clients/[id]/contacts/route.ts`
- Create: `src/app/api/clients/[id]/contacts/[contactId]/route.ts`

- [ ] **Step 1 : Créer POST /api/clients**

```typescript
// src/app/api/clients/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2 : Créer PUT + PATCH + DELETE /api/clients/[id]**

```typescript
// src/app/api/clients/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/client'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = clientSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3 : Créer POST /api/clients/[id]/contacts**

```typescript
// src/app/api/clients/[id]/contacts/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations/contact'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: client_id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  if (parsed.data.est_principal) {
    await supabase
      .from('contacts')
      .update({ est_principal: false })
      .eq('client_id', client_id)
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...parsed.data, client_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4 : Créer PUT + DELETE /api/clients/[id]/contacts/[contactId]**

```typescript
// src/app/api/clients/[id]/contacts/[contactId]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations/contact'

type Params = { params: Promise<{ id: string; contactId: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id: client_id, contactId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  if (parsed.data.est_principal) {
    await supabase
      .from('contacts')
      .update({ est_principal: false })
      .eq('client_id', client_id)
      .neq('id', contactId)
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(parsed.data)
    .eq('id', contactId)
    .eq('client_id', client_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id: client_id, contactId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('client_id', client_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 6 : Commit**

```bash
git add src/app/api/
git commit -m "feat: add REST API routes for clients and contacts CRUD"
```

---

## Task 3 : Liste clients (Server Component + ClientCard + ClientsFilters)

**Files:**
- Create: `src/components/clients/client-card.tsx`
- Create: `src/components/clients/__tests__/client-card.test.tsx`
- Create: `src/components/clients/clients-filters.tsx`
- Modify: `src/app/(app)/clients/page.tsx`
- Create: `src/app/(app)/clients/loading.tsx`

- [ ] **Step 1 : Écrire le test ClientCard**

```typescript
// src/components/clients/__tests__/client-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ClientCard } from '../client-card'
import type { Client } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/clients',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockClient: Client = {
  id: '1',
  nom: 'Carrefour Grand Nord',
  secteur: 'courants_forts',
  statut: 'actif',
  adresse: '1 rue du Commerce, Saint-Denis',
  siret: null,
  notes: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

describe('ClientCard', () => {
  it('affiche le nom du client', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('affiche le badge Actif', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('a un lien vers la fiche client', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/clients/1')
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
npx jest src/components/clients/__tests__/client-card.test.tsx
```

Expected: FAIL — module non trouvé

- [ ] **Step 3 : Créer le composant ClientCard**

```typescript
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
      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
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

- [ ] **Step 4 : Vérifier que le test passe**

```bash
npx jest src/components/clients/__tests__/client-card.test.tsx
```

Expected: PASS — 3 tests

- [ ] **Step 5 : Créer le composant ClientsFilters**

```typescript
// src/components/clients/clients-filters.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useRef } from 'react'

interface ClientsFiltersProps {
  search: string
  statut: string
  secteur: string
}

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'actif', label: 'Actifs' },
  { value: 'prospect', label: 'Prospects' },
  { value: 'inactif', label: 'Inactifs' },
]

const SECTEURS = [
  { value: '', label: 'Tous' },
  { value: 'courants_forts', label: '⚡' },
  { value: 'courants_faibles', label: '📡' },
  { value: 'photovoltaique', label: '☀️' },
  { value: 'mixte', label: '🔧' },
]

export function ClientsFilters({ search, statut, secteur }: ClientsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const current = { search, statut, secteur, ...updates }
      const params = new URLSearchParams()
      if (current.search) params.set('search', current.search)
      if (current.statut) params.set('statut', current.statut)
      if (current.secteur) params.set('secteur', current.secteur)
      router.push(`${pathname}?${params.toString()}`)
    },
    [search, statut, secteur, router, pathname]
  )

  return (
    <div className="space-y-3">
      <input
        type="search"
        defaultValue={search}
        onChange={(e) => {
          clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(
            () => updateParams({ search: e.target.value }),
            400
          )
        }}
        placeholder="Rechercher un client…"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUTS.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams({ statut: s.value })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statut === s.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1 self-stretch" />
        {SECTEURS.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams({ secteur: s.value })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              secteur === s.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6 : Remplacer la page liste clients**

```typescript
// src/app/(app)/clients/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ClientCard } from '@/components/clients/client-card'
import { ClientsFilters } from '@/components/clients/clients-filters'

interface PageProps {
  searchParams: Promise<{
    search?: string
    statut?: string
    secteur?: string
    page?: string
  }>
}

const PER_PAGE = 20

export default async function ClientsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const statut = sp.statut ?? ''
  const secteur = sp.secteur ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('nom')
    .range(from, to)

  if (search) query = query.ilike('nom', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (secteur) query = query.eq('secteur', secteur)

  const { data: clients, count, error } = await query

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400 text-sm">Erreur : {error.message}</p>
      </div>
    )
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Clients
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        {/* ClientForm sera ajouté à la Task 4 */}
        <div id="new-client-btn" />
      </div>

      <ClientsFilters search={search} statut={statut} secteur={secteur} />

      {clients && clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {search || statut || secteur
              ? 'Aucun client ne correspond aux filtres'
              : 'Aucun client. Créez le premier !'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 pt-2">
          <span className="text-slate-400 text-sm">
            Page {page} / {totalPages}
          </span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7 : Créer le skeleton de chargement**

```typescript
// src/app/(app)/clients/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientsLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 9 : Commit**

```bash
git add src/components/clients/ src/app/(app)/clients/
git commit -m "feat: add clients list with search, filters, and skeleton loading"
```

---

## Task 4 : Formulaire client (Modal create/edit) + suppression

**Files:**
- Create: `src/components/clients/client-form.tsx`
- Create: `src/components/clients/delete-client-button.tsx`
- Modify: `src/app/(app)/clients/page.tsx` (ajouter ClientForm)

- [ ] **Step 1 : Créer le modal ClientForm**

```typescript
// src/components/clients/client-form.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Client } from '@/lib/supabase/types'

interface CreateProps { mode: 'create' }
interface EditProps { mode: 'edit'; client: Client }
type Props = CreateProps | EditProps

const SECTEUR_OPTIONS = [
  { value: 'courants_forts', label: '⚡ Courants forts' },
  { value: 'courants_faibles', label: '📡 Courants faibles' },
  { value: 'photovoltaique', label: '☀️ Photovoltaïque' },
  { value: 'mixte', label: '🔧 Mixte' },
]

const STATUT_OPTIONS = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
]

export function ClientForm(props: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const isEdit = props.mode === 'edit'
  const client = isEdit ? props.client : null

  const open = () => {
    setError(null)
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const body = {
      nom: fd.get('nom') as string,
      secteur: fd.get('secteur') as string,
      statut: fd.get('statut') as string,
      adresse: (fd.get('adresse') as string) || null,
      siret: (fd.get('siret') as string) || null,
      notes: isEdit ? (client?.notes ?? null) : null,
    }

    const url = isEdit ? `/api/clients/${client!.id}` : '/api/clients'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error?.message ?? json.error ?? 'Erreur lors de la sauvegarde')
        return
      }

      close()
      if (!isEdit) {
        const created = await res.json()
        router.push(`/clients/${created.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {isEdit ? (
        <button onClick={open} className="text-sky-400 text-sm font-medium">
          Modifier
        </button>
      ) : (
        <button
          onClick={open}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span> Nouveau
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Modifier le client' : 'Nouveau client'}
          </h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Nom *</label>
            <input
              name="nom"
              required
              defaultValue={client?.nom ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Carrefour Grand Nord"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Secteur *</label>
              <select
                name="secteur"
                required
                defaultValue={client?.secteur ?? 'courants_forts'}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {SECTEUR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Statut *</label>
              <select
                name="statut"
                required
                defaultValue={client?.statut ?? 'prospect'}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Adresse</label>
            <input
              name="adresse"
              defaultValue={client?.adresse ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="1 rue du Commerce, Saint-Denis 97400"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">SIRET</label>
            <input
              name="siret"
              defaultValue={client?.siret ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="12345678901234"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
```

- [ ] **Step 2 : Créer le bouton de suppression**

```typescript
// src/components/clients/delete-client-button.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteClientButtonProps {
  clientId: string
}

export function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        'Supprimer ce client et tous ses contacts ? Cette action est irréversible.'
      )
    )
      return

    setIsPending(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
      if (res.ok) router.push('/clients')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Suppression…' : 'Supprimer le client'}
    </button>
  )
}
```

- [ ] **Step 3 : Ajouter ClientForm dans la page liste**

Ouvrir `src/app/(app)/clients/page.tsx`. Ajouter l'import et remplacer le placeholder :

```typescript
// Ajouter en haut du fichier :
import { ClientForm } from '@/components/clients/client-form'

// Remplacer :
{/* ClientForm sera ajouté à la Task 4 */}
<div id="new-client-btn" />

// Par :
<ClientForm mode="create" />
```

- [ ] **Step 4 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5 : Commit**

```bash
git add src/components/clients/client-form.tsx src/components/clients/delete-client-button.tsx src/app/(app)/clients/page.tsx
git commit -m "feat: add client create/edit modal and delete button"
```

---

## Task 5 : Page fiche client (Server Component)

**Files:**
- Create: `src/app/(app)/clients/[id]/page.tsx`
- Create: `src/app/(app)/clients/[id]/loading.tsx`

- [ ] **Step 1 : Créer le skeleton de chargement**

```typescript
// src/app/(app)/clients/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientDetailLoading() {
  return (
    <div className="pb-24">
      <div className="bg-slate-800 px-4 pt-4 pb-5 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="px-4 space-y-6 mt-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer la page fiche client**

```typescript
// src/app/(app)/clients/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientHeader } from '@/components/clients/client-header'
import { QuickActions } from '@/components/clients/quick-actions'
import { ClientKpis } from '@/components/clients/client-kpis'
import { ContactsSection } from '@/components/clients/contacts-section'
import { ClientNotes } from '@/components/clients/client-notes'
import { ClientTabs } from '@/components/clients/client-tabs'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    clientResult,
    contactsResult,
    projetsResult,
    lastEchangeResult,
    nextRappelResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('contacts')
      .select('*')
      .eq('client_id', id)
      .order('est_principal', { ascending: false }),
    supabase
      .from('projets')
      .select('statut, montant_devis, montant_facture')
      .eq('client_id', id),
    supabase
      .from('interactions')
      .select('*')
      .eq('client_id', id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('taches')
      .select('*')
      .eq('client_id', id)
      .eq('statut', 'a_faire')
      .order('date_echeance')
      .limit(1)
      .maybeSingle(),
  ])

  if (clientResult.error || !clientResult.data) notFound()

  const client = clientResult.data
  const contacts = contactsResult.data ?? []
  const projets = projetsResult.data ?? []

  const kpis = {
    ca_realise: projets
      .filter((p) => p.statut === 'termine')
      .reduce((sum, p) => sum + (p.montant_facture ?? 0), 0),
    montant_attente: projets
      .filter((p) => ['en_cours', 'en_etude'].includes(p.statut))
      .reduce((sum, p) => sum + (p.montant_devis ?? 0), 0),
    nombre_projets: projets.length,
  }

  const principalContact = contacts.find((c) => c.est_principal)

  return (
    <div className="pb-24">
      <ClientHeader client={client} />
      <div className="px-4 space-y-6 mt-4">
        <QuickActions
          phone={principalContact?.telephone ?? null}
          email={principalContact?.email ?? null}
          address={client.adresse}
          clientId={client.id}
        />
        <ClientKpis kpis={kpis} />
        <ContactsSection contacts={contacts} clientId={client.id} />
        <ClientNotes initialNotes={client.notes ?? ''} clientId={client.id} />
        <ClientTabs
          clientId={client.id}
          dernierEchange={lastEchangeResult.data ?? null}
          prochainRappel={nextRappelResult.data ?? null}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: erreurs TypeScript pour les composants non encore créés (ClientHeader, QuickActions, etc.) — normal, ils seront créés dans les tasks suivantes.

- [ ] **Step 4 : Commit (partiel — les composants manquants seront ajoutés aux tasks 6-8)**

```bash
git add "src/app/(app)/clients/[id]/"
git commit -m "feat: add client detail page with Server Component data fetching"
```

---

## Task 6 : ClientHeader + QuickActions

**Files:**
- Create: `src/components/clients/client-header.tsx`
- Create: `src/components/clients/quick-actions.tsx`

- [ ] **Step 1 : Créer ClientHeader**

```typescript
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
    <div className="bg-slate-800 px-4 pt-4 pb-5">
      <Link href="/clients" className="text-sky-400 text-sm block mb-2">
        ← Clients
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

- [ ] **Step 2 : Créer QuickActions**

Comportement adaptatif : `tel:` sur mobile (Android/iPhone), popup numéro sur desktop.

```typescript
// src/components/clients/quick-actions.tsx
'use client'

import { useState } from 'react'

interface QuickActionsProps {
  phone: string | null
  email: string | null
  address: string | null
  clientId: string
}

export function QuickActions({ phone, email, address }: QuickActionsProps) {
  const [showPhonePopup, setShowPhonePopup] = useState(false)

  const handleCall = () => {
    if (!phone) return
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = `tel:${phone}`
    } else {
      setShowPhonePopup(true)
    }
  }

  const handleEmail = () => {
    if (!email) return
    window.location.href = `mailto:${email}`
  }

  const handleMaps = () => {
    if (!address) return
    window.open(
      `https://maps.google.com/maps?q=${encodeURIComponent(address)}`,
      '_blank'
    )
  }

  const handleNote = () => {
    const el = document.getElementById('client-notes')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-2">
        <ActionBtn icon="📞" label="Appeler" onClick={handleCall} disabled={!phone} />
        <ActionBtn icon="✉️" label="Email" onClick={handleEmail} disabled={!email} />
        <ActionBtn icon="📝" label="Note" onClick={handleNote} />
        <ActionBtn icon="📍" label="Carte" onClick={handleMaps} disabled={!address} />
      </div>

      {showPhonePopup && phone && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-700 rounded-xl p-4 z-20 shadow-2xl">
          <p className="text-slate-400 text-xs mb-1">Numéro à appeler</p>
          <p className="text-white text-2xl font-mono tracking-wide">{phone}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(phone)
                setShowPhonePopup(false)
              }}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 rounded-lg font-medium"
            >
              Copier
            </button>
            <button
              onClick={() => setShowPhonePopup(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-slate-300 text-sm py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 bg-slate-700 hover:bg-slate-600 rounded-xl py-3 disabled:opacity-40 active:bg-slate-600 transition-colors min-h-[64px]"
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </button>
  )
}
```

- [ ] **Step 3 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: toujours des erreurs pour les composants non créés (ClientKpis, etc.) — normal

- [ ] **Step 4 : Commit**

```bash
git add src/components/clients/client-header.tsx src/components/clients/quick-actions.tsx
git commit -m "feat: add ClientHeader with edit/delete and QuickActions (adaptive mobile/desktop)"
```

---

## Task 7 : ClientKpis + ContactsSection + ContactForm

**Files:**
- Create: `src/components/clients/client-kpis.tsx`
- Create: `src/components/clients/__tests__/client-kpis.test.tsx`
- Create: `src/components/clients/contacts-section.tsx`
- Create: `src/components/clients/contact-form.tsx`

- [ ] **Step 1 : Écrire le test ClientKpis**

```typescript
// src/components/clients/__tests__/client-kpis.test.tsx
import { render, screen } from '@testing-library/react'
import { ClientKpis } from '../client-kpis'

describe('ClientKpis', () => {
  it('affiche les 3 labels', () => {
    render(<ClientKpis kpis={{ ca_realise: 0, montant_attente: 0, nombre_projets: 0 }} />)
    expect(screen.getByText('CA réalisé')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
    expect(screen.getByText('Projets')).toBeInTheDocument()
  })

  it('affiche le nombre de projets', () => {
    render(<ClientKpis kpis={{ ca_realise: 0, montant_attente: 0, nombre_projets: 7 }} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('affiche le symbole € dans les montants', () => {
    render(<ClientKpis kpis={{ ca_realise: 50000, montant_attente: 20000, nombre_projets: 0 }} />)
    const euros = screen.getAllByText(/€/)
    expect(euros.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
npx jest src/components/clients/__tests__/client-kpis.test.tsx
```

Expected: FAIL — module non trouvé

- [ ] **Step 3 : Créer le composant ClientKpis**

```typescript
// src/components/clients/client-kpis.tsx
import { formatCurrency } from '@/lib/utils/currency'

interface ClientKpisProps {
  kpis: {
    ca_realise: number
    montant_attente: number
    nombre_projets: number
  }
}

export function ClientKpis({ kpis }: ClientKpisProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard
        label="CA réalisé"
        value={formatCurrency(kpis.ca_realise)}
        color="text-emerald-400"
      />
      <KpiCard
        label="En attente"
        value={formatCurrency(kpis.montant_attente)}
        color="text-amber-400"
      />
      <KpiCard
        label="Projets"
        value={String(kpis.nombre_projets)}
        color="text-sky-400"
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 text-center">
      <p className={`text-base font-bold ${color} leading-tight`}>{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  )
}
```

- [ ] **Step 4 : Vérifier que le test passe**

```bash
npx jest src/components/clients/__tests__/client-kpis.test.tsx
```

Expected: PASS — 3 tests

- [ ] **Step 5 : Créer le modal ContactForm**

```typescript
// src/components/clients/contact-form.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/lib/supabase/types'

interface CreateProps { mode: 'create'; clientId: string }
interface EditProps { mode: 'edit'; clientId: string; contact: Contact }
type Props = CreateProps | EditProps

export function ContactForm(props: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const isEdit = props.mode === 'edit'
  const contact = isEdit ? props.contact : null

  const open = () => {
    setError(null)
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const body = {
      prenom: fd.get('prenom') as string,
      nom: fd.get('nom') as string,
      poste: (fd.get('poste') as string) || null,
      telephone: (fd.get('telephone') as string) || null,
      email: (fd.get('email') as string) || null,
      est_principal: fd.get('est_principal') === 'on',
    }

    const url = isEdit
      ? `/api/clients/${props.clientId}/contacts/${contact!.id}`
      : `/api/clients/${props.clientId}/contacts`

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error?.message ?? json.error ?? 'Erreur')
        return
      }

      close()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {isEdit ? (
        <button onClick={open} className="text-sky-400 text-xs">
          Modifier
        </button>
      ) : (
        <button onClick={open} className="text-sky-400 text-sm font-medium">
          + Ajouter
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Modifier le contact' : 'Nouveau contact'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Prénom *</label>
              <input
                name="prenom"
                required
                defaultValue={contact?.prenom ?? ''}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nom *</label>
              <input
                name="nom"
                required
                defaultValue={contact?.nom ?? ''}
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Poste</label>
            <input
              name="poste"
              defaultValue={contact?.poste ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Directeur technique"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Téléphone</label>
            <input
              name="telephone"
              type="tel"
              defaultValue={contact?.telephone ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="+262 692 00 00 00"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={contact?.email ?? ''}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="est_principal"
              defaultChecked={contact?.est_principal ?? false}
              className="w-4 h-4 rounded accent-sky-500"
            />
            <span className="text-sm text-slate-300">Contact principal</span>
          </label>

          {error && (
            <p className="text-red-400 text-sm" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
```

- [ ] **Step 6 : Créer ContactsSection**

```typescript
// src/components/clients/contacts-section.tsx
'use client'

import { useRouter } from 'next/navigation'
import { getInitials, getAvatarColor } from '@/lib/utils/initials'
import { ContactForm } from './contact-form'
import type { Contact } from '@/lib/supabase/types'

interface ContactsSectionProps {
  contacts: Contact[]
  clientId: string
}

export function ContactsSection({ contacts, clientId }: ContactsSectionProps) {
  const router = useRouter()

  const handleDelete = async (contactId: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
      method: 'DELETE',
    })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">
          Contacts{' '}
          {contacts.length > 0 && (
            <span className="text-slate-400 font-normal text-sm">({contacts.length})</span>
          )}
        </h2>
        <ContactForm mode="create" clientId={clientId} />
      </div>

      {contacts.length === 0 && (
        <p className="text-slate-400 text-sm">Aucun contact renseigné</p>
      )}

      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-slate-800 rounded-xl p-3 flex items-center gap-3"
        >
          <div
            className={`${getAvatarColor(contact.nom)} w-10 h-10 rounded-full flex items-center justify-center shrink-0`}
          >
            <span className="text-white text-sm font-bold">
              {getInitials(contact.prenom, contact.nom)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white text-sm font-medium">
                {contact.prenom} {contact.nom}
              </p>
              {contact.est_principal && (
                <span className="text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
            {contact.poste && (
              <p className="text-slate-400 text-xs truncate">{contact.poste}</p>
            )}
            {contact.telephone && (
              <a
                href={`tel:${contact.telephone}`}
                className="text-sky-400 text-xs block"
              >
                {contact.telephone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-slate-400 text-xs truncate block"
              >
                {contact.email}
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <ContactForm mode="edit" clientId={clientId} contact={contact} />
            <button
              onClick={() => handleDelete(contact.id)}
              className="text-slate-500 hover:text-red-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7 : Vérifier que tous les tests passent**

```bash
npx jest
```

Expected: PASS — tous les tests (incluant les 3 nouveaux de client-kpis)

- [ ] **Step 8 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Expected: toujours des erreurs pour ClientNotes et ClientTabs (créés à la task 8)

- [ ] **Step 9 : Commit**

```bash
git add src/components/clients/client-kpis.tsx src/components/clients/__tests__/client-kpis.test.tsx src/components/clients/contacts-section.tsx src/components/clients/contact-form.tsx
git commit -m "feat: add ClientKpis, ContactsSection, and ContactForm components"
```

---

## Task 8 : ClientNotes (autosave) + ClientTabs (sous-onglets)

**Files:**
- Create: `src/components/clients/client-notes.tsx`
- Create: `src/components/clients/client-tabs.tsx`

- [ ] **Step 1 : Créer ClientNotes avec autosave 1 seconde**

```typescript
// src/components/clients/client-notes.tsx
'use client'

import { useState, useRef } from 'react'

interface ClientNotesProps {
  initialNotes: string
  clientId: string
}

export function ClientNotes({ initialNotes, clientId }: ClientNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = (value: string) => {
    setNotes(value)
    setSaveState('idle')
    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSaveState('saving')
      try {
        const res = await fetch(`/api/clients/${clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: value }),
        })
        if (res.ok) {
          setSaveState('saved')
          setTimeout(() => setSaveState('idle'), 2000)
        } else {
          setSaveState('error')
        }
      } catch {
        setSaveState('error')
      }
    }, 1000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">Notes libres</h2>
        <span className="text-xs">
          {saveState === 'saving' && <span className="text-slate-400">Enregistrement…</span>}
          {saveState === 'saved' && <span className="text-emerald-400">Enregistré ✓</span>}
          {saveState === 'error' && <span className="text-red-400">Erreur d'enregistrement</span>}
        </span>
      </div>
      <textarea
        id="client-notes"
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        placeholder="Notes libres sur ce client…"
        className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  )
}
```

- [ ] **Step 2 : Créer ClientTabs (sous-onglets scrollables)**

```typescript
// src/components/clients/client-tabs.tsx
'use client'

import { useState } from 'react'
import type { Interaction, Tache } from '@/lib/supabase/types'

interface ClientTabsProps {
  clientId: string
  dernierEchange: Interaction | null
  prochainRappel: Tache | null
}

const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'documents', label: 'Documents' },
  { id: 'taches', label: 'Tâches' },
]

const TYPE_LABEL: Record<string, string> = {
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  reunion: 'Réunion',
  autre: 'Autre',
}

export function ClientTabs({ dernierEchange, prochainRappel }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState('activite')

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-0 border-b border-slate-700 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-4 space-y-3">
        {activeTab === 'activite' && (
          <>
            {dernierEchange ? (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400 text-xs">Dernier échange</span>
                  <span className="text-slate-500 text-xs">
                    {TYPE_LABEL[dernierEchange.type] ?? dernierEchange.type}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">
                    {new Date(dernierEchange.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-white text-sm">{dernierEchange.resume}</p>
                {dernierEchange.suite_a_donner && (
                  <p className="text-amber-400 text-xs mt-2">
                    → {dernierEchange.suite_a_donner}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Aucun échange enregistré</p>
            )}

            {prochainRappel && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400 text-xs font-medium mb-1">Prochain rappel</p>
                <p className="text-white text-sm font-medium">{prochainRappel.titre}</p>
                {prochainRappel.date_echeance && (
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(prochainRappel.date_echeance).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab !== 'activite' && (
          <p className="text-slate-400 text-sm text-center py-6">
            Module disponible dans une prochaine version
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier que tous les tests passent**

```bash
npx jest
```

Expected: PASS — tous les tests (aucun nouveau ici, tests de regression)

- [ ] **Step 4 : Vérification TypeScript complète**

```bash
npx tsc --noEmit
```

Expected: **aucune erreur** — tous les composants sont maintenant créés

- [ ] **Step 5 : Build de production**

```bash
npm run build
```

Expected: Build successful, toutes les pages compilées

- [ ] **Step 6 : Commit final + push**

```bash
git add src/components/clients/client-notes.tsx src/components/clients/client-tabs.tsx
git commit -m "feat: add ClientNotes autosave and ClientTabs with activity summary"
git push
```

---

## Prochaines étapes

| Plan | Contenu |
|---|---|
| Plan 3 | Module Projets & Chantiers (liste filtrée, fiche, barre de progression) |
| Plan 4 | Tâches & Notifications (email Resend + Web Push) |
| Plan 5 | Documents (upload Supabase Storage + génération PDF) |
| Plan 6 | Interactions (journal) + Tableau de bord complet |
