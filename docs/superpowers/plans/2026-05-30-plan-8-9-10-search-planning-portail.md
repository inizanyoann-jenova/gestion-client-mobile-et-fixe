# Améliorations #8 Recherche · #9 Planning · #10 Portail Signature — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la recherche globale instantanée, un calendrier de planning et un portail de signature électronique de devis à l'application ATEXIA CRM.

**Architecture:** Trois features indépendantes à implémenter séquentiellement. La recherche utilise un composant modal auto-contenu avec debounce 300ms et 4 requêtes Supabase parallèles. Le planning normalise les données hétérogènes en `CalendarEvent[]` et les affiche dans un CSS grid custom. Le portail de signature génère un token UUID à durée limitée, expose une page publique (hors layout auth), et notifie le gérant via Web Push.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase (auth + service-role), Tailwind dark theme, Zod, Resend, Web Push API, React Testing Library + Jest

---

## Fichiers créés / modifiés

### #8 Recherche
- **Créer** `src/lib/search/types.ts` — types SearchResult
- **Créer** `src/app/api/search/route.ts` — GET avec 4 requêtes parallèles
- **Créer** `src/components/search/search-modal.tsx` — modal auto-contenu (trigger + overlay)
- **Créer** `src/components/search/__tests__/search-modal.test.tsx`
- **Modifier** `src/app/(app)/layout.tsx` — ajouter `<SearchModal />`
- **Modifier** `src/app/(app)/clients/page.tsx` — loupe dans le header
- **Modifier** `src/app/(app)/projets/page.tsx` — loupe dans le header
- **Modifier** `src/app/(app)/taches/page.tsx` — loupe dans le header
- **Modifier** `src/app/(app)/echanges/page.tsx` — loupe dans le header
- **Modifier** `src/app/(app)/documents/page.tsx` — loupe dans le header
- **Modifier** `src/app/(app)/finances/page.tsx` — loupe dans le header
- **Modifier** `src/app/(app)/page.tsx` — loupe dans le header

### #9 Planning
- **Créer** `src/lib/planning/types.ts` — CalendarEvent, PlanningData
- **Créer** `src/lib/planning/normalize-events.ts` — normalisation des 4 sources
- **Créer** `src/lib/planning/__tests__/normalize-events.test.ts`
- **Créer** `src/components/planning/planning-calendar.tsx` — CSS grid client component
- **Créer** `src/components/planning/__tests__/planning-calendar.test.tsx`
- **Créer** `src/app/(app)/planning/page.tsx` — Server Component (chargement données)
- **Créer** `src/app/(app)/planning/loading.tsx`
- **Modifier** `src/app/(app)/plus/page.tsx` — ajouter lien Planning

### #10 Portail Signature
- **Modifier** `src/lib/supabase/types.ts` — ajouter table `devis_tokens`
- **Modifier** `src/lib/supabase/finance-types.ts` — ajouter `DevisToken`
- **Créer** `src/app/api/devis/[id]/envoyer-signature/route.ts`
- **Créer** `src/app/api/devis/signer/route.ts` — public, sans auth
- **Créer** `src/app/devis/layout.tsx` — layout minimal public
- **Créer** `src/app/devis/[token]/page.tsx` — page publique de signature
- **Créer** `src/app/devis/[token]/confirme/page.tsx` — confirmation
- **Créer** `src/components/finances/signature-form.tsx` — formulaire de signature (client)
- **Créer** `src/components/finances/envoyer-signature-button.tsx`
- **Créer** `src/components/finances/__tests__/signature-form.test.tsx`
- **Créer** `src/components/finances/__tests__/envoyer-signature-button.test.tsx`
- **Modifier** `src/app/(app)/finances/devis/[id]/page.tsx` — ajouter bouton EnvoyerSignature

---

## SECTION A — #8 Recherche globale instantanée

### Task 1 : Types + API route GET /api/search

**Files:**
- Create: `src/lib/search/types.ts`
- Create: `src/app/api/search/route.ts`

- [ ] **Étape 1 : Créer les types de recherche**

```typescript
// src/lib/search/types.ts
export interface SearchResult {
  clients: Array<{ id: string; nom: string; ville: string | null }>
  projets: Array<{ id: string; titre: string; statut: string }>
  contacts: Array<{ id: string; nom: string; email: string | null; telephone: string | null; client_id: string }>
  devis: Array<{ id: string; numero: string; statut: string }>
}
```

- [ ] **Étape 2 : Créer l'API route**

