# Plan 1 — Foundation: Next.js + Supabase + Auth + PWA + Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le socle technique complet — Next.js 14, Supabase (DB + auth), PWA Android, barre de navigation — prêt pour l'ajout des modules métier.

**Architecture:** Next.js 14 App Router avec deux groupes de routes : `(auth)` pour la connexion et `(app)` pour les pages protégées. Supabase gère PostgreSQL, Auth et Storage. Middleware d'auth protège toutes les routes `/app`. Barre de navigation basse sur mobile, masquée sur desktop.

**Tech Stack:** Next.js 14, TypeScript strict, Tailwind CSS, @supabase/ssr, next-pwa, Zod, Jest + @testing-library/react

---

## Structure des fichiers

```
src/
  app/
    (auth)/
      layout.tsx
      login/
        page.tsx
        actions.ts
    (app)/
      layout.tsx
      page.tsx                      # Dashboard stub
      clients/page.tsx              # Stub
      projets/page.tsx              # Stub
      taches/page.tsx               # Stub
      plus/page.tsx                 # Stub
    layout.tsx                      # Root layout (PWA meta)
    globals.css
  components/
    layout/
      bottom-nav.tsx
      __tests__/bottom-nav.test.tsx
    ui/
      badge.tsx
      skeleton.tsx
      error-boundary.tsx
      __tests__/badge.test.tsx
      __tests__/skeleton.test.tsx
  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
      types.ts
    validations/
      auth.ts
      __tests__/auth.test.ts
  middleware.ts
supabase/
  migrations/
    001_initial_schema.sql
public/
  manifest.json
  icons/
    icon-192.png
    icon-512.png
jest.config.ts
jest.setup.ts
next.config.js
.env.local
.env.example
```

---

## Task 1: Initialiser le projet Next.js

**Files:**
- Create: `package.json` (généré)
- Create: `tsconfig.json`
- Create: `.env.local`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Créer le projet**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Expected: "Success! Created your app"

- [ ] **Step 2: Activer TypeScript strict**

Ouvrir `tsconfig.json`, s'assurer que ces options sont présentes dans `compilerOptions` :

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 3: Créer .env.local**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

- [ ] **Step 4: Créer .env.example**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 5: Mettre à jour .gitignore**

Ajouter à la fin du `.gitignore` existant :

```
.env.local
.superpowers/
```

- [ ] **Step 6: Vérifier que le projet démarre**

```bash
npm run dev
```

Expected: Serveur démarre sur http://localhost:3000

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: initialize Next.js 14 project with TypeScript strict and Tailwind"
```

---

## Task 2: Installer les dépendances

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Installer les packages**

```bash
npm install @supabase/supabase-js @supabase/ssr zod next-pwa
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest @types/next-pwa
```

- [ ] **Step 2: Créer jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 3: Créer jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Ajouter les scripts de test dans package.json**

Ouvrir `package.json`, ajouter dans `"scripts"` :

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Supabase, Zod, PWA, and testing dependencies"
```

---

## Task 3: Schéma de base de données Supabase

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Créer le fichier de migration**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  secteur text not null check (secteur in ('courants_forts','courants_faibles','photovoltaique','mixte')),
  adresse text,
  siret text,
  statut text not null default 'prospect' check (statut in ('prospect','actif','inactif')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contacts
create table contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  prenom text not null,
  nom text not null,
  poste text,
  telephone text,
  email text,
  est_principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projets
create table projets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  titre text not null,
  type text not null check (type in ('installation','etude','maintenance','sav')),
  secteur text not null check (secteur in ('courants_forts','courants_faibles','photovoltaique')),
  statut text not null default 'en_etude' check (statut in ('en_etude','en_cours','termine','sav')),
  avancement integer not null default 0 check (avancement >= 0 and avancement <= 100),
  montant_devis numeric(12,2),
  montant_facture numeric(12,2),
  date_debut_estimee date,
  date_fin_estimee date,
  date_fin_reelle date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  type text not null check (type in ('devis','rapport','plan','photo','contrat','autre')),
  nom text not null,
  description text,
  storage_path text,
  taille_octets integer,
  genere_par_app boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tâches
create table taches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  titre text not null,
  description text,
  date_echeance timestamptz,
  priorite text not null default 'normale' check (priorite in ('haute','normale','basse')),
  statut text not null default 'a_faire' check (statut in ('a_faire','fait')),
  notification_active boolean not null default false,
  notification_email boolean not null default false,
  notification_push boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Interactions
create table interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  type text not null check (type in ('appel','email','visite','reunion','autre')),
  date timestamptz not null default now(),
  resume text not null,
  suite_a_donner text,
  created_at timestamptz not null default now()
);

