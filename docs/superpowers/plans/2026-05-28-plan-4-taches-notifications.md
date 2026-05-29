# Plan 4 — Tâches & Notifications

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la page globale `/taches` avec filtres/pagination/CRUD complet, les notifications email via Resend (cron J-1/J0), et les notifications push Web Push (service worker + abonnement).

**Architecture:** Server Component pour la page `/taches` (fetch Supabase côté serveur, filtres via searchParams), Client Components pour l'interactivité (toggle statut optimiste, modals). Cron Vercel quotidien à 7h UTC pour les rappels email + push.

**Tech Stack:** Next.js 14 App Router, Supabase, Zod, `resend` (email), `web-push` (push), `next-pwa` v5 (service worker via `worker/index.js`), Vercel Cron Jobs.

---

## Cartographie des fichiers

**Nouveaux fichiers :**
- `src/lib/validations/tache.ts` — extend : TacheUpdateSchema, TacheListQuerySchema
- `src/app/api/taches/route.ts` — ADD GET (liste paginée)
- `src/app/api/taches/[id]/route.ts` — ADD PUT (mise à jour complète) + DELETE
- `src/app/(app)/taches/page.tsx` — remplacer placeholder par Server Component réel
- `src/app/(app)/taches/loading.tsx` — skeleton
- `src/components/taches/tache-card.tsx` — carte tâche (toggle statut optimiste + bouton edit)
- `src/components/taches/tache-edit-modal.tsx` — modal édition/suppression
- `src/components/taches/taches-filters.tsx` — filtres search + statut + priorité
- `src/lib/email/rappel-template.ts` — template HTML email rappel
- `src/lib/notifications/push.ts` — helper sendPushNotification()
- `src/app/api/notifications/email/route.ts` — POST envoyer un email rappel manuel
- `src/app/api/notifications/subscribe/route.ts` — POST sauvegarder abonnement push
- `src/app/api/notifications/push/route.ts` — POST envoyer une push notification
- `src/app/api/cron/rappels/route.ts` — GET cron quotidien rappels J-1 et J0
- `worker/index.js` — code service worker custom (push events) pour next-pwa
- `src/components/notifications/push-prompt.tsx` — UI activation notifications push
- `vercel.json` — configuration cron Vercel

**Fichiers modifiés :**
- `src/lib/supabase/types.ts` — ADD PushSubscriptionRow type + Database push_subscriptions
- `src/components/taches/tache-form.tsx` — activer les checkboxes notifications (câblage)

**Tests :**
- `src/lib/validations/__tests__/tache.test.ts` — extend pour nouveaux schémas
- `src/components/taches/__tests__/tache-card.test.tsx` — nouveau
- `src/lib/email/__tests__/rappel-template.test.ts` — nouveau

---

## Task 1 : Schémas Zod étendus

**Files:**
- Modify: `src/lib/validations/tache.ts`
- Modify: `src/lib/validations/__tests__/tache.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Remplacer le contenu de `src/lib/validations/__tests__/tache.test.ts` :

```typescript
import { TacheCreateSchema, TacheUpdateSchema, TacheListQuerySchema } from '../tache'