```typescript
// src/app/api/search/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) {
    return NextResponse.json({ clients: [], projets: [], contacts: [], devis: [] })
  }

  const [clientsRes, projetsRes, contactsRes, devisRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, nom, ville')
      .or(`nom.ilike.%${q}%,ville.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('projets')
      .select('id, titre, statut')
      .ilike('titre', `%${q}%`)
      .limit(5),
    supabase
      .from('contacts')
      .select('id, nom, email, telephone, client_id')
      .or(`nom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('devis')
      .select('id, numero, statut')
      .ilike('numero', `%${q}%`)
      .limit(5),
  ])

  return NextResponse.json({
    clients: clientsRes.data ?? [],
    projets: projetsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    devis: devisRes.data ?? [],
  })
}
```

- [ ] **Étape 3 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 4 : Commit**

```bash
git add src/lib/search/types.ts src/app/api/search/route.ts
git commit -m "feat(search): API route GET /api/search — 4 requêtes Supabase parallèles"
```

---

### Task 2 : Composant SearchModal

**Files:**
- Create: `src/components/search/search-modal.tsx`
- Create: `src/components/search/__tests__/search-modal.test.tsx`

- [ ] **Étape 1 : Écrire les tests (TDD)**

```typescript
// src/components/search/__tests__/search-modal.test.tsx
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { SearchModal } from '../search-modal'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  global.fetch = jest.fn()
  jest.useFakeTimers()
  mockPush.mockReset()
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe('SearchModal', () => {
  it('affiche le bouton loupe par défaut', () => {
    render(<SearchModal />)
    expect(screen.getByLabelText('Ouvrir la recherche')).toBeInTheDocument()
  })

  it('ouvre le modal au clic sur le bouton loupe', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('ferme le modal sur la touche Échap', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByPlaceholderText(/rechercher/i)).not.toBeInTheDocument()
  })

  it("ne déclenche pas fetch si la saisie est inférieure à 2 caractères", () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'a' } })
    act(() => { jest.advanceTimersByTime(400) })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('déclenche fetch après 300ms de debounce', () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clients: [], projets: [], contacts: [], devis: [] }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'ca' } })
    expect(global.fetch).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(300) })
    expect(global.fetch).toHaveBeenCalledWith('/api/search?q=ca')
  })

  it('affiche les clients dans les résultats', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [{ id: '1', nom: 'Carrefour Grand Nord', ville: 'Saint-Denis' }],
        projets: [],
        contacts: [],
        devis: [],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'car' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    expect(await screen.findByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('affiche les projets dans les résultats', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [],
        projets: [{ id: '2', titre: 'Câblage réseau', statut: 'en_cours' }],
        contacts: [],
        devis: [],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'cab' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    expect(await screen.findByText('Câblage réseau')).toBeInTheDocument()
  })

  it('affiche "Aucun résultat" si les 4 sources sont vides', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clients: [], projets: [], contacts: [], devis: [] }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'xyz' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    expect(await screen.findByText(/aucun résultat/i)).toBeInTheDocument()
  })

  it('navigue vers /clients/[id] au clic sur un client', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [{ id: 'c1', nom: 'Leclerc', ville: 'Saint-Joseph' }],
        projets: [], contacts: [], devis: [],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'lec' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    fireEvent.click(await screen.findByText('Leclerc'))
    expect(mockPush).toHaveBeenCalledWith('/clients/c1')
  })

  it('navigue vers /finances/devis/[id] au clic sur un devis', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [], projets: [], contacts: [],
        devis: [{ id: 'd1', numero: 'DEV-2026-001', statut: 'envoyé' }],
      }),
    })
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Ouvrir la recherche'))
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'DEV' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    fireEvent.click(await screen.findByText('DEV-2026-001'))
    expect(mockPush).toHaveBeenCalledWith('/finances/devis/d1')
  })
})
```

- [ ] **Étape 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
npm test -- --testPathPattern=search-modal
```
Attendu : FAIL (SearchModal n'existe pas encore).

- [ ] **Étape 3 : Implémenter SearchModal**

```typescript
// src/components/search/search-modal.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchResult } from '@/lib/search/types'

const EMPTY: SearchResult = { clients: [], projets: [], contacts: [], devis: [] }

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon', envoyé: 'Envoyé', accepté: 'Accepté',
  refusé: 'Refusé', expiré: 'Expiré', en_cours: 'En cours',
  termine: 'Terminé', planifie: 'Planifié',
}

export function SearchModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>(EMPTY)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults(EMPTY)
  }, [])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  // Focus auto
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults(EMPTY); setLoading(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const navigate = (href: string) => {
    router.push(href)
    close()
  }

  const hasResults =
    results.clients.length + results.projets.length +
    results.contacts.length + results.devis.length > 0

  return (
    <>
      {/* Trigger button */}
      <button
        aria-label="Ouvrir la recherche"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4"
          onClick={close}
        >
          <div
            className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                placeholder="Rechercher un client, projet, contact, devis…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
              />
              {loading && <span className="text-slate-500 text-xs">…</span>}
              <kbd className="hidden md:inline-block text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Échap</kbd>
            </div>

            {/* Résultats */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.length >= 2 && !loading && !hasResults && (
                <p className="text-slate-500 text-sm text-center py-8">Aucun résultat pour &laquo;{query}&raquo;</p>
              )}

              {results.clients.length > 0 && (
                <Section label="Clients">
                  {results.clients.map((c) => (
                    <ResultRow key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                      <span className="text-white text-sm">{c.nom}</span>
                      {c.ville && <span className="text-slate-400 text-xs">{c.ville}</span>}
                    </ResultRow>
                  ))}
                </Section>
              )}

              {results.projets.length > 0 && (
                <Section label="Projets">
                  {results.projets.map((p) => (
                    <ResultRow key={p.id} onClick={() => navigate(`/projets/${p.id}`)}>
                      <span className="text-white text-sm">{p.titre}</span>
                      <span className="text-slate-400 text-xs">{STATUT_LABELS[p.statut] ?? p.statut}</span>
                    </ResultRow>
                  ))}
                </Section>
              )}

              {results.contacts.length > 0 && (
                <Section label="Contacts">
                  {results.contacts.map((c) => (
                    <ResultRow key={c.id} onClick={() => navigate(`/clients/${c.client_id}`)}>
                      <span className="text-white text-sm">{c.nom}</span>
                      {c.email && <span className="text-slate-400 text-xs">{c.email}</span>}
                    </ResultRow>
                  ))}
                </Section>
              )}

              {results.devis.length > 0 && (
                <Section label="Devis">
                  {results.devis.map((d) => (
                    <ResultRow key={d.id} onClick={() => navigate(`/finances/devis/${d.id}`)}>
                      <span className="text-white text-sm font-mono">{d.numero}</span>
                      <span className="text-slate-400 text-xs">{STATUT_LABELS[d.statut] ?? d.statut}</span>
                    </ResultRow>
                  ))}
                </Section>
              )}

              {query.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-6">Tapez au moins 2 caractères pour chercher</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {children}
    </div>
  )
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left"
    >
      {children}
    </button>
  )
}
```

- [ ] **Étape 4 : Lancer les tests — vérifier qu'ils passent**

```bash
npm test -- --testPathPattern=search-modal
```
Attendu : PASS (10 tests).

- [ ] **Étape 5 : Commit**

```bash
git add src/components/search/
git commit -m "feat(search): composant SearchModal avec debounce 300ms et résultats groupés"
```

---

### Task 3 : Intégrer SearchModal dans le layout et les pages

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/app/(app)/clients/page.tsx`
- Modify: `src/app/(app)/projets/page.tsx`
- Modify: `src/app/(app)/taches/page.tsx`
- Modify: `src/app/(app)/echanges/page.tsx`
- Modify: `src/app/(app)/documents/page.tsx`
- Modify: `src/app/(app)/finances/page.tsx`

`SearchModal` est `'use client'` avec son propre état `isOpen`. Il gère le trigger button ET le listener Cmd+K en interne. Un seul `SearchModal` est monté à la fois (navigation App Router), donc pas de double listener. Chaque page le rend dans son header.

- [ ] **Étape 1 : Ajouter le bouton loupe dans la page Dashboard**

Dans `src/app/(app)/page.tsx`, wrapper le titre dans un flex row avec `<SearchModal />` :