-- Configuration modules (extensibilité)
create table modules_config (
  id uuid primary key default gen_random_uuid(),
  cle text not null unique,
  label text not null,
  icone text not null,
  ordre integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Données initiales
insert into modules_config (cle, label, icone, ordre, visible) values
  ('dashboard',     'Accueil',    '🏠', 1, true),
  ('clients',       'Clients',    '👥', 2, true),
  ('projets',       'Projets',    '🔨', 3, true),
  ('taches',        'Tâches',     '✅', 4, true),
  ('documents',     'Documents',  '📄', 5, true),
  ('interactions',  'Échanges',   '💬', 6, true);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients for each row execute function update_updated_at();
create trigger contacts_updated_at before update on contacts for each row execute function update_updated_at();
create trigger projets_updated_at before update on projets for each row execute function update_updated_at();
create trigger taches_updated_at before update on taches for each row execute function update_updated_at();

-- RLS
alter table clients enable row level security;
alter table contacts enable row level security;
alter table projets enable row level security;
alter table documents enable row level security;
alter table taches enable row level security;
alter table interactions enable row level security;
alter table modules_config enable row level security;

create policy "auth_all" on clients for all using (auth.role() = 'authenticated');
create policy "auth_all" on contacts for all using (auth.role() = 'authenticated');
create policy "auth_all" on projets for all using (auth.role() = 'authenticated');
create policy "auth_all" on documents for all using (auth.role() = 'authenticated');
create policy "auth_all" on taches for all using (auth.role() = 'authenticated');
create policy "auth_all" on interactions for all using (auth.role() = 'authenticated');
create policy "auth_read" on modules_config for select using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Créer le projet Supabase**

Aller sur https://supabase.com → New project → Nom : "atexia-crm" → Région : Europe West (Paris) → Créer.

- [ ] **Step 3: Appliquer la migration**

Supabase dashboard → SQL Editor → Coller et exécuter le contenu de `001_initial_schema.sql`.

Expected: "Success. No rows returned"

- [ ] **Step 4: Récupérer les clés**

Supabase → Settings → API → Copier :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local`
- `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`

- [ ] **Step 5: Créer le premier utilisateur**

Supabase → Authentication → Users → Add user → Saisir l'email et le mot de passe du gérant ATEXIA.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add complete database schema with RLS policies"
```

---

## Task 4: Client Supabase et types TypeScript

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/types.ts`

- [ ] **Step 1: Créer le client navigateur**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Créer le client serveur**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Créer les types TypeScript**

```typescript
// src/lib/supabase/types.ts
export type Secteur = 'courants_forts' | 'courants_faibles' | 'photovoltaique' | 'mixte'
export type StatutClient = 'prospect' | 'actif' | 'inactif'
export type TypeProjet = 'installation' | 'etude' | 'maintenance' | 'sav'
export type SecteurProjet = 'courants_forts' | 'courants_faibles' | 'photovoltaique'
export type StatutProjet = 'en_etude' | 'en_cours' | 'termine' | 'sav'
export type TypeDocument = 'devis' | 'rapport' | 'plan' | 'photo' | 'contrat' | 'autre'
export type PrioriteTask = 'haute' | 'normale' | 'basse'
export type StatutTache = 'a_faire' | 'fait'
export type TypeInteraction = 'appel' | 'email' | 'visite' | 'reunion' | 'autre'

export interface Client {
  id: string
  nom: string
  secteur: Secteur
  adresse: string | null
  siret: string | null
  statut: StatutClient
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  client_id: string
  prenom: string
  nom: string
  poste: string | null
  telephone: string | null
  email: string | null
  est_principal: boolean
  created_at: string
  updated_at: string
}

export interface Projet {
  id: string
  client_id: string
  titre: string
  type: TypeProjet
  secteur: SecteurProjet
  statut: StatutProjet
  avancement: number
  montant_devis: number | null
  montant_facture: number | null
  date_debut_estimee: string | null
  date_fin_estimee: string | null
  date_fin_reelle: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string | null
  projet_id: string | null
  type: TypeDocument
  nom: string
  description: string | null
  storage_path: string | null
  taille_octets: number | null
  genere_par_app: boolean
  created_at: string
}

export interface Tache {
  id: string
  client_id: string | null
  projet_id: string | null
  titre: string
  description: string | null
  date_echeance: string | null
  priorite: PrioriteTask
  statut: StatutTache
  notification_active: boolean
  notification_email: boolean
  notification_push: boolean
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  client_id: string | null
  projet_id: string | null
  type: TypeInteraction
  date: string
  resume: string
  suite_a_donner: string | null
  created_at: string
}

export interface ModuleConfig {
  id: string
  cle: string
  label: string
  icone: string
  ordre: number
  visible: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>
      }
      projets: {
        Row: Projet
        Insert: Omit<Projet, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Projet, 'id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at'>>
      }
      taches: {
        Row: Tache
        Insert: Omit<Tache, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tache, 'id' | 'created_at'>>
      }
      interactions: {
        Row: Interaction
        Insert: Omit<Interaction, 'id' | 'created_at'>
        Update: Partial<Omit<Interaction, 'id' | 'created_at'>>
      }
      modules_config: {
        Row: ModuleConfig
        Insert: Omit<ModuleConfig, 'id' | 'created_at'>
        Update: Partial<Omit<ModuleConfig, 'id' | 'created_at'>>
      }
    }
  }
}
```

- [ ] **Step 4: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase clients (browser + server) and TypeScript types"
```

