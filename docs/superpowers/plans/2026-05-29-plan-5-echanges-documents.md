# Plan 5 — Échanges & Documents

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter les modules Échanges (`/echanges`) et Documents (`/documents`) avec liste globale + CRUD, activer les onglets correspondants dans la fiche client, et mettre à jour la page `/plus` avec la navigation vers ces modules.

**Architecture:** Même pattern que les modules précédents — Server Component pour les pages liste (filtres via searchParams, fetch Supabase côté serveur), Client Components pour l'interactivité (cartes avec edit/delete inline via dialog, modal formulaire). Les onglets Documents/Échanges/Tâches de la fiche client reçoivent leurs données comme props depuis le Server Component parent. `EchangeForm` (créer) et `EchangeEditContent` (modifier, dans la carte) sont deux composants distincts — même pattern que `TacheForm` / `TacheEditContent`.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + Storage), Zod, TypeScript strict.

---

## Cartographie des fichiers

**Nouveaux fichiers :**
- `src/lib/validations/interaction.ts` — InteractionCreateSchema, InteractionUpdateSchema, InteractionListQuerySchema + types
- `src/lib/validations/__tests__/interaction.test.ts` — 10 tests
- `src/app/api/interactions/route.ts` — GET (liste paginée + filtres) + POST (créer)
- `src/app/api/interactions/[id]/route.ts` — PUT (modifier) + DELETE (supprimer)
- `src/components/echanges/echange-card.tsx` — carte échange (badge type, date, résumé, suite_a_donner, edit inline via dialog)
- `src/components/echanges/__tests__/echange-card.test.tsx` — 6 tests
- `src/components/echanges/echange-form.tsx` — bouton + dialog création d'un échange
- `src/components/echanges/echanges-filters.tsx` — search debounced + pills type
- `src/app/(app)/echanges/page.tsx` — Server Component liste globale + pagination
- `src/app/(app)/echanges/loading.tsx` — skeleton
- `src/app/api/documents/route.ts` — GET (liste globale paginée) + POST (upload sans contexte)
- `src/app/api/documents/[id]/route.ts` — GET (metadata + signed URL) + DELETE (storage + DB)
- `src/components/documents/document-card.tsx` — carte document (icône type, nom, taille, contexte client/projet, télécharger, supprimer)
- `src/components/documents/__tests__/document-card.test.tsx` — 5 tests
- `src/components/documents/documents-filters.tsx` — pills type
- `src/app/(app)/documents/page.tsx` — Server Component liste globale + pagination
- `src/app/(app)/documents/loading.tsx` — skeleton

**Fichiers modifiés :**
- `src/lib/validations/document.ts` — ADD DocumentListQuerySchema, DocumentGlobalUploadSchema + types
- `src/lib/validations/__tests__/document.test.ts` — ADD 3 tests pour les nouveaux schémas
- `src/app/api/projets/[id]/interactions/route.ts` — ADD POST
- `src/components/projets/projet-interactions.tsx` — remplacer lien `/echanges/nouveau?projet=X` par `<EchangeForm projetId={projetId} />`
- `src/components/projets/projet-documents.tsx` — corriger `handleDownload` : appeler `GET /api/documents/[id]` au lieu de `GET /api/projets/[id]/documents?path=X`
- `src/components/clients/client-tabs.tsx` — ADD onglet Échanges, activer onglets Documents et Tâches avec données réelles, accepter nouvelles props
- `src/app/(app)/clients/[id]/page.tsx` — ADD 3 queries parallèles (interactions, documents, tâches du client)
- `src/app/(app)/echanges/nouveau/page.tsx` — remplacer placeholder par redirect vers `/echanges`
- `src/app/(app)/plus/page.tsx` — grille de navigation (Échanges + Documents + Paramètres placeholder)

---

## Task 1 : Schémas Zod — Interaction & Document liste

**Files:**
- Create: `src/lib/validations/interaction.ts`
- Create: `src/lib/validations/__tests__/interaction.test.ts`
- Modify: `src/lib/validations/document.ts`
- Modify: `src/lib/validations/__tests__/document.test.ts`

- [ ] **Step 1 : Écrire les tests interaction (failing)**

Créer `src/lib/validations/__tests__/interaction.test.ts` :

```typescript
import { InteractionCreateSchema, InteractionListQuerySchema } from '../interaction'

describe('InteractionCreateSchema', () => {
  const validDate = '2026-05-29T10:00:00.000Z'

  it('accepte une interaction valide minimale', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'appel', date: validDate, resume: 'Discussion' })
    expect(result.success).toBe(true)
  })

  it('rejette un type invalide', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'sms', date: validDate, resume: 'Discussion' })
    expect(result.success).toBe(false)
  })

  it('rejette un résumé vide', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'email', date: validDate, resume: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('resume')
  })

  it('accepte suite_a_donner null', () => {
    const result = InteractionCreateSchema.safeParse({ type: 'visite', date: validDate, resume: 'Visite chantier', suite_a_donner: null })
    expect(result.success).toBe(true)
  })

  it('accepte tous les types valides', () => {
    for (const type of ['appel', 'email', 'visite', 'reunion', 'autre'] as const) {
      const result = InteractionCreateSchema.safeParse({ type, date: validDate, resume: 'Test' })
      expect(result.success).toBe(true)
    }
  })
})

describe('InteractionListQuerySchema', () => {
  it('applique page par défaut 1', () => {
    const result = InteractionListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it('rejette un type invalide', () => {
    const result = InteractionListQuerySchema.safeParse({ type: 'sms' })
    expect(result.success).toBe(false)
  })

  it('accepte un client_id UUID valide', () => {
    const result = InteractionListQuerySchema.safeParse({ client_id: '123e4567-e89b-12d3-a456-426614174000' })
    expect(result.success).toBe(true)
  })

  it('rejette un client_id non-UUID', () => {
    const result = InteractionListQuerySchema.safeParse({ client_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('coerce page en nombre', () => {
    const result = InteractionListQuerySchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(3)
  })
})
```