Avant (section header existante dans le Dashboard) :
```typescript
// Localiser la ligne du titre h1 dans /page.tsx et ajouter SearchModal à côté
// Exemple de modification du header :
<div className="flex items-center justify-between p-4 pt-6">
  <div>
    <h1 className="text-2xl font-bold text-white">Bonjour</h1>
    <p className="text-slate-400 text-sm mt-0.5">{dateStr}</p>
  </div>
  <SearchModal />
</div>
```

- [ ] **Étape 2 : Ajouter le bouton loupe dans /clients/page.tsx**

Lire le fichier, repérer l'en-tête et ajouter `<SearchModal />` en flex :

```typescript
// Remplacer le header existant de la page clients par :
import { SearchModal } from '@/components/search/search-modal'

// Dans le JSX, changer le titre :
<div className="flex items-center justify-between p-4 pb-2">
  <h1 className="text-xl font-bold text-white">Clients</h1>
  <SearchModal />
</div>
```

- [ ] **Étape 3 : Ajouter le bouton loupe dans /projets/page.tsx, /taches/page.tsx, /echanges/page.tsx, /documents/page.tsx, /finances/page.tsx**

Même modification pour chaque page : wrapper le `<h1>` dans un flex row avec `<SearchModal />`.

Pattern à appliquer (adapter selon le JSX existant de chaque page) :
```typescript
import { SearchModal } from '@/components/search/search-modal'

// Dans le header de chaque page :
<div className="flex items-center justify-between p-4 pb-2">
  <h1 className="text-xl font-bold text-white">[Titre de la page]</h1>
  <SearchModal />
</div>
```

- [ ] **Étape 4 : Vérifier compilation TypeScript**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 5 : Lancer tous les tests**

```bash
npm test
```
Attendu : tous les tests existants passent + les 10 tests SearchModal.

- [ ] **Étape 6 : Commit**

```bash
git add src/app/(app)/page.tsx src/app/(app)/clients/page.tsx src/app/(app)/projets/page.tsx src/app/(app)/taches/page.tsx src/app/(app)/echanges/page.tsx src/app/(app)/documents/page.tsx src/app/(app)/finances/page.tsx
git commit -m "feat(search): SearchModal dans les headers des 7 pages principales — loupe + Cmd+K"
```

---

## SECTION B — #9 Planning / Calendrier

### Task 4 : Types + utilitaire normalize-events

**Files:**
- Create: `src/lib/planning/types.ts`
- Create: `src/lib/planning/normalize-events.ts`
- Create: `src/lib/planning/__tests__/normalize-events.test.ts`

- [ ] **Étape 1 : Écrire les types**

```typescript
// src/lib/planning/types.ts
export interface CalendarEvent {
  id: string
  type: 'tache' | 'visite' | 'devis' | 'facture'
  label: string
  date: string  // YYYY-MM-DD
  href: string
  color: 'sky' | 'emerald' | 'amber' | 'red'
}

export interface PlanningData {
  taches: Array<{ id: string; titre: string; date_echeance: string | null; statut: string }>
  interactions: Array<{ id: string; type: string; notes: string | null; date: string | null }>
  devis: Array<{ id: string; numero: string; statut: string; date_validite: string }>
  factures: Array<{ id: string; numero: string; statut: string; date_echeance: string }>
}
```

- [ ] **Étape 2 : Écrire les tests (TDD)**

```typescript
// src/lib/planning/__tests__/normalize-events.test.ts
import { normalizeEvents } from '../normalize-events'

describe('normalizeEvents', () => {
  it('retourne un tableau vide si aucune donnée', () => {
    const result = normalizeEvents({ taches: [], interactions: [], devis: [], factures: [] })
    expect(result).toHaveLength(0)
  })

  it('convertit une tâche en CalendarEvent sky', () => {
    const result = normalizeEvents({
      taches: [{ id: 't1', titre: 'Appeler client', date_echeance: '2026-06-15', statut: 'à_faire' }],
      interactions: [], devis: [], factures: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 't1', type: 'tache', label: 'Appeler client',
      date: '2026-06-15', href: '/taches', color: 'sky',
    })
  })

  it('ignore les tâches sans date_echeance', () => {
    const result = normalizeEvents({
      taches: [{ id: 't1', titre: 'Sans date', date_echeance: null, statut: 'à_faire' }],
      interactions: [], devis: [], factures: [],
    })
    expect(result).toHaveLength(0)
  })

  it('convertit une visite en CalendarEvent emerald', () => {
    const result = normalizeEvents({
      taches: [],
      interactions: [{ id: 'i1', type: 'visite', notes: 'Visite chantier', date: '2026-06-10' }],
      devis: [], factures: [],
    })
    expect(result[0]).toEqual({
      id: 'i1', type: 'visite', label: 'Visite',
      date: '2026-06-10', href: '/echanges', color: 'emerald',
    })
  })

  it('ignore les interactions non-visite', () => {
    const result = normalizeEvents({
      taches: [],
      interactions: [{ id: 'i1', type: 'appel', notes: null, date: '2026-06-01' }],
      devis: [], factures: [],
    })
    expect(result).toHaveLength(0)
  })

  it('ignore les visites sans date', () => {
    const result = normalizeEvents({
      taches: [],
      interactions: [{ id: 'i1', type: 'visite', notes: null, date: null }],
      devis: [], factures: [],
    })
    expect(result).toHaveLength(0)
  })

  it('convertit un devis en CalendarEvent amber', () => {
    const result = normalizeEvents({
      taches: [], interactions: [],
      devis: [{ id: 'd1', numero: 'DEV-2026-001', statut: 'envoyé', date_validite: '2026-06-20' }],
      factures: [],
    })
    expect(result[0]).toEqual({
      id: 'd1', type: 'devis', label: 'DEV-2026-001',
      date: '2026-06-20', href: '/finances/devis/d1', color: 'amber',
    })
  })

  it('convertit une facture en CalendarEvent red', () => {
    const result = normalizeEvents({
      taches: [], interactions: [], devis: [],
      factures: [{ id: 'f1', numero: 'FAC-2026-001', statut: 'émise', date_echeance: '2026-06-30' }],
    })
    expect(result[0]).toEqual({
      id: 'f1', type: 'facture', label: 'FAC-2026-001',
      date: '2026-06-30', href: '/finances/factures/f1', color: 'red',
    })
  })

  it('agrège les 4 sources en un seul tableau', () => {
    const result = normalizeEvents({
      taches: [{ id: 't1', titre: 'Tâche', date_echeance: '2026-06-01', statut: 'à_faire' }],
      interactions: [{ id: 'i1', type: 'visite', notes: null, date: '2026-06-05' }],
      devis: [{ id: 'd1', numero: 'DEV-001', statut: 'envoyé', date_validite: '2026-06-10' }],
      factures: [{ id: 'f1', numero: 'FAC-001', statut: 'émise', date_echeance: '2026-06-15' }],
    })
    expect(result).toHaveLength(4)
  })
})
```