---

## Task 5: Middleware d'authentification

**Files:**
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Créer le helper middleware Supabase**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 2: Créer le middleware principal**

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 3: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/lib/supabase/middleware.ts
git commit -m "feat: add auth middleware — all routes protected"
```

---

## Task 6: Page de connexion

**Files:**
- Create: `src/lib/validations/auth.ts`
- Create: `src/lib/validations/__tests__/auth.test.ts`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/actions.ts`
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Écrire le test de validation**

```typescript
// src/lib/validations/__tests__/auth.test.ts
import { loginSchema } from '../auth'

describe('loginSchema', () => {
  it('accepte un email et mot de passe valides', () => {
    const result = loginSchema.safeParse({ email: 'test@atexia.re', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({ email: 'pas-un-email', password: 'secret123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('email')
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ email: 'test@atexia.re', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('password')
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npm test src/lib/validations/__tests__/auth.test.ts
```

Expected: FAIL — "Cannot find module '../auth'"

- [ ] **Step 3: Créer le schéma Zod**

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type LoginInput = z.infer<typeof loginSchema>
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
npm test src/lib/validations/__tests__/auth.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Créer la server action**

```typescript
// src/app/(auth)/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'

export async function login(_prevState: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Email ou mot de passe invalide' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  redirect('/')
}
```

- [ ] **Step 6: Créer le layout auth**

```typescript
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
```