- [ ] **Step 2 : Run — FAIL attendu**

```bash
npx jest src/lib/validations/__tests__/interaction.test.ts --no-coverage
```

Expected: `Cannot find module '../interaction'`

- [ ] **Step 3 : Créer `src/lib/validations/interaction.ts`**

```typescript
import { z } from 'zod'

export const InteractionCreateSchema = z.object({
  type: z.enum(['appel', 'email', 'visite', 'reunion', 'autre']),
  date: z.string().datetime(),
  resume: z.string().min(1, 'Résumé requis').max(2000),
  suite_a_donner: z.string().max(500).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
})

export const InteractionUpdateSchema = InteractionCreateSchema

export const InteractionListQuerySchema = z.object({
  type: z.enum(['appel', 'email', 'visite', 'reunion', 'autre']).optional(),
  client_id: z.string().uuid().optional(),
  projet_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type InteractionCreateInput = z.infer<typeof InteractionCreateSchema>
export type InteractionUpdateInput = z.infer<typeof InteractionUpdateSchema>
export type InteractionListQuery = z.infer<typeof InteractionListQuerySchema>
```

- [ ] **Step 4 : Run — PASS**

```bash
npx jest src/lib/validations/__tests__/interaction.test.ts --no-coverage
```

Expected: 10 tests passed

- [ ] **Step 5 : Ajouter tests document (additions)**

Remplacer `src/lib/validations/__tests__/document.test.ts` par le contenu complet suivant (les 3 premiers tests existaient déjà, 3 nouveaux ajoutés à la fin) :

```typescript
import { DocumentUploadSchema, DocumentListQuerySchema, DocumentGlobalUploadSchema } from '../document'

describe('DocumentUploadSchema', () => {
  it('accepte un document valide', () => {
    const result = DocumentUploadSchema.safeParse({ nom: 'devis.pdf', type: 'devis' })
    expect(result.success).toBe(true)
  })

  it('rejette un nom vide', () => {
    const result = DocumentUploadSchema.safeParse({ nom: '', type: 'devis' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('nom')
  })

  it('rejette un type invalide', () => {
    const result = DocumentUploadSchema.safeParse({ nom: 'fichier.pdf', type: 'facture' })
    expect(result.success).toBe(false)
  })
})

describe('DocumentListQuerySchema', () => {
  it('applique page par défaut 1', () => {
    const result = DocumentListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it('filtre par type valide', () => {
    const result = DocumentListQuerySchema.safeParse({ type: 'devis' })
    expect(result.success).toBe(true)
  })

  it('rejette un type invalide', () => {
    const result = DocumentListQuerySchema.safeParse({ type: 'invoice' })
    expect(result.success).toBe(false)
  })
})

describe('DocumentGlobalUploadSchema', () => {
  it('accepte un upload sans client ni projet', () => {
    const result = DocumentGlobalUploadSchema.safeParse({ nom: 'plan.pdf', type: 'plan' })
    expect(result.success).toBe(true)
  })

  it('accepte un upload avec client_id UUID', () => {
    const result = DocumentGlobalUploadSchema.safeParse({
      nom: 'contrat.pdf',
      type: 'contrat',
      client_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un client_id non-UUID', () => {
    const result = DocumentGlobalUploadSchema.safeParse({ nom: 'x.pdf', type: 'autre', client_id: 'invalid' })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 6 : Run — FAIL attendu (DocumentListQuerySchema manquant)**

```bash
npx jest src/lib/validations/__tests__/document.test.ts --no-coverage
```

Expected: 3 tests pass (existants), 6 fail (nouveaux schémas manquants)

- [ ] **Step 7 : Étendre `src/lib/validations/document.ts`**

Remplacer le contenu complet du fichier :

```typescript
import { z } from 'zod'

export const DocumentUploadSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(200),
  type: z.enum(['devis', 'rapport', 'plan', 'photo', 'contrat', 'autre']),
  description: z.string().max(1000).nullable().optional(),
})

export const DocumentGlobalUploadSchema = DocumentUploadSchema.extend({
  client_id: z.string().uuid().nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
})

export const DocumentListQuerySchema = z.object({
  type: z.enum(['devis', 'rapport', 'plan', 'photo', 'contrat', 'autre']).optional(),
  client_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>
export type DocumentGlobalUploadInput = z.infer<typeof DocumentGlobalUploadSchema>
export type DocumentListQuery = z.infer<typeof DocumentListQuerySchema>
```

- [ ] **Step 8 : Run — PASS**

```bash
npx jest src/lib/validations/__tests__/document.test.ts --no-coverage
```

Expected: 9 tests passed

- [ ] **Step 9 : Run all tests**

```bash
npx jest --no-coverage
```

Expected: 86 tests passed (73 + 13 nouveaux)

- [ ] **Step 10 : Commit**

```bash
git add src/lib/validations/interaction.ts src/lib/validations/__tests__/interaction.test.ts src/lib/validations/document.ts src/lib/validations/__tests__/document.test.ts
git commit -m "feat: add InteractionCreateSchema, InteractionListQuerySchema, DocumentListQuerySchema, DocumentGlobalUploadSchema"
```

---

## Task 2 : API Échanges — CRUD global + sous-ressource projet

**Files:**
- Create: `src/app/api/interactions/route.ts`
- Create: `src/app/api/interactions/[id]/route.ts`
- Modify: `src/app/api/projets/[id]/interactions/route.ts`

- [ ] **Step 1 : Créer `src/app/api/interactions/route.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractionCreateSchema, InteractionListQuerySchema } from '@/lib/validations/interaction'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = InteractionListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, client_id, projet_id, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('interactions')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)
  if (client_id) query = query.eq('client_id', client_id)
  if (projet_id) query = query.eq('projet_id', projet_id)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ interactions: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = InteractionCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('interactions')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2 : Créer `src/app/api/interactions/[id]/route.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractionUpdateSchema } from '@/lib/validations/interaction'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = InteractionUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('interactions')
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

  const { error } = await supabase.from('interactions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3 : Modifier `src/app/api/projets/[id]/interactions/route.ts` — ADD POST**

Remplacer le contenu complet du fichier (garder le GET existant, ajouter POST) :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractionCreateSchema } from '@/lib/validations/interaction'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: projet_id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('projet_id', projet_id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: projet_id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = InteractionCreateSchema.safeParse({ ...body, projet_id })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('interactions')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4 : Run tests + build check**

```bash
npx jest --no-coverage
```

Expected: 86 tests passed

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/interactions/ src/app/api/projets/
git commit -m "feat: add CRUD API routes for interactions (global + projet sub-resource)"
```