- [ ] **Étape 3 : Lancer les tests — vérifier l'échec**

```bash
npm test -- --testPathPattern=normalize-events
```
Attendu : FAIL.

- [ ] **Étape 4 : Implémenter normalize-events**

```typescript
// src/lib/planning/normalize-events.ts
import type { CalendarEvent, PlanningData } from './types'

export function normalizeEvents(data: PlanningData): CalendarEvent[] {
  const events: CalendarEvent[] = []

  for (const t of data.taches) {
    if (!t.date_echeance) continue
    events.push({ id: t.id, type: 'tache', label: t.titre, date: t.date_echeance, href: '/taches', color: 'sky' })
  }

  for (const i of data.interactions) {
    if (i.type !== 'visite' || !i.date) continue
    events.push({ id: i.id, type: 'visite', label: 'Visite', date: i.date, href: '/echanges', color: 'emerald' })
  }

  for (const d of data.devis) {
    events.push({ id: d.id, type: 'devis', label: d.numero, date: d.date_validite, href: `/finances/devis/${d.id}`, color: 'amber' })
  }

  for (const f of data.factures) {
    events.push({ id: f.id, type: 'facture', label: f.numero, date: f.date_echeance, href: `/finances/factures/${f.id}`, color: 'red' })
  }

  return events
}
```

- [ ] **Étape 5 : Lancer les tests — vérifier le succès**

```bash
npm test -- --testPathPattern=normalize-events
```
Attendu : PASS (9 tests).

- [ ] **Étape 6 : Commit**

```bash
git add src/lib/planning/
git commit -m "feat(planning): types CalendarEvent + utilitaire normalizeEvents"
```

---

### Task 5 : Composant PlanningCalendar

**Files:**
- Create: `src/components/planning/planning-calendar.tsx`
- Create: `src/components/planning/__tests__/planning-calendar.test.tsx`

- [ ] **Étape 1 : Écrire les tests**

```typescript
// src/components/planning/__tests__/planning-calendar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanningCalendar } from '../planning-calendar'
import type { CalendarEvent } from '@/lib/planning/types'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => mockPush.mockReset())

const EVENTS: CalendarEvent[] = [
  { id: '1', type: 'tache', label: 'Appeler Carrefour', date: '2026-06-15', href: '/taches', color: 'sky' },
  { id: '2', type: 'facture', label: 'FAC-001', date: '2026-06-20', href: '/finances/factures/2', color: 'red' },
]

describe('PlanningCalendar', () => {
  it('affiche le mois et l\'année courants', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    expect(screen.getByText(/juin 2026/i)).toBeInTheDocument()
  })

  it('affiche les 7 en-têtes de jours', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    expect(screen.getByText('Lu')).toBeInTheDocument()
    expect(screen.getByText('Ma')).toBeInTheDocument()
    expect(screen.getByText('Di')).toBeInTheDocument()
  })

  it('navigue vers le mois suivant', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByLabelText('Mois suivant'))
    expect(screen.getByText(/juillet 2026/i)).toBeInTheDocument()
  })

  it('navigue vers le mois précédent', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByLabelText('Mois précédent'))
    expect(screen.getByText(/mai 2026/i)).toBeInTheDocument()
  })

  it('navigue de décembre à janvier', () => {
    render(<PlanningCalendar initialMonth="2026-12-01" events={[]} />)
    fireEvent.click(screen.getByLabelText('Mois suivant'))
    expect(screen.getByText(/janvier 2027/i)).toBeInTheDocument()
  })

  it('navigue de janvier à décembre', () => {
    render(<PlanningCalendar initialMonth="2026-01-01" events={[]} />)
    fireEvent.click(screen.getByLabelText('Mois précédent'))
    expect(screen.getByText(/décembre 2025/i)).toBeInTheDocument()
  })

  it("bouton Aujourd'hui ramène au mois initial", () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByLabelText('Mois suivant'))
    expect(screen.getByText(/juillet 2026/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText("Aujourd'hui"))
    expect(screen.getByText(/juin 2026/i)).toBeInTheDocument()
  })

  it('affiche un event sur le bon jour', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    expect(screen.getByText('Appeler Carrefour')).toBeInTheDocument()
  })

  it('navigue vers la fiche au clic sur un event', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByText('Appeler Carrefour'))
    expect(mockPush).toHaveBeenCalledWith('/taches')
  })
})
```

- [ ] **Étape 2 : Lancer les tests — vérifier l'échec**

```bash
npm test -- --testPathPattern=planning-calendar
```
Attendu : FAIL.

- [ ] **Étape 3 : Implémenter PlanningCalendar**