- [ ] **Step 7: Créer la page de connexion**

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">ATEXIA</h1>
        <p className="text-slate-400 text-sm mt-1">Gestion clients</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-slate-300 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="text-red-400 text-sm text-center" role="alert">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors"
        >
          {isPending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 8: Tester manuellement**

```bash
npm run dev
```

Ouvrir http://localhost:3000 → doit rediriger vers `/login` → se connecter avec les credentials Supabase → doit rediriger vers `/` (page stub "Tableau de bord" attendue à la prochaine task).

- [ ] **Step 9: Commit**

```bash
git add src/app/(auth)/ src/lib/validations/
git commit -m "feat: add login page with Supabase auth and Zod validation"
```

---

## Task 7: Configuration PWA

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Modify: `next.config.js`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Créer le manifest**

```json
// public/manifest.json
{
  "name": "ATEXIA CRM",
  "short_name": "ATEXIA",
  "description": "Gestion de clients ATEXIA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0ea5e9",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Créer les icônes**

Générer deux icônes PNG (fond bleu #0ea5e9, initiales "AT" en blanc) :
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)

Utiliser https://favicon.io/favicon-generator/ ou un éditeur image. Ces fichiers doivent exister même temporairement pour que la PWA soit valide.

- [ ] **Step 3: Configurer next-pwa**

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 4: Mettre à jour le layout racine**

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ATEXIA CRM',
  description: 'Gestion de clients ATEXIA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ATEXIA',
  },
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Vérifier le build**

```bash
npm run build
```

Expected: Build successful, fichiers `sw.js` et `workbox-*.js` générés dans `/public`

- [ ] **Step 6: Commit**

```bash
git add public/ next.config.js src/app/layout.tsx
git commit -m "feat: configure PWA with manifest, icons, and service worker"
```

---

## Task 8: Shell de navigation

**Files:**
- Create: `src/components/layout/bottom-nav.tsx`
- Create: `src/components/layout/__tests__/bottom-nav.test.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/page.tsx`
- Create: `src/app/(app)/clients/page.tsx`
- Create: `src/app/(app)/projets/page.tsx`
- Create: `src/app/(app)/taches/page.tsx`
- Create: `src/app/(app)/plus/page.tsx`

- [ ] **Step 1: Écrire le test BottomNav**

```typescript
// src/components/layout/__tests__/bottom-nav.test.tsx
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../bottom-nav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('affiche les 5 onglets de navigation', () => {
    render(<BottomNav />)
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Projets')).toBeInTheDocument()
    expect(screen.getByText('Tâches')).toBeInTheDocument()
    expect(screen.getByText('Plus')).toBeInTheDocument()
  })

  it("marque l'onglet Accueil comme actif sur /", () => {
    render(<BottomNav />)
    const link = screen.getByRole('link', { name: /accueil/i })
    expect(link).toHaveClass('text-sky-400')
  })

  it("les autres onglets ne sont pas actifs sur /", () => {
    render(<BottomNav />)
    const clientsLink = screen.getByRole('link', { name: /clients/i })
    expect(clientsLink).not.toHaveClass('text-sky-400')
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npm test src/components/layout/__tests__/bottom-nav.test.tsx
```

Expected: FAIL — "Cannot find module '../bottom-nav'"

- [ ] **Step 3: Créer le composant BottomNav**

```typescript
// src/components/layout/bottom-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/projets', label: 'Projets', icon: '🔨' },
  { href: '/taches', label: 'Tâches', icon: '✅' },
  { href: '/plus', label: 'Plus', icon: '⋯' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 md:hidden"
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isActive
                  ? 'text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
npm test src/components/layout/__tests__/bottom-nav.test.tsx
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Créer le layout de l'app**

```typescript
// src/app/(app)/layout.tsx
import { BottomNav } from '@/components/layout/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <main className="pb-20 md:pb-0 min-h-screen max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 6: Créer les pages stub**

```typescript
// src/app/(app)/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white">Tableau de bord</h1>
      <p className="text-slate-400 mt-2">Module en cours de développement…</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/clients/page.tsx
export default function ClientsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white">Clients</h1>
      <p className="text-slate-400 mt-2">Module en cours de développement…</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/projets/page.tsx
export default function ProjetsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white">Projets</h1>
      <p className="text-slate-400 mt-2">Module en cours de développement…</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/taches/page.tsx
export default function TachesPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white">Tâches</h1>
      <p className="text-slate-400 mt-2">Module en cours de développement…</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/plus/page.tsx
export default function PlusPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white">Plus</h1>
      <p className="text-slate-400 mt-2">Module en cours de développement…</p>
    </div>
  )
}
```

- [ ] **Step 7: Tester manuellement**

```bash
npm run dev
```

Se connecter → vérifier que :
1. La barre de navigation s'affiche en bas sur mobile (DevTools → responsive)
2. Chaque onglet navigue vers la bonne page
3. L'onglet actif est bleu
4. Sur desktop (> 768px), la barre est masquée (la sidebar sera ajoutée dans un plan ultérieur)

- [ ] **Step 8: Commit**

```bash
git add src/app/(app)/ src/components/layout/
git commit -m "feat: add app shell with bottom navigation and stub pages"
```

---

## Task 9: Composants UI de base

**Files:**
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/error-boundary.tsx`
- Create: `src/components/ui/__tests__/badge.test.tsx`
- Create: `src/components/ui/__tests__/skeleton.test.tsx`

- [ ] **Step 1: Écrire les tests**

```typescript
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
    expect(screen.getByText('Terminé')).toHaveClass('bg-emerald-500')
  })

  it('applique la classe danger', () => {
    render(<Badge label="SAV" variant="danger" />)
    expect(screen.getByText('SAV')).toHaveClass('bg-red-500')
  })

  it('applique la classe warning', () => {
    render(<Badge label="En étude" variant="warning" />)
    expect(screen.getByText('En étude')).toHaveClass('bg-amber-500')
  })
})
```

```typescript
// src/components/ui/__tests__/skeleton.test.tsx
import { render } from '@testing-library/react'
import { Skeleton } from '../skeleton'

describe('Skeleton', () => {
  it('affiche avec les classes par défaut', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse', 'bg-slate-700', 'rounded')
  })

  it('accepte des classes personnalisées', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-32')
  })
})
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
npm test src/components/ui/__tests__/
```

Expected: FAIL — modules non trouvés

- [ ] **Step 3: Créer le composant Badge**

```typescript
// src/components/ui/badge.tsx
type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  info: 'bg-sky-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  neutral: 'bg-slate-600 text-slate-200',
}

interface BadgeProps {
  label: string
  variant: BadgeVariant
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Créer le composant Skeleton**

```typescript
// src/components/ui/skeleton.tsx
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
}
```

- [ ] **Step 5: Créer le composant ErrorBoundary**

```typescript
// src/components/ui/error-boundary.tsx
'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg m-4">
            <p className="text-red-400 text-sm font-medium">Une erreur est survenue</p>
            <p className="text-red-500 text-xs mt-1">{this.state.error?.message}</p>
          </div>
        )
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 6: Vérifier que tous les tests passent**