---

## Task 3 : EchangeCard + EchangeForm + EchangesFilters

**Files:**
- Create: `src/components/echanges/echange-card.tsx`
- Create: `src/components/echanges/__tests__/echange-card.test.tsx`
- Create: `src/components/echanges/echange-form.tsx`
- Create: `src/components/echanges/echanges-filters.tsx`

- [ ] **Step 1 : Écrire les tests EchangeCard (failing)**

Créer `src/components/echanges/__tests__/echange-card.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import { EchangeCard } from '../echange-card'
import type { Interaction } from '@/lib/supabase/types'

const mockInteraction: Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
} = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'appel',
  date: '2026-05-29T10:00:00.000Z',
  resume: 'Discussion du devis Carrefour',
  suite_a_donner: 'Rappeler la semaine prochaine',
  client_id: null,
  projet_id: null,
  created_at: '2026-05-29T10:00:00.000Z',
  client: null,
  projet: null,
}

describe('EchangeCard', () => {
  it('affiche le badge de type', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByText('Appel')).toBeInTheDocument()
  })

  it('affiche le résumé', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByText('Discussion du devis Carrefour')).toBeInTheDocument()
  })

  it('affiche la suite à donner', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByText('Rappeler la semaine prochaine')).toBeInTheDocument()
  })

  it('ne rend pas la suite à donner si null', () => {
    render(<EchangeCard interaction={{ ...mockInteraction, suite_a_donner: null }} />)
    expect(screen.queryByText('Rappeler la semaine prochaine')).not.toBeInTheDocument()
  })

  it('affiche le bouton modifier', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument()
  })

  it('affiche le bouton supprimer', () => {
    render(<EchangeCard interaction={mockInteraction} />)
    expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Run — FAIL attendu**

```bash
npx jest src/components/echanges/__tests__/echange-card.test.tsx --no-coverage
```

Expected: `Cannot find module '../echange-card'`

- [ ] **Step 3 : Créer `src/components/echanges/echange-card.tsx`**

```tsx
'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Interaction, TypeInteraction } from '@/lib/supabase/types'

type InteractionAvecContext = Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface EchangeCardProps {
  interaction: InteractionAvecContext
}

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  reunion: 'Réunion',
  autre: 'Autre',
}

const TYPE_COLOR: Record<TypeInteraction, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