```typescript
// src/components/planning/planning-calendar.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CalendarEvent } from '@/lib/planning/types'

const JOURS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const COLOR_DOT: Record<CalendarEvent['color'], string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

function getMonthCells(year: number, month: number): Array<{ date: string | null; day: number | null }> {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ date: string | null; day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ date: null, day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
  return cells
}

function todayStr(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

interface Props {
  initialMonth: string  // YYYY-MM-DD (1er du mois)
  events: CalendarEvent[]
}

export function PlanningCalendar({ initialMonth, events }: Props) {
  const router = useRouter()
  const parsed = new Date(initialMonth)
  const [year, setYear] = useState(parsed.getFullYear())
  const [month, setMonth] = useState(parsed.getMonth())

  const today = todayStr()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const cells = getMonthCells(year, month)

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []
    acc[ev.date].push(ev)
    return acc
  }, {})

  const goNext = () => month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1)
  const goPrev = () => month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1)
  const goToday = () => { setYear(parsed.getFullYear()); setMonth(parsed.getMonth()) }

  return (
    <div className="bg-slate-900 rounded-2xl p-3 md:p-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button aria-label="Mois précédent" onClick={goPrev} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-lg">
          ‹
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold capitalize text-sm md:text-base">{monthLabel}</span>
          <button onClick={goToday} className="text-xs text-sky-400 hover:text-sky-300 transition-colors px-2 py-0.5 rounded border border-sky-800 hover:border-sky-600">
            Aujourd&apos;hui
          </button>
        </div>
        <button aria-label="Mois suivant" onClick={goNext} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-lg">
          ›
        </button>
      </div>

      {/* En-têtes */}
      <div className="grid grid-cols-7 mb-1">
        {JOURS.map(j => (
          <div key={j} className="text-center text-slate-500 text-xs font-medium py-1">{j}</div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell, idx) => {
          const dayEvents = cell.date ? (eventsByDate[cell.date] ?? []) : []
          const isToday = cell.date === today
          return (
            <div key={idx} className={`min-h-[56px] md:min-h-[72px] p-1 rounded ${cell.day ? 'bg-slate-800' : 'bg-transparent'}`}>
              {cell.day !== null && (
                <>
                  <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${
                    isToday ? 'bg-sky-500 text-white' : 'text-slate-400'
                  }`}>
                    {cell.day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => router.push(ev.href)}
                        className="w-full flex items-center gap-1 rounded hover:bg-slate-700 px-0.5 transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${COLOR_DOT[ev.color]}`} />
                        <span className="text-[10px] text-slate-300 truncate hidden md:block">{ev.label}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-slate-500 pl-0.5">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-800">
        {([['sky', 'Tâche'], ['emerald', 'Visite'], ['amber', 'Devis'], ['red', 'Facture']] as const).map(([c, l]) => (
          <div key={c} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${COLOR_DOT[c]}`} />
            <span className="text-xs text-slate-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Étape 4 : Lancer les tests — vérifier le succès**

```bash
npm test -- --testPathPattern=planning-calendar
```
Attendu : PASS (9 tests).

- [ ] **Étape 5 : Commit**

```bash
git add src/components/planning/
git commit -m "feat(planning): composant PlanningCalendar CSS grid — navigation mois, dots colorés, légende"
```

---

### Task 6 : Page /planning (Server Component) + lien dans /plus

**Files:**
- Create: `src/app/(app)/planning/page.tsx`
- Create: `src/app/(app)/planning/loading.tsx`
- Modify: `src/app/(app)/plus/page.tsx`

- [ ] **Étape 1 : Créer loading.tsx**

```typescript
// src/app/(app)/planning/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function PlanningLoading() {
  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  )
}
```

- [ ] **Étape 2 : Créer page.tsx**

Le Server Component charge les events des 3 mois (mois précédent, courant, suivant) pour permettre la navigation côté client sans rechargement.

```typescript
// src/app/(app)/planning/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PlanningCalendar } from '@/components/planning/planning-calendar'
import { SearchModal } from '@/components/search/search-modal'
import { normalizeEvents } from '@/lib/planning/normalize-events'
import type { PlanningData } from '@/lib/planning/types'

function getDateRange(): { from: string; to: string; initialMonth: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
    initialMonth,
  }
}

export default async function PlanningPage() {
  const supabase = await createClient()
  const { from, to, initialMonth } = getDateRange()

  const [tachesRes, interactionsRes, devisRes, facturesRes] = await Promise.all([
    supabase
      .from('taches')
      .select('id, titre, date_echeance, statut')
      .not('statut', 'eq', 'terminée')
      .gte('date_echeance', from)
      .lte('date_echeance', to),
    supabase
      .from('interactions')
      .select('id, type, notes, date')
      .eq('type', 'visite')
      .gte('date', from)
      .lte('date', to),
    supabase
      .from('devis')
      .select('id, numero, statut, date_validite')
      .in('statut', ['brouillon', 'envoyé'])
      .gte('date_validite', from)
      .lte('date_validite', to),
    supabase
      .from('factures')
      .select('id, numero, statut, date_echeance')
      .in('statut', ['émise', 'en_retard'])
      .gte('date_echeance', from)
      .lte('date_echeance', to),
  ])

  const data: PlanningData = {
    taches: tachesRes.data ?? [],
    interactions: (interactionsRes.data ?? []) as PlanningData['interactions'],
    devis: (devisRes.data ?? []) as PlanningData['devis'],
    factures: (facturesRes.data ?? []) as PlanningData['factures'],
  }

  const events = normalizeEvents(data)

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Planning</h1>
        <SearchModal />
      </div>
      <PlanningCalendar initialMonth={initialMonth} events={events} />
    </div>
  )
}
```

- [ ] **Étape 3 : Ajouter le lien Planning dans /plus**

Dans `src/app/(app)/plus/page.tsx`, ajouter Planning au tableau MODULES :

```typescript
// src/app/(app)/plus/page.tsx
import { ModuleCard } from '@/components/plus/module-card'