```bash
npm test
```

Expected: PASS — tous les tests passent

- [ ] **Step 7: Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Badge, Skeleton, and ErrorBoundary UI components"
```

---

## Task 10: Déploiement Vercel

**Files:** aucun fichier code, configuration Vercel et GitHub

- [ ] **Step 1: Créer un dépôt GitHub**

Aller sur https://github.com → New repository → Nom : "atexia-crm" → Private → Create.

- [ ] **Step 2: Pousser le code**

```bash
git remote add origin https://github.com/VOTRE_USERNAME/atexia-crm.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Connecter à Vercel**

Aller sur https://vercel.com → Add New Project → Import depuis GitHub → Sélectionner "atexia-crm" → Framework Preset : Next.js → Deploy.

- [ ] **Step 4: Configurer les variables d'environnement**

Dans Vercel → Project Settings → Environment Variables → Ajouter pour Production + Preview + Development :
- `NEXT_PUBLIC_SUPABASE_URL` = (URL du projet Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (clé anon Supabase)

Puis Deployments → Redeploy pour appliquer les variables.

- [ ] **Step 5: Vérifier le déploiement**

URL fournie par Vercel (ex: `atexia-crm.vercel.app`) → Se connecter → Vérifier que la navigation fonctionne.

- [ ] **Step 6: Tester l'installation PWA sur Android**

1. Ouvrir l'URL Vercel dans Chrome Android
2. Menu Chrome → "Ajouter à l'écran d'accueil" ou bannière automatique
3. Installer → ouvrir depuis l'écran d'accueil
4. L'app doit s'ouvrir sans barre d'URL (mode standalone)
5. Connexion → navigation entre onglets

- [ ] **Step 7: Commit final**

```bash
git add .
git commit -m "chore: foundation complete — deployed to Vercel"
git push
```

---

## Prochaines étapes

Cette fondation est terminée. Les plans suivants sont indépendants et peuvent être exécutés dans l'ordre :

| Plan | Contenu |
|---|---|
| Plan 2 | Module Clients & Contacts (liste, fiche enrichie, CRUD) |
| Plan 3 | Module Projets & Chantiers (liste filtrée, fiche, progression) |
| Plan 4 | Tâches & Notifications (email Resend + Web Push) |
| Plan 5 | Documents (upload Supabase Storage + génération PDF) |
| Plan 6 | Interactions & Tableau de bord complet |