describe('TacheCreateSchema', () => {
  it('accepte une tâche valide minimale', () => {
    const result = TacheCreateSchema.safeParse({ titre: 'Appeler client' })
    expect(result.success).toBe(true)
  })

  it('rejette un titre vide', () => {
    const result = TacheCreateSchema.safeParse({ titre: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('titre')
  })

  it('applique la priorité par défaut normale', () => {
    const result = TacheCreateSchema.safeParse({ titre: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.priorite).toBe('normale')
  })

  it('rejette une priorité invalide', () => {
    const result = TacheCreateSchema.safeParse({ titre: 'Test', priorite: 'urgente' })
    expect(result.success).toBe(false)
  })
})

describe('TacheUpdateSchema', () => {
  it('accepte une mise à jour complète', () => {
    const result = TacheUpdateSchema.safeParse({
      titre: 'Nouveau titre',
      priorite: 'haute',
      statut: 'fait',
      notification_active: true,
      notification_email: false,
      notification_push: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejette un statut invalide', () => {
    const result = TacheUpdateSchema.safeParse({ titre: 'Test', statut: 'en_cours' })
    expect(result.success).toBe(false)
  })
})

describe('TacheListQuerySchema', () => {
  it('applique page=1 par défaut', () => {
    const result = TacheListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it('convertit page string en nombre', () => {
    const result = TacheListQuerySchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(3)
  })

  it('rejette un statut invalide', () => {
    const result = TacheListQuerySchema.safeParse({ statut: 'en_cours' })
    expect(result.success).toBe(false)
  })

  it('accepte tous les filtres valides', () => {
    const result = TacheListQuerySchema.safeParse({
      search: 'devis',
      statut: 'a_faire',
      priorite: 'haute',
      page: '2',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.statut).toBe('a_faire')
      expect(result.data.priorite).toBe('haute')
    }
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
npx jest src/lib/validations/__tests__/tache.test.ts --no-coverage
```

Expected : FAIL (TacheUpdateSchema et TacheListQuerySchema not exported)

- [ ] **Step 3 : Implémenter les nouveaux schémas**

Remplacer le contenu de `src/lib/validations/tache.ts` :

```typescript
import { z } from 'zod'

export const TacheCreateSchema = z.object({
  titre: z.string().min(2, 'Titre requis').max(200),
  description: z.string().max(2000).nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  date_echeance: z.string().datetime().nullable().optional(),
  priorite: z.enum(['haute', 'normale', 'basse']).default('normale'),
  notification_active: z.boolean().default(false),
  notification_email: z.boolean().default(false),
  notification_push: z.boolean().default(false),
})

export const TacheUpdateSchema = TacheCreateSchema.extend({
  statut: z.enum(['a_faire', 'fait']).optional(),
})

export const TacheListQuerySchema = z.object({
  search: z.string().optional(),
  statut: z.enum(['a_faire', 'fait']).optional(),
  priorite: z.enum(['haute', 'normale', 'basse']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type TacheCreateInput = z.infer<typeof TacheCreateSchema>
export type TacheUpdateInput = z.infer<typeof TacheUpdateSchema>
export type TacheListQuery = z.infer<typeof TacheListQuerySchema>
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
npx jest src/lib/validations/__tests__/tache.test.ts --no-coverage
```

Expected : PASS (8 tests)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/validations/tache.ts src/lib/validations/__tests__/tache.test.ts
git commit -m "feat: extend TacheSchemas — TacheUpdateSchema + TacheListQuerySchema"
```

---

## Task 2 : API GET /api/taches + PUT + DELETE /api/taches/[id]

**Files:**
- Modify: `src/app/api/taches/route.ts`
- Modify: `src/app/api/taches/[id]/route.ts`

- [ ] **Step 1 : Ajouter GET à /api/taches**

Remplacer le contenu de `src/app/api/taches/route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TacheCreateSchema, TacheListQuerySchema } from '@/lib/validations/tache'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = TacheListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { search, statut, priorite, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('taches')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('date_echeance', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('titre', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (priorite) query = query.eq('priorite', priorite)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ taches: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = TacheCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('taches')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2 : Ajouter PUT et DELETE à /api/taches/[id]**

Remplacer le contenu de `src/app/api/taches/[id]/route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TacheUpdateSchema } from '@/lib/validations/tache'
import { z } from 'zod'

const PatchStatutSchema = z.object({
  statut: z.enum(['a_faire', 'fait']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = PatchStatutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('taches')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = TacheUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('taches')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabase.from('taches').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 errors

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/taches/route.ts src/app/api/taches/[id]/route.ts
git commit -m "feat: add GET /api/taches (paginated list) + PUT + DELETE /api/taches/[id]"
```

---

## Task 3 : TacheCard component

**Files:**
- Create: `src/components/taches/tache-card.tsx`
- Create: `src/components/taches/__tests__/tache-card.test.tsx`

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/components/taches/__tests__/tache-card.test.tsx` :

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TacheCard } from '../tache-card'
import type { Tache } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

global.fetch = jest.fn()

const mockTache: Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
} = {
  id: 'tache-1',
  titre: 'Envoyer le devis Carrefour',
  description: null,
  statut: 'a_faire',
  priorite: 'haute',
  date_echeance: null,
  client_id: 'client-1',
  projet_id: null,
  notification_active: false,
  notification_email: false,
  notification_push: false,
  created_at: '2026-05-28T00:00:00Z',
  updated_at: '2026-05-28T00:00:00Z',
  client: { id: 'client-1', nom: 'Carrefour Grand Nord' },
  projet: null,
}

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('TacheCard', () => {
  it('affiche le titre de la tâche', () => {
    render(<TacheCard tache={mockTache} />)
    expect(screen.getByText('Envoyer le devis Carrefour')).toBeInTheDocument()
  })

  it('affiche le badge priorité haute', () => {
    render(<TacheCard tache={mockTache} />)
    expect(screen.getByText('Haute')).toBeInTheDocument()
  })

  it('affiche le lien vers le client', () => {
    render(<TacheCard tache={mockTache} />)
    const clientLink = screen.getByRole('link', { name: /carrefour grand nord/i })
    expect(clientLink).toHaveAttribute('href', '/clients/client-1')
  })

  it('affiche en opacité réduite quand statut=fait', () => {
    const tacheFaite = { ...mockTache, statut: 'fait' as const }
    const { container } = render(<TacheCard tache={tacheFaite} />)
    expect(container.firstChild).toHaveClass('opacity-50')
  })

  it('affiche la date en rouge si échéance dépassée et statut=a_faire', () => {
    const tacheEnRetard = {
      ...mockTache,
      date_echeance: '2020-01-01T00:00:00Z',
    }
    render(<TacheCard tache={tacheEnRetard} />)
    const dateEl = screen.getByText(/⚠/)
    expect(dateEl).toHaveClass('text-red-400')
  })

  it('toggle le statut au clic sur la checkbox', async () => {
    render(<TacheCard tache={mockTache} />)
    const checkbox = screen.getByRole('button', { name: /marquer comme fait/i })
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/taches/tache-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ statut: 'fait' }),
        })
      )
    })
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
npx jest src/components/taches/__tests__/tache-card.test.tsx --no-coverage
```

Expected : FAIL (TacheCard not found)

- [ ] **Step 3 : Implémenter TacheCard**

Créer `src/components/taches/tache-card.tsx` :

```typescript
'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tache } from '@/lib/supabase/types'

type TacheWithRelations = Tache & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
}

interface TacheCardProps {
  tache: TacheWithRelations
}

const PRIORITE_COLORS: Record<string, string> = {
  haute: 'text-red-400 bg-red-400/10',
  normale: 'text-amber-400 bg-amber-400/10',
  basse: 'text-slate-400 bg-slate-400/10',
}

const PRIORITE_LABELS: Record<string, string> = {
  haute: 'Haute',
  normale: 'Normale',
  basse: 'Basse',
}

export function TacheCard({ tache }: TacheCardProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [checked, setChecked] = useState(tache.statut === 'fait')
  const [isToggling, setIsToggling] = useState(false)

  const isLate =
    tache.date_echeance != null &&
    new Date(tache.date_echeance) < new Date() &&
    !checked

  const toggleStatut = async () => {
    if (isToggling) return
    setIsToggling(true)
    const prev = checked
    const newStatut = checked ? 'a_faire' : 'fait'
    setChecked(!checked)

    const res = await fetch(`/api/taches/${tache.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    })
    if (!res.ok) setChecked(prev)
    else router.refresh()
    setIsToggling(false)
  }

  const formattedDate = tache.date_echeance
    ? new Date(tache.date_echeance).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div
      className={`bg-slate-800 rounded-xl p-4 flex gap-3 items-start transition-opacity${checked ? ' opacity-50' : ''}`}
    >
      <button
        onClick={toggleStatut}
        disabled={isToggling}
        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors${
          checked
            ? ' bg-sky-500 border-sky-500'
            : ' border-slate-600 hover:border-sky-400'
        }`}
        aria-label={checked ? 'Marquer à faire' : 'Marquer comme fait'}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-white text-sm font-medium leading-snug">{tache.titre}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITE_COLORS[tache.priorite] ?? ''}`}
            >
              {PRIORITE_LABELS[tache.priorite] ?? tache.priorite}
            </span>
            <button
              onClick={() => dialogRef.current?.showModal()}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Modifier la tâche"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 2.5l2 2-9 9H2.5v-2L11.5 2.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {formattedDate && (
          <p className={`text-xs${isLate ? ' text-red-400 font-medium' : ' text-slate-400'}`}>
            {isLate ? '⚠ ' : ''}Échéance : {formattedDate}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          {tache.client && (
            <Link
              href={`/clients/${tache.client.id}`}
              className="hover:text-sky-400 truncate max-w-[140px]"
            >
              {tache.client.nom}
            </Link>
          )}
          {tache.projet && (
            <Link
              href={`/projets/${tache.projet.id}`}
              className="hover:text-sky-400 truncate max-w-[140px]"
            >
              📁 {tache.projet.titre}
            </Link>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close()
        }}
      >
        <TacheEditContent
          tache={tache}
          onClose={() => dialogRef.current?.close()}
        />
      </dialog>
    </div>
  )
}

interface TacheEditContentProps {
  tache: TacheWithRelations
  onClose: () => void
}

function TacheEditContent({ tache, onClose }: TacheEditContentProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const dateRaw = fd.get('date_echeance') as string
    const body = {
      titre: fd.get('titre') as string,
      priorite: fd.get('priorite') as string,
      statut: fd.get('statut') as string,
      date_echeance: dateRaw ? new Date(dateRaw).toISOString() : null,
      description: (fd.get('description') as string) || null,
      notification_active: fd.get('notification_active') === 'on',
      notification_email: fd.get('notification_email') === 'on',
      notification_push: fd.get('notification_push') === 'on',
    }

    try {
      const res = await fetch(`/api/taches/${tache.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette tâche ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/taches/${tache.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur')
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsDeleting(false)
    }
  }

  const currentDate = tache.date_echeance
    ? new Date(tache.date_echeance).toISOString().split('T')[0]
    : ''

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Modifier la tâche</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Titre *</label>
        <input
          name="titre"
          required
          defaultValue={tache.titre}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Priorité</label>
          <select
            name="priorite"
            defaultValue={tache.priorite}
            className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="haute">Haute</option>
            <option value="normale">Normale</option>
            <option value="basse">Basse</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Statut</label>
          <select
            name="statut"
            defaultValue={tache.statut}
            className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="a_faire">À faire</option>
            <option value="fait">Fait</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Échéance</label>
        <input
          name="date_echeance"
          type="date"
          defaultValue={currentDate}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={tache.description ?? ''}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-400">Notifications</p>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="notification_active"
            defaultChecked={tache.notification_active}
            className="accent-sky-500"
          />
          Activer les rappels
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="notification_email"
            defaultChecked={tache.notification_email}
            className="accent-sky-500"
          />
          Email
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="notification_push"
            defaultChecked={tache.notification_push}
            className="accent-sky-500"
          />
          Push
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50"
        >
          {isDeleting ? 'Suppression…' : 'Supprimer'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
npx jest src/components/taches/__tests__/tache-card.test.tsx --no-coverage
```

Expected : PASS (6 tests)

- [ ] **Step 5 : Commit**

```bash
git add src/components/taches/tache-card.tsx src/components/taches/__tests__/tache-card.test.tsx
git commit -m "feat: add TacheCard with optimistic toggle and inline edit/delete modal"
```

---

## Task 4 : TachesFilters + Page /taches + loading skeleton

**Files:**
- Create: `src/components/taches/taches-filters.tsx`
- Modify: `src/app/(app)/taches/page.tsx`
- Create: `src/app/(app)/taches/loading.tsx`

- [ ] **Step 1 : Créer TachesFilters**

Créer `src/components/taches/taches-filters.tsx` :

```typescript
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

interface TachesFiltersProps {
  search: string
  statut: string
  priorite: string
}

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'a_faire', label: 'À faire' },
  { value: 'fait', label: 'Faits' },
]

const PRIORITES = [
  { value: '', label: 'Toutes' },
  { value: 'haute', label: '🔴 Haute' },
  { value: 'normale', label: '🟡 Normale' },
  { value: 'basse', label: '⚪ Basse' },
]

export function TachesFilters({ search, statut, priorite }: TachesFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => updateParam('search', e.target.value), 350)
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Rechercher une tâche…"
        defaultValue={search}
        onChange={handleSearch}
        className="w-full bg-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex gap-2 flex-wrap">
        {STATUTS.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam('statut', s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statut === s.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1" />
        {PRIORITES.map((p) => (
          <button
            key={p.value}
            onClick={() => updateParam('priorite', p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              priorite === p.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer le loading skeleton**

Créer `src/app/(app)/taches/loading.tsx` :

```typescript
export default function TachesLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-16 bg-slate-800 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Implémenter la page /taches**

Remplacer `src/app/(app)/taches/page.tsx` :

```typescript
import { createClient } from '@/lib/supabase/server'
import { TacheCard } from '@/components/taches/tache-card'
import { TachesFilters } from '@/components/taches/taches-filters'
import { TacheForm } from '@/components/taches/tache-form'
import type { Tache } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    statut?: string
    priorite?: string
    page?: string
  }>
}

const PER_PAGE = 20

export default async function TachesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const statut = sp.statut ?? ''
  const priorite = sp.priorite ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const supabase = await createClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('taches')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('date_echeance', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('titre', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (priorite) query = query.eq('priorite', priorite)

  const { data: taches, count, error } = await query

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
          Tâches
          {count !== null && (
            <span className="ml-2 text-slate-400 text-base font-normal">({count})</span>
          )}
        </h1>
        <TacheForm />
      </div>

      <TachesFilters search={search} statut={statut} priorite={priorite} />

      {taches && taches.length > 0 ? (
        <div className="space-y-3">
          {taches.map((tache) => (
            <TacheCard
              key={tache.id}
              tache={
                tache as Tache & {
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
            {search || statut || priorite
              ? 'Aucune tâche ne correspond aux filtres'
              : 'Aucune tâche. Créez la première !'}
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

- [ ] **Step 4 : Vérifier le build**

```bash
npx tsc --noEmit
```

Expected : 0 errors

- [ ] **Step 5 : Lancer tous les tests**

```bash
npx jest --no-coverage
```

Expected : tous les tests passent (précédents + nouveaux)

- [ ] **Step 6 : Commit**

```bash
git add src/components/taches/taches-filters.tsx src/app/(app)/taches/page.tsx src/app/(app)/taches/loading.tsx
git commit -m "feat: implement /taches page with filters, pagination, and loading skeleton"
```

---

## Task 5 : Mise à jour TacheForm (activation notifications)

**Files:**
- Modify: `src/components/taches/tache-form.tsx`

Le formulaire de création câble désormais les vraies notifications en DB. Le texte placeholder "câblage Plan 4" disparaît.

- [ ] **Step 1 : Mettre à jour TacheForm**

Remplacer le contenu de `src/components/taches/tache-form.tsx` :

```typescript
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TacheFormProps {
  projetId?: string
  clientId?: string
}

export function TacheForm({ projetId, clientId }: TacheFormProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [notifActive, setNotifActive] = useState(false)

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
    const dateRaw = fd.get('date_echeance') as string
    const body = {
      titre: fd.get('titre') as string,
      priorite: fd.get('priorite') as string,
      date_echeance: dateRaw ? new Date(dateRaw).toISOString() : null,
      description: (fd.get('description') as string) || null,
      notification_active: fd.get('notification_active') === 'on',
      notification_email: fd.get('notification_email') === 'on',
      notification_push: fd.get('notification_push') === 'on',
      client_id: clientId ?? null,
      projet_id: projetId ?? null,
    }

    try {
      const url = projetId ? `/api/projets/${projetId}/taches` : '/api/taches'
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
        + Nouvelle tâche
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-slate-800 text-white m-auto"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold">Nouvelle tâche</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Titre *</label>
            <input
              name="titre"
              required
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Envoyer le devis"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Priorité</label>
              <select
                name="priorite"
                defaultValue="normale"
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="haute">Haute</option>
                <option value="normale">Normale</option>
                <option value="basse">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Échéance</label>
              <input
                name="date_echeance"
                type="date"
                className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                name="notification_active"
                className="accent-sky-500"
                onChange={(e) => setNotifActive(e.target.checked)}
              />
              Activer les rappels
            </label>

            {notifActive && (
              <div className="ml-6 space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" name="notification_email" className="accent-sky-500" />
                  Email (J-1 et J0)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" name="notification_push" className="accent-sky-500" />
                  Notification push
                </label>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
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
              {isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected : 0 errors, tous tests passent

- [ ] **Step 3 : Commit**

```bash
git add src/components/taches/tache-form.tsx
git commit -m "feat: wire notification checkboxes in TacheForm (active/email/push)"
```

---

## Task 6 : Notifications email Resend — setup, template, route

**Files:**
- Create: `src/lib/email/rappel-template.ts`
- Create: `src/lib/email/__tests__/rappel-template.test.ts`
- Create: `src/app/api/notifications/email/route.ts`

- [ ] **Step 1 : Installer Resend**

```bash
npm install resend
```

Expected : package ajouté dans node_modules et package.json

- [ ] **Step 2 : Ajouter RESEND_API_KEY à .env.local**

Ajouter cette ligne dans `.env.local` (la vraie clé est disponible sur resend.com) :

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Note : remplacer la valeur par la vraie clé API Resend. Pour les tests locaux, la clé de test Resend commence par `re_`.

- [ ] **Step 3 : Écrire les tests du template qui échouent**

Créer `src/lib/email/__tests__/rappel-template.test.ts` :

```typescript
import { rappelEmailHtml } from '../rappel-template'

describe('rappelEmailHtml', () => {
  it('contient le titre de la tâche', () => {
    const html = rappelEmailHtml({
      titreTache: 'Envoyer le devis Carrefour',
      dateEcheance: '28 mai 2026',
      clientNom: 'Carrefour Grand Nord',
      projetTitre: null,
      isToday: false,
    })
    expect(html).toContain('Envoyer le devis Carrefour')
  })

  it('affiche "Rappel tâche demain" quand isToday=false', () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '29 mai 2026',
      clientNom: null,
      projetTitre: null,
      isToday: false,
    })
    expect(html).toContain('Rappel tâche demain')
  })

  it("affiche \"Tâche à faire aujourd'hui\" quand isToday=true", () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '28 mai 2026',
      clientNom: null,
      projetTitre: null,
      isToday: true,
    })
    expect(html).toContain("Tâche à faire aujourd'hui")
  })

  it('inclut le contexte client et projet quand fournis', () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '28 mai 2026',
      clientNom: 'Carrefour',
      projetTitre: 'Installation PV',
      isToday: false,
    })
    expect(html).toContain('Carrefour')
    expect(html).toContain('Installation PV')
  })

  it('retourne du HTML valide (doctype + body)', () => {
    const html = rappelEmailHtml({
      titreTache: 'Test',
      dateEcheance: '28 mai 2026',
      clientNom: null,
      projetTitre: null,
      isToday: false,
    })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })
})
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils échouent**

```bash
npx jest src/lib/email/__tests__/rappel-template.test.ts --no-coverage
```

Expected : FAIL (rappel-template module not found)

- [ ] **Step 5 : Créer le template email**

Créer `src/lib/email/rappel-template.ts` :

```typescript
interface RappelEmailProps {
  titreTache: string
  dateEcheance: string
  clientNom: string | null
  projetTitre: string | null
  isToday: boolean
}

export function rappelEmailHtml({
  titreTache,
  dateEcheance,
  clientNom,
  projetTitre,
  isToday,
}: RappelEmailProps): string {
  const sujet = isToday ? "Tâche à faire aujourd'hui" : 'Rappel tâche demain'
  const contexte = [clientNom, projetTitre].filter(Boolean).join(' — ')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atexia-crm.vercel.app'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:16px;padding:28px;color:#e2e8f0;">
    <div style="margin-bottom:20px;">
      <span style="background:#0ea5e9;color:white;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;">ATEXIA CRM</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#f1f5f9;">${sujet}</h1>
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#f1f5f9;">${escapeHtml(titreTache)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">📅 Échéance : ${escapeHtml(dateEcheance)}</p>
    ${contexte ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">${escapeHtml(contexte)}</p>` : ''}
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #334155;">
      <a href="${appUrl}/taches" style="display:inline-block;background:#0ea5e9;color:white;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Ouvrir les tâches →</a>
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

- [ ] **Step 6 : Créer la route POST /api/notifications/email**

Créer le dossier `src/app/api/notifications/email/` puis créer `route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { rappelEmailHtml } from '@/lib/email/rappel-template'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const SendEmailSchema = z.object({
  tacheId: z.string().uuid(),
  isToday: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = SendEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data: tache, error: tacheError } = await supabase
    .from('taches')
    .select('*, client:clients(nom), projet:projets(titre)')
    .eq('id', parsed.data.tacheId)
    .single()

  if (tacheError || !tache) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  const dateEcheance = tache.date_echeance
    ? new Date(tache.date_echeance).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'Non définie'

  const clientNom = (tache.client as { nom: string } | null)?.nom ?? null
  const projetTitre = (tache.projet as { titre: string } | null)?.titre ?? null

  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA CRM <notifications@atexia.re>',
    to: user.email!,
    subject: parsed.data.isToday
      ? `⏰ Tâche aujourd'hui : ${tache.titre}`
      : `🔔 Rappel demain : ${tache.titre}`,
    html: rappelEmailHtml({
      titreTache: tache.titre,
      dateEcheance,
      clientNom,
      projetTitre,
      isToday: parsed.data.isToday,
    }),
  })

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
```

- [ ] **Step 7 : Lancer les tests template — vérifier qu'ils passent**

```bash
npx jest src/lib/email/__tests__/rappel-template.test.ts --no-coverage
```

Expected : PASS (5 tests)

- [ ] **Step 8 : Commit**

```bash
git add src/lib/email/ src/app/api/notifications/email/ package.json package-lock.json
git commit -m "feat: add Resend email notifications — template + POST /api/notifications/email"
```

---

## Task 7 : Cron quotidien rappels J-1 et J0

**Files:**
- Create: `src/app/api/cron/rappels/route.ts`
- Create: `vercel.json`

- [ ] **Step 1 : Créer la route cron**

Créer `src/app/api/cron/rappels/route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { rappelEmailHtml } from '@/lib/email/rappel-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  const { data: taches, error } = await supabase
    .from('taches')
    .select('*, client:clients(nom), projet:projets(titre)')
    .eq('statut', 'a_faire')
    .eq('notification_active', true)
    .gte('date_echeance', today.toISOString())
    .lt('date_echeance', dayAfterTomorrow.toISOString())

  if (error) {
    console.error('[cron/rappels] Erreur Supabase:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const toEmail = user?.email ?? process.env.NOTIF_EMAIL

  if (!toEmail) {
    return NextResponse.json({ error: 'Aucun email destinataire' }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const tache of taches ?? []) {
    if (!tache.notification_email) continue

    const echeance = new Date(tache.date_echeance!)
    const isToday = echeance >= today && echeance < tomorrow

    const dateEcheance = echeance.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const clientNom = (tache.client as { nom: string } | null)?.nom ?? null
    const projetTitre = (tache.projet as { titre: string } | null)?.titre ?? null

    const { error: emailError } = await resend.emails.send({
      from: 'ATEXIA CRM <notifications@atexia.re>',
      to: toEmail,
      subject: isToday
        ? `⏰ Tâche aujourd'hui : ${tache.titre}`
        : `🔔 Rappel demain : ${tache.titre}`,
      html: rappelEmailHtml({
        titreTache: tache.titre,
        dateEcheance,
        clientNom,
        projetTitre,
        isToday,
      }),
    })

    if (emailError) {
      console.error(`[cron/rappels] Email failed for tache ${tache.id}:`, emailError)
      failed++
    } else {
      sent++
    }
  }

  return NextResponse.json({ processed: (taches ?? []).length, sent, failed })
}
```

- [ ] **Step 2 : Créer vercel.json pour le cron**

Vérifier si `vercel.json` existe déjà à la racine du projet. Si non, créer `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/rappels",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Note : `0 3 * * *` = 3h UTC = 7h heure La Réunion (UTC+4). Ajuster si besoin.

- [ ] **Step 3 : Ajouter NOTIF_EMAIL à .env.local**

Ajouter dans `.env.local` :

```
NOTIF_EMAIL=inizan.yoann@gmail.com
CRON_SECRET=un-secret-aleatoire-long
```

Note : `CRON_SECRET` doit être ajouté dans les variables d'environnement Vercel également.

- [ ] **Step 4 : Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 errors

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/cron/rappels/route.ts vercel.json
git commit -m "feat: add daily cron /api/cron/rappels for J-1/J0 email reminders"
```

---

## Task 8 : Web Push — setup VAPID, table Supabase, service worker, route subscribe

**Files:**
- Modify: `src/lib/supabase/types.ts`
- Create: `worker/index.js`
- Modify: `next.config.js`
- Create: `src/app/api/notifications/subscribe/route.ts`

- [ ] **Step 1 : Installer web-push et ses types**

```bash
npm install web-push
npm install --save-dev @types/web-push
```

Expected : packages ajoutés

- [ ] **Step 2 : Générer les clés VAPID**

```bash
npx web-push generate-vapid-keys
```

Expected : output ressemblant à :
```
Public Key: Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

Copier ces deux valeurs.

- [ ] **Step 3 : Ajouter les clés VAPID à .env.local**

Ajouter dans `.env.local` avec les vraies valeurs générées :

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
VAPID_EMAIL=notifications@atexia.re
```

Note : ajouter aussi ces 3 variables dans Vercel Environment Variables.

- [ ] **Step 4 : Créer la table push_subscriptions dans Supabase**

Via le MCP Supabase (outil `execute_sql` ou `apply_migration`), exécuter :

```sql
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON public.push_subscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

- [ ] **Step 5 : Ajouter le type PushSubscription dans types.ts**

Ajouter dans `src/lib/supabase/types.ts`, dans la section `Tables` du type `Database` (après `taches`), avant le `}` de `Tables`:

```typescript
      push_subscriptions: {
        Row: {
          id: string
          endpoint: string
          p256dh: string
          auth_key: string
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          p256dh: string
          auth_key: string
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          p256dh?: string
          auth_key?: string
          created_at?: string
        }
        Relationships: []
      }
```

Ajouter aussi l'export du type dérivé, après `export type ModuleConfig` :

```typescript
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
```

- [ ] **Step 6 : Créer le service worker custom pour les push events**

Créer le dossier `worker/` à la racine du projet, puis créer `worker/index.js` :

```javascript
// Gestion des notifications push reçues par le navigateur
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'ATEXIA CRM'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/taches' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(event.notification.data.url)
    })
  )
})
```

- [ ] **Step 7 : Mettre à jour next.config.js pour inclure le worker custom**

Remplacer le contenu de `next.config.js` :

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 8 : Créer la route POST /api/notifications/subscribe**

Créer `src/app/api/notifications/subscribe/route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = SubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth_key: parsed.data.auth,
      },
      { onConflict: 'endpoint' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ subscribed: true }, { status: 201 })
}
```

- [ ] **Step 9 : Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 errors

- [ ] **Step 10 : Commit**

```bash
git add src/lib/supabase/types.ts worker/index.js next.config.js src/app/api/notifications/subscribe/route.ts package.json package-lock.json
git commit -m "feat: Web Push setup — VAPID, push_subscriptions table, service worker, /api/notifications/subscribe"
```

---

## Task 9 : Route push + PushPrompt UI + câblage cron

**Files:**
- Create: `src/lib/notifications/push.ts`
- Create: `src/app/api/notifications/push/route.ts`
- Create: `src/components/notifications/push-prompt.tsx`
- Modify: `src/app/api/cron/rappels/route.ts`
- Modify: `src/app/(app)/taches/page.tsx`

- [ ] **Step 1 : Créer le helper sendPushNotification**

Créer `src/lib/notifications/push.ts` :

```typescript
import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'notifications@atexia.re'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushPayload {
  title: string
  body: string
  url?: string
}

interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth_key: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_key,
      },
    },
    JSON.stringify(payload)
  )
}
```

- [ ] **Step 2 : Créer la route POST /api/notifications/push**

Créer `src/app/api/notifications/push/route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/notifications/push'
import { z } from 'zod'

const PushSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(500).optional().default(''),
  url: z.string().optional().default('/taches'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = PushSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  const expired: string[] = []

  for (const sub of subscriptions ?? []) {
    try {
      await sendPushNotification(sub, parsed.data)
      sent++
    } catch (err) {
      const isExpired =
        err instanceof Error &&
        (err.message.includes('410') || err.message.includes('404'))
      if (isExpired) expired.push(sub.endpoint)
    }
  }

  if (expired.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expired)
  }

  return NextResponse.json({ sent, expired: expired.length })
}
```

- [ ] **Step 3 : Mettre à jour le cron pour envoyer aussi les push**

Remplacer `src/app/api/cron/rappels/route.ts` :

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { rappelEmailHtml } from '@/lib/email/rappel-template'
import { sendPushNotification } from '@/lib/notifications/push'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  const { data: taches, error } = await supabase
    .from('taches')
    .select('*, client:clients(nom), projet:projets(titre)')
    .eq('statut', 'a_faire')
    .eq('notification_active', true)
    .gte('date_echeance', today.toISOString())
    .lt('date_echeance', dayAfterTomorrow.toISOString())

  if (error) {
    console.error('[cron/rappels] Erreur Supabase:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const toEmail = user?.email ?? process.env.NOTIF_EMAIL

  const { data: pushSubscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  let emailSent = 0
  let pushSent = 0
  const expiredEndpoints: string[] = []

  for (const tache of taches ?? []) {
    const echeance = new Date(tache.date_echeance!)
    const isToday = echeance >= today && echeance < tomorrow
    const clientNom = (tache.client as { nom: string } | null)?.nom ?? null
    const projetTitre = (tache.projet as { titre: string } | null)?.titre ?? null

    const pushTitle = isToday ? `⏰ Aujourd'hui : ${tache.titre}` : `🔔 Demain : ${tache.titre}`
    const pushBody = [clientNom, projetTitre].filter(Boolean).join(' — ')

    if (tache.notification_email && toEmail) {
      const dateEcheance = echeance.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const { error: emailError } = await resend.emails.send({
        from: 'ATEXIA CRM <notifications@atexia.re>',
        to: toEmail,
        subject: isToday
          ? `⏰ Tâche aujourd'hui : ${tache.titre}`
          : `🔔 Rappel demain : ${tache.titre}`,
        html: rappelEmailHtml({ titreTache: tache.titre, dateEcheance, clientNom, projetTitre, isToday }),
      })
      if (!emailError) emailSent++
    }

    if (tache.notification_push) {
      for (const sub of pushSubscriptions ?? []) {
        try {
          await sendPushNotification(sub, { title: pushTitle, body: pushBody, url: '/taches' })
          pushSent++
        } catch (err) {
          const isExpired =
            err instanceof Error &&
            (err.message.includes('410') || err.message.includes('404'))
          if (isExpired && !expiredEndpoints.includes(sub.endpoint)) {
            expiredEndpoints.push(sub.endpoint)
          }
        }
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
  }

  return NextResponse.json({
    processed: (taches ?? []).length,
    emailSent,
    pushSent,
    expiredCleaned: expiredEndpoints.length,
  })
}
```

- [ ] **Step 4 : Créer le composant PushPrompt**

Créer `src/components/notifications/push-prompt.tsx` :

```typescript
'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export function PushPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') setSubscribed(true)
    }
  }, [])

  const subscribe = async () => {
    setIsSubscribing(true)
    setError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('Clé VAPID manquante')

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const p256dhKey = sub.getKey('p256dh')
      const authKey = sub.getKey('auth')
      if (!p256dhKey || !authKey) throw new Error('Clés de souscription manquantes')

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)))
      const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)))

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, p256dh, auth }),
      })

      if (!res.ok) throw new Error('Erreur sauvegarde abonnement')
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsSubscribing(false)
    }
  }

  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  if (subscribed) {
    return (
      <p className="text-green-400 text-sm flex items-center gap-1.5">
        <span>✓</span> Notifications push activées
      </p>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-white text-sm font-medium">Activer les notifications push</p>
        <p className="text-slate-400 text-xs mt-0.5">
          Recevez des rappels même quand l'application est fermée.
        </p>
      </div>
      <button
        onClick={subscribe}
        disabled={isSubscribing || permission === 'denied'}
        className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-sky-400 transition-colors"
      >
        {isSubscribing ? 'Activation…' : 'Activer'}
      </button>
      {permission === 'denied' && (
        <p className="text-red-400 text-xs">
          Notifications bloquées dans le navigateur. Modifiez les paramètres du site.
        </p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5 : Ajouter PushPrompt à la page /taches**

Modifier `src/app/(app)/taches/page.tsx` : ajouter l'import et afficher PushPrompt en bas de page.

Ajouter l'import après les autres imports :

```typescript
import { PushPrompt } from '@/components/notifications/push-prompt'
```

Ajouter avant la fermeture `</div>` de la page (après la pagination) :

```typescript
      <div className="pt-4">
        <PushPrompt />
      </div>
```

- [ ] **Step 6 : Vérifier le build TypeScript complet**

```bash
npx tsc --noEmit
```

Expected : 0 errors

- [ ] **Step 7 : Lancer tous les tests**

```bash
npx jest --no-coverage
```

Expected : tous les tests passent

- [ ] **Step 8 : Build de production**

```bash
npm run build
```

Expected : build réussi sans erreur

- [ ] **Step 9 : Commit final**

```bash
git add src/lib/notifications/ src/app/api/notifications/push/ src/app/api/cron/rappels/route.ts src/components/notifications/ src/app/(app)/taches/page.tsx
git commit -m "feat: complete Plan 4 — Web Push send route, PushPrompt UI, cron sends email+push"
```

- [ ] **Step 10 : Push et vérifier Vercel**

```bash
git push origin main
```

Vérifier sur Vercel :
1. Le build passe
2. La page `/taches` s'affiche avec la liste et les filtres
3. Le bouton "Activer les notifications push" apparaît en bas de page
4. Sur `/api/cron/rappels` (GET avec `Authorization: Bearer <CRON_SECRET>`), la réponse JSON indique `processed`, `emailSent`, `pushSent`

---

## Checklist de vérification finale

- [ ] `npx jest --no-coverage` → tous les tests passent (≥ 62 tests attendus)
- [ ] `npm run build` → 0 erreur TypeScript, 0 erreur de build
- [ ] Page `/taches` — liste, filtres search/statut/priorité, pagination fonctionnels
- [ ] Toggle statut optimiste sur TacheCard (checkbox)
- [ ] Édition d'une tâche via TacheCard → modal → PUT `/api/taches/[id]`
- [ ] Suppression d'une tâche → DELETE `/api/taches/[id]` → disparaît de la liste
- [ ] Route `GET /api/cron/rappels` retourne `{ processed, emailSent, pushSent }`
- [ ] `vercel.json` cron configuré à `0 3 * * *`
- [ ] `worker/index.js` push/notificationclick handlers présents
- [ ] `PushPrompt` visible en bas de page, fonctionnel sur navigateur compatible