const MODULES = [
  { href: '/finances', icon: '💶', label: 'Finances', description: 'Devis et factures' },
  { href: '/planning', icon: '📅', label: 'Planning', description: 'Calendrier des échéances' },
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

- [ ] **Étape 4 : Vérifier compilation TypeScript**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 5 : Lancer tous les tests**

```bash
npm test
```
Attendu : tous les tests passent.

- [ ] **Étape 6 : Vérifier le build**

```bash
npm run build
```
Attendu : build réussi sans erreurs.

- [ ] **Étape 7 : Commit**

```bash
git add src/app/(app)/planning/ src/app/(app)/plus/page.tsx
git commit -m "feat(planning): page /planning avec calendrier mensuel + lien dans /plus"
```

---

## SECTION C — #10 Portail client + signature électronique

### Task 7 : Migration SQL + mise à jour des types

**Files:**
- Modify: `src/lib/supabase/types.ts`
- Modify: `src/lib/supabase/finance-types.ts`

- [ ] **Étape 1 : Appliquer la migration SQL dans Supabase**

Exécuter ce SQL dans la console Supabase (SQL Editor) de votre projet :

```sql
CREATE TABLE devis_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days',
  signed_at TIMESTAMPTZ,
  signe_par TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX devis_tokens_token_idx ON devis_tokens(token);

ALTER TABLE devis_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "token_public_select" ON devis_tokens FOR SELECT USING (true);
CREATE POLICY "token_public_update" ON devis_tokens FOR UPDATE USING (true);
CREATE POLICY "token_owner_insert" ON devis_tokens FOR INSERT WITH CHECK (true);
```

- [ ] **Étape 2 : Ajouter devis_tokens au type Database**

Dans `src/lib/supabase/types.ts`, ajouter la table `devis_tokens` dans la section `Tables`, à la suite de la table `devis` existante. Rechercher `devis:` dans le fichier et insérer après le bloc complet de `devis` :

```typescript
// Ajouter dans Database > public > Tables, après le bloc "devis":
devis_tokens: {
  Row: {
    id: string
    devis_id: string
    token: string
    expires_at: string
    signed_at: string | null
    signe_par: string | null
    created_at: string
  }
  Insert: {
    id?: string
    devis_id: string
    token?: string
    expires_at?: string
    signed_at?: string | null
    signe_par?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    devis_id?: string
    token?: string
    expires_at?: string
    signed_at?: string | null
    signe_par?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "devis_tokens_devis_id_fkey"
      columns: ["devis_id"]
      isOneToOne: false
      referencedRelation: "devis"
      referencedColumns: ["id"]
    }
  ]
}
```

- [ ] **Étape 3 : Ajouter DevisToken à finance-types.ts**

À la fin de `src/lib/supabase/finance-types.ts`, ajouter :

```typescript
export interface DevisToken {
  id: string
  devis_id: string
  token: string
  expires_at: string
  signed_at: string | null
  signe_par: string | null
  created_at: string
}
```

- [ ] **Étape 4 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 5 : Commit**

```bash
git add src/lib/supabase/types.ts src/lib/supabase/finance-types.ts
git commit -m "feat(portail): migration SQL devis_tokens + types TypeScript"
```

---

### Task 8 : POST /api/devis/[id]/envoyer-signature

**Files:**
- Create: `src/app/api/devis/[id]/envoyer-signature/route.ts`

- [ ] **Étape 1 : Créer la route**

```typescript
// src/app/api/devis/[id]/envoyer-signature/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('id, numero, statut, montant_ttc, date_validite, client_id')
    .eq('id', id)
    .single()

  if (devisError || !devis) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  }

  if (!['brouillon', 'envoyé'].includes(devis.statut)) {
    return NextResponse.json({ error: 'Ce devis ne peut plus être envoyé pour signature' }, { status: 400 })
  }

  // Récupère l'email du contact principal, sinon NOTIF_EMAIL
  const { data: contact } = await supabase
    .from('contacts')
    .select('email')
    .eq('client_id', devis.client_id)
    .eq('est_principal', true)
    .not('email', 'is', null)
    .limit(1)
    .maybeSingle()

  const toEmail = contact?.email ?? process.env.NOTIF_EMAIL
  if (!toEmail) return NextResponse.json({ error: 'Aucun email destinataire configuré' }, { status: 400 })

  const service = createServiceClient()

  const { data: tokenRow, error: tokenError } = await service
    .from('devis_tokens')
    .insert({ devis_id: id })
    .select('token')
    .single()

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'Erreur création du lien de signature' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const signUrl = `${appUrl}/devis/${tokenRow.token}`
  const montantTtc = Number(devis.montant_ttc).toFixed(2)

  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA <notifications@atexia.re>',
    to: toEmail,
    subject: `Devis ${devis.numero} — Signature électronique`,
    html: `
      <p>Bonjour,</p>
      <p>Veuillez consulter et signer le devis <strong>${devis.numero}</strong> d'un montant TTC de <strong>${montantTtc} €</strong>.</p>
      <p>Valable jusqu'au ${devis.date_validite}.</p>
      <p><a href="${signUrl}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Consulter et signer le devis</a></p>
      <p style="color:#666;font-size:12px">Ce lien est valable 30 jours. Ne le transmettez pas à des tiers.</p>
    `.trim(),
  })

  if (emailError) {
    return NextResponse.json({ error: `Erreur email : ${emailError.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, token: tokenRow.token })
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

```bash
git add src/app/api/devis/
git commit -m "feat(portail): POST /api/devis/[id]/envoyer-signature — token + email Resend"
```

---

### Task 9 : POST /api/devis/signer (route publique)

**Files:**
- Create: `src/app/api/devis/signer/route.ts`

- [ ] **Étape 1 : Créer la route**

```typescript
// src/app/api/devis/signer/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushNotification } from '@/lib/notifications/push'
import { z } from 'zod'

const SignerSchema = z.object({
  token: z.string().uuid(),
  signe_par: z.string().min(2).max(200),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const parsed = SignerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { token, signe_par } = parsed.data
  const supabase = createServiceClient()

  const { data: tokenRow, error } = await supabase
    .from('devis_tokens')
    .select('id, devis_id, expires_at, signed_at')
    .eq('token', token)
    .single()

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Lien de signature invalide ou introuvable' }, { status: 404 })
  }

  if (tokenRow.signed_at) {
    return NextResponse.json({ error: 'Ce devis a déjà été signé' }, { status: 409 })
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien de signature a expiré' }, { status: 410 })
  }

  const now = new Date().toISOString()

  await Promise.all([
    supabase
      .from('devis_tokens')
      .update({ signed_at: now, signe_par })
      .eq('id', tokenRow.id),
    supabase
      .from('devis')
      .update({ statut: 'accepté', updated_at: now })
      .eq('id', tokenRow.devis_id),
  ])

  // Notification push au patron
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  for (const sub of subscriptions ?? []) {
    try {
      await sendPushNotification(sub, {
        title: '✅ Devis signé !',
        body: `${signe_par} a accepté le devis.`,
        url: `/finances/devis/${tokenRow.devis_id}`,
      })
    } catch {
      // Ignorer les erreurs de push (subscription expirée, etc.)
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

```bash
git add src/app/api/devis/signer/
git commit -m "feat(portail): POST /api/devis/signer — validation token, signature, notif push"
```

---

### Task 10 : Pages publiques (layout + page token + confirme)

**Files:**
- Create: `src/app/devis/layout.tsx`
- Create: `src/app/devis/[token]/page.tsx`
- Create: `src/app/devis/[token]/confirme/page.tsx`

Ces pages sont en dehors du groupe `(app)` — elles n'ont pas la bottom-nav ni l'auth middleware.

- [ ] **Étape 1 : Créer le layout minimal public**

```typescript
// src/app/devis/layout.tsx
export default function DevisPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-4 py-3">
        <p className="text-sky-400 font-bold text-sm">ATEXIA</p>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Étape 2 : Créer la page de confirmation**