export function EchangeCard({ interaction }: EchangeCardProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const openDialog = () => {
    setDialogOpen(true)
    dialogRef.current?.showModal()
  }

  const closeDialog = () => {
    dialogRef.current?.close()
    setDialogOpen(false)
  }

  return (
    <div className="bg-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLOR[interaction.type]}`}>
          {TYPE_LABEL[interaction.type]}
        </span>
        <span className="text-slate-500 text-xs ml-auto">
          {new Date(interaction.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <button
          aria-label="Modifier cet échange"
          onClick={openDialog}
          className="text-slate-400 hover:text-slate-200 text-sm px-1.5 py-0.5 rounded transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 2.5l2 2-9 9H2.5v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <p className="text-white text-sm line-clamp-3">{interaction.resume}</p>

      {interaction.suite_a_donner && (
        <p className="text-amber-400 text-xs">→ {interaction.suite_a_donner}</p>
      )}

      {(interaction.client || interaction.projet) && (
        <div className="flex gap-3 flex-wrap">
          {interaction.client && (
            <Link href={`/clients/${interaction.client.id}`} className="text-sky-400 text-xs hover:underline">
              {interaction.client.nom}
            </Link>
          )}
          {interaction.projet && (
            <Link href={`/projets/${interaction.projet.id}`} className="text-slate-400 text-xs hover:underline">
              📁 {interaction.projet.titre}
            </Link>
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
      >
        {dialogOpen && (
          <EchangeEditContent
            interaction={interaction}
            onClose={closeDialog}
            onSuccess={() => { closeDialog(); router.refresh() }}
          />
        )}
      </dialog>
    </div>
  )
}

interface EchangeEditContentProps {
  interaction: Interaction
  onClose: () => void
  onSuccess: () => void
}

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function EchangeEditContent({ interaction, onClose, onSuccess }: EchangeEditContentProps) {
  const [type, setType] = useState<TypeInteraction>(interaction.type)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const dateRaw = fd.get('date') as string
    const body = {
      type,
      date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
      resume: fd.get('resume') as string,
      suite_a_donner: (fd.get('suite_a_donner') as string) || null,
    }
    try {
      const res = await fetch(`/api/interactions/${interaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onSuccess()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cet échange ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/interactions/${interaction.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onSuccess()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsDeleting(false)
    }
  }

  const TYPE_OPTIONS: { value: TypeInteraction; label: string }[] = [
    { value: 'appel', label: 'Appel' },
    { value: 'email', label: 'Email' },
    { value: 'visite', label: 'Visite' },
    { value: 'reunion', label: 'Réunion' },
    { value: 'autre', label: 'Autre' },
  ]

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Modifier l&apos;échange</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as TypeInteraction)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Date</label>
        <input name="date" type="datetime-local" defaultValue={toDatetimeLocal(interaction.date)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Résumé *</label>
        <textarea name="resume" rows={3} defaultValue={interaction.resume} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" required />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Suite à donner</label>
        <textarea name="suite_a_donner" rows={2} defaultValue={interaction.suite_a_donner ?? ''} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={handleDelete} disabled={isDeleting} className="py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50" aria-label="Supprimer cet échange">
          {isDeleting ? 'Suppression…' : 'Supprimer'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">
          Annuler
        </button>
        <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4 : Run EchangeCard tests — PASS**

```bash
npx jest src/components/echanges/__tests__/echange-card.test.tsx --no-coverage
```

Expected: 6 tests passed

- [ ] **Step 5 : Créer `src/components/echanges/echange-form.tsx`**

Bouton + dialog pour créer un échange. Peut recevoir `projetId` ou `clientId` pré-remplis.

```tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TypeInteraction } from '@/lib/supabase/types'

interface EchangeFormProps {
  projetId?: string
  clientId?: string
}

const TYPE_OPTIONS: { value: TypeInteraction; label: string }[] = [
  { value: 'appel', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'visite', label: 'Visite' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'autre', label: 'Autre' },
]

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EchangeForm({ projetId, clientId }: EchangeFormProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [type, setType] = useState<TypeInteraction>('appel')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

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
    const dateRaw = fd.get('date') as string
    const body = {
      type,
      date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
      resume: fd.get('resume') as string,
      suite_a_donner: (fd.get('suite_a_donner') as string) || null,
      ...(projetId ? { projet_id: projetId } : {}),
      ...(clientId ? { client_id: clientId } : {}),
    }

    try {
      const url = projetId ? `/api/projets/${projetId}/interactions` : '/api/interactions'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
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
      <button onClick={open} className="text-sky-400 text-sm font-medium">
        + Nouvel échange
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => { if (e.target === dialogRef.current) close() }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Nouvel échange</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as TypeInteraction)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Date</label>
            <input name="date" type="datetime-local" defaultValue={toDatetimeLocal(new Date().toISOString())} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Résumé *</label>
            <textarea name="resume" rows={3} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Sujet de l'échange…" required />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Suite à donner</label>
            <textarea name="suite_a_donner" rows={2} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Action à mener…" />
          </div>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={close} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
              {isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
```

- [ ] **Step 6 : Créer `src/components/echanges/echanges-filters.tsx`**

```tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TypeInteraction } from '@/lib/supabase/types'

const TYPE_FILTERS: { value: TypeInteraction | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'appel', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'visite', label: 'Visite' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'autre', label: 'Autre' },
]

interface EchangesFiltersProps {
  search: string
  type: string
}

export function EchangesFilters({ search: initSearch, type: initType }: EchangesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const push = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push('search', val), 350)
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Rechercher dans les échanges…"
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => push('type', f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              initType === f.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7 : Run all tests**

```bash
npx jest --no-coverage
```

Expected: 92 tests passed (86 + 6 EchangeCard)

- [ ] **Step 8 : Commit**

```bash
git add src/components/echanges/
git commit -m "feat: add EchangeCard, EchangeForm, EchangesFilters components"
```

---

## Task 4 : Page /echanges

**Files:**
- Create: `src/app/(app)/echanges/page.tsx`
- Create: `src/app/(app)/echanges/loading.tsx`

- [ ] **Step 1 : Créer `src/app/(app)/echanges/loading.tsx`**

```tsx
export default function EchangesLoading() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
      <div className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}
```

- [ ] **Step 2 : Créer `src/app/(app)/echanges/page.tsx`**

```tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EchangeCard } from '@/components/echanges/echange-card'
import { EchangesFilters } from '@/components/echanges/echanges-filters'
import { EchangeForm } from '@/components/echanges/echange-form'
import type { Interaction } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>
}

const PER_PAGE = 20

export default async function EchangesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const type = sp.type ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('interactions')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('resume', `%${search}%`)
  if (type) query = query.eq('type', type)

  const { data: interactions, count, error } = await query

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400 text-sm">Erreur : {error.message}</p>
      </div>
    )
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Échanges
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <EchangeForm />
      </div>

      <Suspense fallback={<div className="h-20 bg-slate-800 rounded-xl animate-pulse" />}>
        <EchangesFilters search={search} type={type} />
      </Suspense>

      {interactions && interactions.length > 0 ? (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <EchangeCard
              key={interaction.id}
              interaction={
                interaction as Interaction & {
                  client: { id: string; nom: string } | null
                  projet: { id: string; titre: string } | null
                }
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {search || type
              ? 'Aucun échange ne correspond aux filtres'
              : 'Aucun échange enregistré. Commencez par créer le premier !'}
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

- [ ] **Step 3 : Run tests + build**

```bash
npx jest --no-coverage && npx tsc --noEmit
```

Expected: 92 tests passed, 0 TypeScript errors

- [ ] **Step 4 : Commit**

```bash
git add src/app/\(app\)/echanges/
git commit -m "feat: add /echanges page with Server Component, filters, pagination"
```

---

## Task 5 : API Documents — liste globale, upload, signed URL, suppression

**Files:**
- Create: `src/app/api/documents/route.ts`
- Create: `src/app/api/documents/[id]/route.ts`

- [ ] **Step 1 : Créer `src/app/api/documents/route.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DocumentListQuerySchema, DocumentGlobalUploadSchema } from '@/lib/validations/document'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = DocumentListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, client_id, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('documents')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)
  if (client_id) query = query.eq('client_id', client_id)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ documents: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'FormData invalide' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const metaRaw = formData.get('meta')
  let meta: { nom?: string; type?: string; description?: string; client_id?: string; projet_id?: string } = {}
  if (metaRaw && typeof metaRaw === 'string') {
    try { meta = JSON.parse(metaRaw) } catch { /* ignore */ }
  }

  const parsed = DocumentGlobalUploadSchema.safeParse({
    nom: meta.nom ?? file.name,
    type: meta.type ?? 'autre',
    description: meta.description ?? null,
    client_id: meta.client_id ?? null,
    projet_id: meta.projet_id ?? null,
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `standalone/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      nom: parsed.data.nom,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      client_id: parsed.data.client_id ?? null,
      projet_id: parsed.data.projet_id ?? null,
      storage_path: storagePath,
      taille_octets: file.size,
      genere_par_app: false,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2 : Créer `src/app/api/documents/[id]/route.ts`**

Le GET génère une signed URL valable 1 heure (pour le téléchargement). Le DELETE supprime le fichier Storage puis la row DB.

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  let signedUrl: string | null = null
  if (doc.storage_path) {
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 3600)
    signedUrl = urlData?.signedUrl ?? null
  }

  return NextResponse.json({ ...doc, signed_url: signedUrl })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError || !doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  if (doc.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3 : Run tests + build**

```bash
npx jest --no-coverage && npx tsc --noEmit
```

Expected: 92 tests passed, 0 TypeScript errors

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/documents/
git commit -m "feat: add global documents API (GET list, POST upload, GET signed URL, DELETE)"
```

---

## Task 6 : DocumentCard + DocumentsFilters + Page /documents

**Files:**
- Create: `src/components/documents/document-card.tsx`
- Create: `src/components/documents/__tests__/document-card.test.tsx`
- Create: `src/components/documents/documents-filters.tsx`
- Create: `src/app/(app)/documents/page.tsx`
- Create: `src/app/(app)/documents/loading.tsx`

- [ ] **Step 1 : Écrire les tests DocumentCard (failing)**

Créer `src/components/documents/__tests__/document-card.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import { DocumentCard } from '../document-card'
import type { Document } from '@/lib/supabase/types'

const mockDoc: Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
} = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  nom: 'Devis Carrefour.pdf',
  type: 'devis',
  description: null,
  storage_path: 'standalone/123-devis.pdf',
  taille_octets: 204800,
  genere_par_app: false,
  client_id: null,
  projet_id: null,
  created_at: '2026-05-29T10:00:00.000Z',
  client: null,
  projet: null,
}

describe('DocumentCard', () => {
  it('affiche le nom du document', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByText('Devis Carrefour.pdf')).toBeInTheDocument()
  })

  it('affiche la taille formatée', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByText(/200 Ko/)).toBeInTheDocument()
  })

  it('affiche l\'icône du type devis', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByText('📄')).toBeInTheDocument()
  })

  it('affiche le bouton télécharger si storage_path présent', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByRole('button', { name: /télécharger/i })).toBeInTheDocument()
  })

  it('affiche le bouton supprimer', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Run — FAIL attendu**

```bash
npx jest src/components/documents/__tests__/document-card.test.tsx --no-coverage
```

Expected: `Cannot find module '../document-card'`

- [ ] **Step 3 : Créer `src/components/documents/document-card.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Document, TypeDocument } from '@/lib/supabase/types'

type DocumentAvecContext = Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface DocumentCardProps {
  document: DocumentAvecContext
}

const TYPE_ICON: Record<TypeDocument, string> = {
  devis: '📄',
  rapport: '📋',
  plan: '📐',
  photo: '📷',
  contrat: '📝',
  autre: '📎',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDownload = async () => {
    if (!doc.storage_path) return
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      const json = await res.json()
      if (json.signed_url) window.open(json.signed_url, '_blank')
    } catch {
      // silently fail — user can retry
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
      <span className="text-2xl shrink-0">{TYPE_ICON[doc.type]}</span>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
        <p className="text-slate-500 text-xs">
          {formatSize(doc.taille_octets)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
        </p>
        {(doc.client || doc.projet) && (
          <div className="flex gap-2 flex-wrap pt-0.5">
            {doc.client && (
              <Link href={`/clients/${doc.client.id}`} className="text-sky-400 text-xs hover:underline">
                {doc.client.nom}
              </Link>
            )}
            {doc.projet && (
              <Link href={`/projets/${doc.projet.id}`} className="text-slate-400 text-xs hover:underline">
                📁 {doc.projet.titre}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        {doc.storage_path && (
          <button
            aria-label="Télécharger ce document"
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-sky-400 text-xs font-medium hover:text-sky-300 disabled:opacity-50"
          >
            {isDownloading ? '…' : '↓'}
          </button>
        )}
        <button
          aria-label="Supprimer ce document"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-slate-400 hover:text-red-400 text-xs font-medium disabled:opacity-50"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Run DocumentCard tests — PASS**

```bash
npx jest src/components/documents/__tests__/document-card.test.tsx --no-coverage
```

Expected: 5 tests passed

- [ ] **Step 5 : Créer `src/components/documents/documents-filters.tsx`**

```tsx
'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TypeDocument } from '@/lib/supabase/types'

const TYPE_FILTERS: { value: TypeDocument | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'devis', label: 'Devis' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'plan', label: 'Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

interface DocumentsFiltersProps {
  type: string
}

export function DocumentsFilters({ type: initType }: DocumentsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const push = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('type', value)
    else params.delete('type')
    params.delete('page')
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {TYPE_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => push(f.value)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            initType === f.value
              ? 'bg-sky-500 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6 : Créer `src/app/(app)/documents/loading.tsx`**

```tsx
export default function DocumentsLoading() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="h-8 w-36 bg-slate-800 rounded-lg animate-pulse" />
      <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}
```

- [ ] **Step 7 : Créer `src/app/(app)/documents/page.tsx`**

La page inclut aussi un bouton d'upload (réutilise `ProjetDocuments` pattern via un modal inline).

```tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DocumentCard } from '@/components/documents/document-card'
import { DocumentsFilters } from '@/components/documents/documents-filters'
import { DocumentUploadButton } from '@/components/documents/document-upload-button'
import type { Document } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>
}

const PER_PAGE = 20

export default async function DocumentsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const type = sp.type ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('documents')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)

  const { data: documents, count, error } = await query

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400 text-sm">Erreur : {error.message}</p>
      </div>
    )
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Documents
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <DocumentUploadButton />
      </div>

      <Suspense fallback={<div className="h-10 bg-slate-800 rounded-xl animate-pulse" />}>
        <DocumentsFilters type={type} />
      </Suspense>

      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={
                doc as Document & {
                  client: { id: string; nom: string } | null
                  projet: { id: string; titre: string } | null
                }
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {type ? 'Aucun document de ce type' : 'Aucun document. Ajoutez le premier !'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 pt-2">
          <span className="text-slate-400 text-sm">Page {page} / {totalPages}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8 : Créer `src/components/documents/document-upload-button.tsx`**

Bouton + modal d'upload global (pas de client/projet lié, upload standalone).

```tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TypeDocument } from '@/lib/supabase/types'

const TYPE_OPTIONS: { value: TypeDocument; label: string }[] = [
  { value: 'devis', label: 'Devis' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'plan', label: 'Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

export function DocumentUploadButton() {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<TypeDocument>('autre')
  const [docNom, setDocNom] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openDialog = () => {
    setSelectedFile(null)
    setDocNom('')
    setDocType('autre')
    setError(null)
    dialogRef.current?.showModal()
  }
  const closeDialog = () => dialogRef.current?.close()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file && !docNom) setDocNom(file.name.replace(/\.[^.]+$/, ''))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('meta', JSON.stringify({ nom: docNom || selectedFile.name, type: docType }))

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Erreur upload')
        return
      }
      closeDialog()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <button onClick={openDialog} className="text-sky-400 text-sm font-medium">
        + Ajouter
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto p-0"
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
      >
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Ajouter un document</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as TypeDocument)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Nom</label>
            <input value={docNom} onChange={(e) => setDocNom(e.target.value)} className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Nom du document" />
          </div>

          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 text-sm hover:border-sky-500 hover:text-sky-400 transition-colors">
              {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, image, max 20 Mo)'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
          </div>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeDialog} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={!selectedFile || isUploading} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">
              {isUploading ? 'Upload…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
```

- [ ] **Step 9 : Run all tests + build**

```bash
npx jest --no-coverage
```

Expected: 97 tests passed (92 + 5 DocumentCard)

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 10 : Commit**

```bash
git add src/components/documents/ src/app/\(app\)/documents/
git commit -m "feat: add DocumentCard, DocumentsFilters, DocumentUploadButton, /documents page"
```

---

## Task 7 : Intégration — ClientTabs + ProjetInteractions + ProjetDocuments + /plus

**Files:**
- Modify: `src/components/clients/client-tabs.tsx`
- Modify: `src/app/(app)/clients/[id]/page.tsx`
- Modify: `src/components/projets/projet-interactions.tsx`
- Modify: `src/components/projets/projet-documents.tsx`
- Modify: `src/app/(app)/echanges/nouveau/page.tsx`
- Modify: `src/app/(app)/plus/page.tsx`

- [ ] **Step 1 : Corriger `src/components/projets/projet-documents.tsx` — téléchargement**

Dans `handleDownload`, remplacer la ligne qui appelle `/api/projets/${projetId}/documents?path=...` par :

```typescript
const handleDownload = async (doc: Document) => {
  if (!doc.storage_path) return
  try {
    const res = await fetch(`/api/documents/${doc.id}`)
    const json = await res.json()
    if (json.signed_url) window.open(json.signed_url, '_blank')
  } catch {
    // silently fail
  }
}
```

Remplacer uniquement la fonction `handleDownload` (lignes 92-101 dans le fichier original). Le reste du composant reste identique.

- [ ] **Step 2 : Modifier `src/components/projets/projet-interactions.tsx` — bouton EchangeForm**

Remplacer le contenu complet du fichier :

```tsx
import { EchangeForm } from '@/components/echanges/echange-form'
import type { Interaction, TypeInteraction } from '@/lib/supabase/types'

interface ProjetInteractionsProps {
  interactions: Interaction[]
  projetId: string
}

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  reunion: 'Réunion',
  autre: 'Autre',
}

const TYPE_COLOR: Record<TypeInteraction, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

export function ProjetInteractions({ interactions, projetId }: ProjetInteractionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">{interactions.length} échange{interactions.length !== 1 ? 's' : ''}</span>
        <EchangeForm projetId={projetId} />
      </div>

      {interactions.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun échange enregistré</p>
      )}

      {interactions.map((interaction) => (
        <div key={interaction.id} className="bg-slate-900 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[interaction.type]}`}>
              {TYPE_LABEL[interaction.type]}
            </span>
            <span className="text-slate-500 text-xs ml-auto">
              {new Date(interaction.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
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

- [ ] **Step 3 : Modifier `src/components/clients/client-tabs.tsx` — activer les onglets**

Remplacer le contenu complet du fichier :

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProjetForm } from '@/components/projets/projet-form'
import { TacheForm } from '@/components/taches/tache-form'
import { EchangeForm } from '@/components/echanges/echange-form'
import type { Document, Interaction, Projet, Tache, TypeInteraction } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }
type DocumentAvecContext = Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type TacheAvecRelations = Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type InteractionAvecContext = Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface ClientTabsProps {
  clientId: string
  dernierEchange: Interaction | null
  prochainRappel: Tache | null
  projets?: ProjetAvecClient[]
  interactions?: InteractionAvecContext[]
  documents?: DocumentAvecContext[]
  taches?: TacheAvecRelations[]
}

const TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'projets', label: 'Projets' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'documents', label: 'Documents' },
  { id: 'taches', label: 'Tâches' },
]

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel', email: 'Email', visite: 'Visite', reunion: 'Réunion', autre: 'Autre',
}

const TYPE_COLOR: Record<TypeInteraction, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

const TYPE_ICON: Record<string, string> = {
  devis: '📄', rapport: '📋', plan: '📐', photo: '📷', contrat: '📝', autre: '📎',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function ClientTabs({ clientId, dernierEchange, prochainRappel, projets, interactions, documents, taches }: ClientTabsProps) {
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
                  <span className="text-slate-500 text-xs">{TYPE_LABEL[dernierEchange.type] ?? dernierEchange.type}</span>
                  <span className="text-slate-500 text-xs ml-auto">{new Date(dernierEchange.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-white text-sm">{dernierEchange.resume}</p>
                {dernierEchange.suite_a_donner && (
                  <p className="text-amber-400 text-xs mt-2">→ {dernierEchange.suite_a_donner}</p>
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
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'projets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ProjetForm mode="create" clientId={clientId} />
            </div>
            {(!projets || projets.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucun projet pour ce client</p>
            )}
            {projets?.map((projet) => (
              <Link key={projet.id} href={`/projets/${projet.id}`} className="block bg-slate-800 rounded-xl p-3 active:bg-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium truncate">{projet.titre}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    projet.statut === 'termine' ? 'bg-emerald-500/20 text-emerald-400' :
                    projet.statut === 'en_cours' ? 'bg-amber-500/20 text-amber-400' :
                    projet.statut === 'sav' ? 'bg-red-500/20 text-red-400' :
                    'bg-sky-500/20 text-sky-400'
                  }`}>
                    {projet.statut === 'en_etude' ? 'En étude' :
                     projet.statut === 'en_cours' ? 'En cours' :
                     projet.statut === 'termine' ? 'Terminé' : 'SAV'}
                  </span>
                </div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${projet.avancement}%` }} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'echanges' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">{interactions?.length ?? 0} échange{(interactions?.length ?? 0) !== 1 ? 's' : ''}</span>
              <EchangeForm clientId={clientId} />
            </div>
            {(!interactions || interactions.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucun échange pour ce client</p>
            )}
            {interactions?.map((interaction) => (
              <div key={interaction.id} className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[interaction.type]}`}>
                    {TYPE_LABEL[interaction.type]}
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
        )}

        {activeTab === 'documents' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">{documents?.length ?? 0} fichier{(documents?.length ?? 0) !== 1 ? 's' : ''}</span>
              <Link href="/documents" className="text-sky-400 text-xs font-medium">Voir tous</Link>
            </div>
            {(!documents || documents.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucun document pour ce client</p>
            )}
            {documents?.map((doc) => (
              <div key={doc.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl shrink-0">{TYPE_ICON[doc.type] ?? '📎'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{doc.nom}</p>
                  <p className="text-slate-500 text-xs">{formatSize(doc.taille_octets)}</p>
                </div>
                {doc.projet && (
                  <Link href={`/projets/${doc.projet.id}`} className="text-slate-400 text-xs hover:text-sky-400 shrink-0 truncate max-w-[100px]">
                    📁 {doc.projet.titre}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'taches' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">{taches?.filter(t => t.statut === 'a_faire').length ?? 0} à faire</span>
              <TacheForm clientId={clientId} />
            </div>
            {(!taches || taches.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Aucune tâche pour ce client</p>
            )}
            {taches?.map((tache) => (
              <div key={tache.id} className={`bg-slate-800 rounded-xl p-3 flex items-center gap-3${tache.statut === 'fait' ? ' opacity-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  tache.priorite === 'haute' ? 'bg-red-400' :
                  tache.priorite === 'normale' ? 'bg-amber-400' : 'bg-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tache.titre}</p>
                  {tache.date_echeance && (
                    <p className="text-slate-400 text-xs">
                      {new Date(tache.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                {tache.projet && (
                  <Link href={`/projets/${tache.projet.id}`} className="text-slate-400 text-xs hover:text-sky-400 shrink-0 truncate max-w-[100px]">
                    {tache.projet.titre}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Modifier `src/app/(app)/clients/[id]/page.tsx` — ajouter les 3 queries**

Remplacer le contenu complet du fichier (les 3 nouvelles queries sont ajoutées au `Promise.all`) :

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientHeader } from '@/components/clients/client-header'
import { QuickActions } from '@/components/clients/quick-actions'
import { ClientKpis } from '@/components/clients/client-kpis'
import { ContactsSection } from '@/components/clients/contacts-section'
import { ClientNotes } from '@/components/clients/client-notes'
import { ClientTabs } from '@/components/clients/client-tabs'
import type { Client, Contact, Document, Interaction, Projet, Tache } from '@/lib/supabase/types'

type ProjetAvecClient = Projet & { client: { id: string; nom: string } }
type DocumentAvecContext = Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type TacheAvecRelations = Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}
type InteractionAvecContext = Interaction & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

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
    projetsTabsResult,
    lastEchangeResult,
    nextRappelResult,
    interactionsResult,
    documentsResult,
    tachesResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('client_id', id).order('est_principal', { ascending: false }),
    supabase.from('projets').select('statut, montant_devis, montant_facture').eq('client_id', id),
    supabase.from('projets').select('*, client:clients(id, nom)').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('interactions').select('*').eq('client_id', id).order('date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('taches').select('*').eq('client_id', id).eq('statut', 'a_faire').order('date_echeance').limit(1).maybeSingle(),
    supabase.from('interactions').select('*, client:clients(id, nom), projet:projets(id, titre)').eq('client_id', id).order('date', { ascending: false }).limit(20),
    supabase.from('documents').select('*, client:clients(id, nom), projet:projets(id, titre)').eq('client_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('taches').select('*, client:clients(id, nom), projet:projets(id, titre)').eq('client_id', id).order('date_echeance', { ascending: true, nullsFirst: false }).limit(20),
  ])

  if (clientResult.error || !clientResult.data) notFound()

  const client = clientResult.data as Client
  const contacts = (contactsResult.data ?? []) as Contact[]
  const projets = projetsResult.data ?? []
  const projetsTabs = (projetsTabsResult.data ?? []) as unknown as ProjetAvecClient[]

  const kpis = {
    ca_realise: projets.filter((p) => p.statut === 'termine').reduce((sum, p) => sum + (p.montant_facture ?? 0), 0),
    montant_attente: projets.filter((p) => ['en_cours', 'en_etude'].includes(p.statut)).reduce((sum, p) => sum + (p.montant_devis ?? 0), 0),
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
          dernierEchange={(lastEchangeResult.data ?? null) as Interaction | null}
          prochainRappel={(nextRappelResult.data ?? null) as Tache | null}
          projets={projetsTabs}
          interactions={(interactionsResult.data ?? []) as unknown as InteractionAvecContext[]}
          documents={(documentsResult.data ?? []) as unknown as DocumentAvecContext[]}
          taches={(tachesResult.data ?? []) as unknown as TacheAvecRelations[]}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Modifier `src/app/(app)/echanges/nouveau/page.tsx` — redirect**

Remplacer le contenu complet du fichier :

```tsx
import { redirect } from 'next/navigation'

export default function NouvelEchangePage() {
  redirect('/echanges')
}
```

- [ ] **Step 6 : Modifier `src/app/(app)/plus/page.tsx` — grille navigation**

Remplacer le contenu complet du fichier :

```tsx
import Link from 'next/link'

const MODULES = [
  { href: '/echanges', icon: '💬', label: 'Échanges', description: 'Journal des appels, emails et visites' },
  { href: '/documents', icon: '📁', label: 'Documents', description: 'Fichiers, PDF, photos' },
  { href: '/parametres', icon: '⚙️', label: 'Paramètres', description: 'Compte et préférences', disabled: true },
]

export default function PlusPage() {
  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="text-xl font-bold text-white">Plus</h1>

      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod) => {
          const content = (
            <div className={`bg-slate-800 rounded-2xl p-4 space-y-2 active:bg-slate-700 transition-colors ${mod.disabled ? 'opacity-50' : ''}`}>
              <span className="text-3xl">{mod.icon}</span>
              <p className="text-white text-sm font-semibold">{mod.label}</p>
              <p className="text-slate-400 text-xs leading-snug">{mod.description}</p>
              {mod.disabled && (
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">Bientôt</span>
              )}
            </div>
          )
          return mod.disabled ? (
            <div key={mod.href}>{content}</div>
          ) : (
            <Link key={mod.href} href={mod.href}>{content}</Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 7 : Run all tests**

```bash
npx jest --no-coverage
```

Expected: 97 tests passed

- [ ] **Step 8 : Build TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors. Si des erreurs de types apparaissent sur les casts `as unknown as`, les corriger en ajoutant les types intermédiaires appropriés.

- [ ] **Step 9 : Commit final**

```bash
git add src/components/clients/ src/components/projets/projet-interactions.tsx src/components/projets/projet-documents.tsx src/app/\(app\)/clients/ src/app/\(app\)/echanges/nouveau/ src/app/\(app\)/plus/
git commit -m "feat: activate Échanges/Documents/Tâches tabs in client fiche, fix ProjetInteractions form, fix download, update /plus page"
```

---

## Auto-review

**Couverture de la spec :**
- ✅ 5.8 Historique des échanges — liste `/echanges` + filtres type + search + création/edit/delete
- ✅ 5.7 Documents — liste `/documents` + filtres type + upload + téléchargement + suppression
- ✅ 5.3 Fiche client sous-onglets — Échanges, Documents, Tâches activés avec données réelles
- ✅ 5.5 Fiche projet onglet Échanges — bouton "+ Nouvel échange" fonctionnel (EchangeForm)
- ✅ 5.5 Fiche projet onglet Documents — téléchargement corrigé via GET /api/documents/[id]
- ✅ Navigation — /plus avec grille Échanges + Documents + Paramètres (placeholder)
- ✅ Pagination — toutes les listes paginées (PER_PAGE = 20)
- ✅ Qualité — TypeScript strict, Zod, RLS (createClient = user session), skeletons

**Hors périmètre v1 (non implémenté intentionnellement) :**
- Génération PDF depuis templates (spec 5.7 / 7) — reporté car nécessite `@react-pdf/renderer` + templates ATEXIA spécifiques
- Paramètres (`/parametres`) — placeholder dans /plus
- Upload de document depuis la fiche client (ClientTabs Documents tab montre la liste + lien "Voir tous", l'upload se fait depuis /documents ou /projets/[id])