```typescript
// src/app/devis/[token]/confirme/page.tsx
import Link from 'next/link'

export default function ConfirmePage({ params }: { params: Promise<{ token: string }> }) {
  void params // token accessible si besoin de lien retour
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-6">✅</div>
      <h1 className="text-2xl font-bold text-white mb-3">Devis accepté</h1>
      <p className="text-slate-400 mb-8">
        Votre acceptation a bien été enregistrée.<br />
        Nous vous recontacterons prochainement.
      </p>
      <p className="text-slate-600 text-sm">Vous pouvez fermer cette page.</p>
    </div>
  )
}
```

- [ ] **Étape 3 : Créer la page principale de signature**

Cette page utilise `createServiceClient` pour contourner RLS (pas de session auth) et afficher le devis avec le formulaire de signature.

```typescript
// src/app/devis/[token]/page.tsx
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { SignatureForm } from '@/components/finances/signature-form'
import type { DevisAvecLignes, DevisToken } from '@/lib/supabase/finance-types'

function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function DevisPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow, error: tokenError } = await supabase
    .from('devis_tokens')
    .select('id, devis_id, expires_at, signed_at, signe_par')
    .eq('token', token)
    .single()

  if (tokenError || !tokenRow) notFound()

  const row = tokenRow as unknown as DevisToken

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret)')
    .eq('id', row.devis_id)
    .single()

  if (devisError || !devis) notFound()

  const d = devis as unknown as DevisAvecLignes
  const lignes = [...d.lignes].sort((a, b) => a.ordre - b.ordre)
  const isExpired = new Date(row.expires_at) < new Date()
  const isSigned = !!row.signed_at

  if (isExpired && !isSigned) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏰</div>
        <h1 className="text-xl font-bold text-white mb-2">Lien expiré</h1>
        <p className="text-slate-400 text-sm">Ce lien de signature n&apos;est plus valide. Contactez ATEXIA pour obtenir un nouveau lien.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête devis */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">{d.numero}</h1>
            <p className="text-slate-400 text-sm mt-0.5">Émis le {d.date_emission} · Valable jusqu&apos;au {d.date_validite}</p>
          </div>
        </div>
        <p className="text-white font-medium">{d.client.nom}</p>
        {d.client.adresse && <p className="text-slate-400 text-sm">{d.client.adresse}</p>}
        {d.client.siret && <p className="text-slate-500 text-xs mt-0.5">SIRET : {d.client.siret}</p>}
      </div>

      {/* Lignes du devis */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">Détail des prestations</h2>
        <div className="space-y-3">
          {lignes.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700 last:border-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{l.libelle}</p>
                <p className="text-slate-500 text-xs mt-0.5">{l.quantite} {l.unite} × {eur(Number(l.prix_unitaire))} HT</p>
              </div>
              <p className="text-white text-sm font-medium shrink-0">{eur(Number(l.total_ht))}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Total HT</span><span className="text-white">{eur(Number(d.montant_ht))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">TVA 8,5 %</span><span className="text-white">{eur(Number(d.montant_tva))}</span></div>
          <div className="flex justify-between text-base font-bold mt-1"><span className="text-white">Total TTC</span><span className="text-sky-400">{eur(Number(d.montant_ttc))}</span></div>
        </div>
      </div>

      {/* Formulaire de signature ou confirmation */}
      {isSigned ? (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-2xl p-5 text-center">
          <p className="text-emerald-400 font-semibold">✓ Devis accepté</p>
          <p className="text-slate-400 text-sm mt-1">
            Signé le {new Date(row.signed_at!).toLocaleDateString('fr-FR')} par <strong className="text-white">{row.signe_par}</strong>
          </p>
        </div>
      ) : (
        <SignatureForm token={token} />
      )}
    </div>
  )
}
```

- [ ] **Étape 4 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur (SignatureForm sera créé à la tâche suivante — ajouter un stub temporaire si nécessaire : `export function SignatureForm({ token }: { token: string }) { return <div>{token}</div> }`).

- [ ] **Étape 5 : Commit**

```bash
git add src/app/devis/
git commit -m "feat(portail): pages publiques /devis/[token] et /devis/[token]/confirme"
```

---

### Task 11 : Composants SignatureForm + EnvoyerSignatureButton + intégration

**Files:**
- Create: `src/components/finances/signature-form.tsx`
- Create: `src/components/finances/envoyer-signature-button.tsx`
- Create: `src/components/finances/__tests__/signature-form.test.tsx`
- Create: `src/components/finances/__tests__/envoyer-signature-button.test.tsx`
- Modify: `src/app/(app)/finances/devis/[id]/page.tsx`

- [ ] **Étape 1 : Écrire les tests de SignatureForm**

```typescript
// src/components/finances/__tests__/signature-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignatureForm } from '../signature-form'

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

beforeEach(() => {
  global.fetch = jest.fn()
  mockReplace.mockReset()
})

afterEach(() => jest.restoreAllMocks())

describe('SignatureForm', () => {
  it('affiche le champ nom et la case à cocher', () => {
    render(<SignatureForm token="abc-token" />)
    expect(screen.getByPlaceholderText(/votre nom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/j'accepte/i)).toBeInTheDocument()
  })

  it('le bouton Signer est désactivé par défaut', () => {
    render(<SignatureForm token="abc-token" />)
    expect(screen.getByRole('button', { name: /signer/i })).toBeDisabled()
  })

  it('le bouton Signer reste désactivé si seulement le nom est renseigné', () => {
    render(<SignatureForm token="abc-token" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Jean Dupont' } })
    expect(screen.getByRole('button', { name: /signer/i })).toBeDisabled()
  })

  it('le bouton Signer reste désactivé si seulement la case est cochée', () => {
    render(<SignatureForm token="abc-token" />)
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    expect(screen.getByRole('button', { name: /signer/i })).toBeDisabled()
  })

  it('le bouton Signer s\'active quand nom + case cochée', () => {
    render(<SignatureForm token="abc-token" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Jean Dupont' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    expect(screen.getByRole('button', { name: /signer/i })).not.toBeDisabled()
  })

  it('appelle POST /api/devis/signer avec token et signe_par', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<SignatureForm token="tok-123" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Marie Martin' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    fireEvent.click(screen.getByRole('button', { name: /signer/i }))
    expect(global.fetch).toHaveBeenCalledWith('/api/devis/signer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'tok-123', signe_par: 'Marie Martin' }),
    })
  })

  it('redirige vers /confirme après succès', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<SignatureForm token="tok-123" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Pierre Durand' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    fireEvent.click(screen.getByRole('button', { name: /signer/i }))
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/devis/tok-123/confirme'))
  })

  it('affiche un message d\'erreur si la requête échoue', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Lien expiré' }),
    })
    render(<SignatureForm token="tok-123" />)
    fireEvent.change(screen.getByPlaceholderText(/votre nom/i), { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText(/j'accepte/i))
    fireEvent.click(screen.getByRole('button', { name: /signer/i }))
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
  })
})
```

- [ ] **Étape 2 : Écrire les tests de EnvoyerSignatureButton**

```typescript
// src/components/finances/__tests__/envoyer-signature-button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnvoyerSignatureButton } from '../envoyer-signature-button'

beforeEach(() => { global.fetch = jest.fn() })
afterEach(() => jest.restoreAllMocks())

describe('EnvoyerSignatureButton', () => {
  it('affiche le bouton Envoyer pour signature', () => {
    render(<EnvoyerSignatureButton devisId="d1" />)
    expect(screen.getByText(/envoyer pour signature/i)).toBeInTheDocument()
  })

  it('affiche ... pendant le chargement', async () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<EnvoyerSignatureButton devisId="d1" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('affiche confirmation après succès', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<EnvoyerSignatureButton devisId="d1" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    await waitFor(() => expect(screen.getByText(/lien envoyé/i)).toBeInTheDocument())
  })

  it('affiche erreur si la requête échoue', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Erreur' }) })
    render(<EnvoyerSignatureButton devisId="d1" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
  })

  it('appelle POST /api/devis/[id]/envoyer-signature', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<EnvoyerSignatureButton devisId="abc-123" />)
    fireEvent.click(screen.getByText(/envoyer pour signature/i))
    expect(global.fetch).toHaveBeenCalledWith('/api/devis/abc-123/envoyer-signature', { method: 'POST' })
  })
})
```

- [ ] **Étape 3 : Lancer les tests — vérifier l'échec**

```bash
npm test -- --testPathPattern="signature-form|envoyer-signature-button"
```
Attendu : FAIL (composants inexistants).

- [ ] **Étape 4 : Implémenter SignatureForm**

```typescript
// src/components/finances/signature-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
}

export function SignatureForm({ token }: Props) {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSign = nom.trim().length >= 2 && accepted

  const handleSign = async () => {
    if (!canSign) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/devis/signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signe_par: nom.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`Erreur : ${data.error ?? 'Une erreur est survenue'}`)
        return
      }
      router.replace(`/devis/${token}/confirme`)
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="text-white font-semibold">Signature électronique</h2>

      <div>
        <label htmlFor="nom-signataire" className="block text-slate-300 text-sm mb-1.5">
          Votre nom complet <span className="text-red-400">*</span>
        </label>
        <input
          id="nom-signataire"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Votre nom et prénom"
          className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="accepte"
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          aria-label="J'accepte les conditions"
          className="mt-0.5 w-4 h-4 accent-sky-500 cursor-pointer"
        />
        <label htmlFor="accepte" className="text-slate-300 text-sm cursor-pointer">
          Je déclare avoir pris connaissance du devis et l&apos;accepte sans réserve.
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        onClick={handleSign}
        disabled={!canSign || loading}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? '…' : '✅ Signer et accepter'}
      </button>

      <p className="text-slate-600 text-xs text-center">
        En signant, vous acceptez électroniquement ce devis. Cette signature a valeur contractuelle.
      </p>
    </div>
  )
}
```

- [ ] **Étape 5 : Implémenter EnvoyerSignatureButton**

```typescript
// src/components/finances/envoyer-signature-button.tsx
'use client'

import { useState } from 'react'

export function EnvoyerSignatureButton({ devisId }: { devisId: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleClick = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch(`/api/devis/${devisId}/envoyer-signature`, { method: 'POST' })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading || status === 'success'}
        className="flex items-center gap-2 text-sm bg-emerald-700 text-emerald-100 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
      >
        ✍️ {loading ? '...' : status === 'success' ? 'Lien envoyé ✓' : 'Envoyer pour signature'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs">Erreur lors de l&apos;envoi. Réessayez.</p>
      )}
    </div>
  )
}
```

- [ ] **Étape 6 : Lancer les tests — vérifier le succès**

```bash
npm test -- --testPathPattern="signature-form|envoyer-signature-button"
```
Attendu : PASS (7 tests SignatureForm + 5 tests EnvoyerSignatureButton).

- [ ] **Étape 7 : Ajouter EnvoyerSignatureButton sur la page devis/[id]**

Dans `src/app/(app)/finances/devis/[id]/page.tsx`, importer et ajouter le bouton dans la section des actions (après le bouton "Télécharger PDF", visible si statut `brouillon` ou `envoyé`) :

```typescript
// Ajouter l'import en haut du fichier :
import { EnvoyerSignatureButton } from '@/components/finances/envoyer-signature-button'

// Dans le JSX, dans la div des boutons d'action, ajouter après EnvoyerDevisButton :
{['brouillon', 'envoyé'].includes(devis.statut) && (
  <EnvoyerSignatureButton devisId={id} />
)}
```

- [ ] **Étape 8 : Vérifier la compilation TypeScript complète**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Étape 9 : Lancer tous les tests**

```bash
npm test
```
Attendu : tous les tests passent.

- [ ] **Étape 10 : Build final**

```bash
npm run build
```
Attendu : build réussi, aucune erreur.

- [ ] **Étape 11 : Commit final**

```bash
git add src/components/finances/signature-form.tsx src/components/finances/envoyer-signature-button.tsx src/components/finances/__tests__/signature-form.test.tsx src/components/finances/__tests__/envoyer-signature-button.test.tsx src/app/(app)/finances/devis/
git commit -m "feat(portail): SignatureForm + EnvoyerSignatureButton + intégration page devis — #10 complet"
```

---

## Récapitulatif

| Amélioration | Tests | Commits |
|---|---|---|
| #8 Recherche globale | ~10 tests SearchModal | 3 commits |
| #9 Planning | ~18 tests (normalize + calendar) | 3 commits |
| #10 Portail signature | ~12 tests (signature-form + envoyer) | 5 commits |
| **Total** | **~40 tests** | **11 commits** |

Build final : vérifier `npm test && npm run build` avant de déclarer le travail terminé.
