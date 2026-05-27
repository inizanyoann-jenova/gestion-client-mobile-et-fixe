# Spécification — Plan 3 : Module Projets & Chantiers

**Date :** 2026-05-27
**Projet :** Application CRM ATEXIA
**Statut :** Validé

---

## 1. Périmètre

### Ce que couvre Plan 3

- Liste projets (`/projets`) — recherche, filtres, pagination, cartes
- Fiche projet (`/projets/[id]`) — header, avancement par étapes, 4 sous-onglets fonctionnels
- Modal création/édition projet — accessible depuis 3 points d'entrée
- Mise à jour `ClientTabs` : onglet "Projets" passe de placeholder à liste réelle
- FAB dashboard : menu création rapide (client / projet / tâche)
- API routes `/api/projets` et sous-ressources (tâches, interactions, documents)
- Upload documents liés au projet via Supabase Storage
- Tâches liées : liste + modal création (`TacheForm`, réutilisé par Plan 4)
- Échanges liés : liste read-only, bouton "+" → redirect `/echanges/nouveau?projet=xxx`
- Zod schemas : projets, tâches, documents upload

### Ce que couvre Plan 3b (plan suivant, séparé)

- Génération PDF : templates devis, rapport d'intervention, bon de réception (`@react-pdf/renderer`)

### Hors périmètre Plan 3

- Module Tâches complet (liste globale `/taches`) → Plan 4
- Module Échanges complet (`/echanges`) → Plan 5
- Génération PDF → Plan 3b

---

## 2. Modèle de données utilisé

Tables Supabase déjà créées (Plan 2) :

```text
projets   : id, client_id, titre, type, secteur, statut, avancement,
            montant_devis, montant_facture, date_debut_estimee,
            date_fin_estimee, date_fin_reelle, notes, created_at, updated_at

taches    : id, client_id?, projet_id?, titre, description, date_echeance,
            priorite, statut, notification_active, notification_email,
            notification_push, created_at, updated_at

interactions : id, client_id?, projet_id?, type, date, resume,
               suite_a_donner, created_at

documents : id, client_id?, projet_id?, type, nom, description,
            storage_path, taille_octets, genere_par_app, created_at
```

Types domaine déjà définis dans `src/lib/supabase/types.ts` :

```typescript
type TypeProjet   = 'installation' | 'etude' | 'maintenance' | 'sav'
type SecteurProjet = 'courants_forts' | 'courants_faibles' | 'photovoltaique'
type StatutProjet = 'en_etude' | 'en_cours' | 'termine' | 'sav'
type PrioriteTask = 'haute' | 'normale' | 'basse'
type StatutTache  = 'a_faire' | 'fait'
type TypeInteraction = 'appel' | 'email' | 'visite' | 'reunion' | 'autre'
type TypeDocument = 'devis' | 'rapport' | 'plan' | 'photo' | 'contrat' | 'autre'
```

---

## 3. Structure de fichiers

```text
src/
├── app/(app)/
│   ├── page.tsx                              ← MAJ : FAB création rapide
│   ├── projets/
│   │   ├── page.tsx                          ← Server Component liste
│   │   ├── loading.tsx                       ← Skeleton liste
│   │   └── [id]/
│   │       ├── page.tsx                      ← Server Component fiche (5 queries parallèles)
│   │       └── loading.tsx                   ← Skeleton fiche
│   └── echanges/
│       └── nouveau/
│           └── page.tsx                      ← Placeholder (reçoit ?projet=xxx)
│
├── components/
│   ├── projets/
│   │   ├── projet-card.tsx
│   │   ├── projets-filters.tsx
│   │   ├── projet-form.tsx                   ← Modal create/edit
│   │   ├── delete-projet-button.tsx
│   │   ├── projet-header.tsx
│   │   ├── projet-avancement.tsx             ← Boutons étapes autosave
│   │   ├── projet-infos.tsx
│   │   ├── projet-tabs.tsx                   ← Shell 4 onglets
│   │   ├── projet-documents.tsx
│   │   ├── projet-taches.tsx
│   │   ├── projet-interactions.tsx
│   │   └── projet-notes.tsx
│   ├── taches/
│   │   └── tache-form.tsx                    ← Modal création tâche (réutilisé Plan 4)
│   ├── clients/
│   │   └── client-tabs.tsx                   ← MAJ : onglet Projets fonctionnel
│   └── dashboard/
│       └── fab-create.tsx                    ← FAB menu 3 actions
│
└── app/api/
    ├── projets/
    │   ├── route.ts                          ← GET list + POST
    │   └── [id]/
    │       ├── route.ts                      ← GET, PUT, PATCH, DELETE
    │       ├── taches/route.ts               ← GET + POST
    │       ├── interactions/route.ts         ← GET
    │       └── documents/route.ts            ← GET + POST (upload)
    └── taches/
        └── [id]/route.ts                     ← PATCH statut (cocher/décocher)

src/lib/validations/
    ├── projet.ts                             ← ProjetCreateSchema, ProjetUpdateSchema
    ├── tache.ts                              ← TacheCreateSchema
    └── document.ts                           ← DocumentUploadSchema
```

---

## 4. API Routes

### `GET /api/projets`
Query params : `search` (titre ou nom client), `statut`, `secteur`, `page` (défaut 1), `limit` (défaut 10).
Retourne : `{ projets: ProjetAvecClient[], total: number, page: number }`.
`ProjetAvecClient` = `Projet & { client: { id, nom } }` via join Supabase.

### `POST /api/projets`
Body validé par `ProjetCreateSchema`. Retourne le projet créé.

### `GET /api/projets/[id]`
Retourne le projet + `{ client: { id, nom } }`.

### `PUT /api/projets/[id]`
Mise à jour complète (edit modal). Body validé par `ProjetUpdateSchema`.

### `PATCH /api/projets/[id]`
Mise à jour partielle : `avancement` (autosave boutons) ou `notes` (autosave textarea).
Body : `{ avancement?: number } | { notes?: string }`.

### `DELETE /api/projets/[id]`
Supprime le projet. Retourne 204.

### `GET /api/projets/[id]/taches`
Retourne les tâches liées triées par `date_echeance ASC`, `priorite` (haute en premier).

### `POST /api/projets/[id]/taches`
Crée une tâche avec `projet_id` pré-rempli. Body validé par `TacheCreateSchema`.

### `PATCH /api/taches/[id]`
Mise à jour partielle : `statut` pour cocher/décocher.

### `GET /api/projets/[id]/interactions`
Retourne les interactions liées triées par `date DESC`.

### `GET /api/projets/[id]/documents`
Retourne les documents liés triés par `created_at DESC`.

### `POST /api/projets/[id]/documents`
Upload multipart/form-data. Stocke dans Supabase Storage bucket `documents` sous `projets/[id]/[filename]`.
Insère la row en base avec `storage_path`, `taille_octets`, `nom`, `type`.

---

## 5. Schemas Zod

### `projet.ts`

```typescript
export const ProjetCreateSchema = z.object({
  titre: z.string().min(2).max(200),
  client_id: z.string().uuid(),
  type: z.enum(['installation', 'etude', 'maintenance', 'sav']),
  secteur: z.enum(['courants_forts', 'courants_faibles', 'photovoltaique']),
  statut: z.enum(['en_etude', 'en_cours', 'termine', 'sav']),
  montant_devis: z.number().positive().nullable().optional(),
  date_debut_estimee: z.string().datetime().nullable().optional(),
  date_fin_estimee: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

// Utilisé par PUT /api/projets/[id] (édition complète via modal)
export const ProjetUpdateSchema = ProjetCreateSchema.partial()

// Utilisé par PATCH /api/projets/[id] (mises à jour partielles autosave)
export const ProjetPatchSchema = z.union([
  z.object({ avancement: z.number().int().min(0).max(100) }),
  z.object({ notes: z.string().max(5000).nullable() }),
])
```

### `tache.ts`

```typescript
export const TacheCreateSchema = z.object({
  titre: z.string().min(2).max(200),
  description: z.string().max(2000).nullable().optional(),
  projet_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  date_echeance: z.string().datetime().nullable().optional(),
  priorite: z.enum(['haute', 'normale', 'basse']).default('normale'),
  notification_active: z.boolean().default(false),
  notification_email: z.boolean().default(false),
  notification_push: z.boolean().default(false),
})
```

### `document.ts`

```typescript
export const DocumentUploadSchema = z.object({
  nom: z.string().min(1).max(200),
  type: z.enum(['devis', 'rapport', 'plan', 'photo', 'contrat', 'autre']),
  description: z.string().max(1000).nullable().optional(),
})
```

---

## 6. Écrans

### 6.1 Liste projets (`/projets`)

- **Recherche** : input texte, filtre sur titre du projet ou nom du client associé
- **Filtres** :
  - Statut : `En étude` | `En cours` | `Terminé` | `SAV` (pill buttons, multi-select possible)
  - Secteur : `⚡ Courants forts` | `📡 Courants faibles` | `☀️ Photovoltaïque`
- **Carte projet** : titre, lien client (nom cliquable), badge statut coloré, badge secteur, montant devis formaté, barre de progression visuelle, date fin estimée
- **SAV** : bordure rouge + badge pulsant rouge
- **Pagination** : 10 projets par page
- **Bouton** "Nouveau projet" en haut à droite → ouvre `ProjetForm` (modal)

Couleurs badges statut :
- `en_etude` → bleu
- `en_cours` → orange
- `termine` → vert
- `sav` → rouge

### 6.2 Modal création/édition projet (`ProjetForm`)

Champs (ordre d'affichage) :
1. Titre\* (text input)
2. Client\* (select chargé depuis `/api/clients?limit=100`)
3. Type\* (select : Installation / Étude / Maintenance / SAV)
4. Secteur\* (select : Courants forts / Courants faibles / Photovoltaïque)
5. Statut\* (select)
6. Montant devis (number, €, optionnel)
7. Date début estimée (date input, optionnel)
8. Date fin estimée (date input, optionnel)
9. Notes (textarea, optionnel)

- `client_id` pré-rempli et désactivé si ouvert depuis la fiche client
- Validation Zod côté client (react-hook-form) + côté serveur (API route)
- Bouton "Supprimer" visible uniquement en mode édition (délégué à `DeleteProjetButton`)

### 6.3 Fiche projet (`/projets/[id]`)

**Données chargées en parallèle côté serveur :**
1. Projet + client (join)
2. Tâches liées (`projet_id = id`, triées par priorité puis échéance)
3. Interactions liées (`projet_id = id`, triées par date DESC)
4. Documents liés (`projet_id = id`, triés par created_at DESC)
5. Nombre de chaque entité (pour les compteurs d'onglets)

**Header (`ProjetHeader`)** :
- Bouton retour liste
- Titre du projet
- Lien client (badge cliquable → `/clients/[client_id]`)
- Badges : statut (coloré) + secteur + type
- Boutons : Modifier (ouvre `ProjetForm`) | Supprimer (`DeleteProjetButton`)

**Bloc infos (`ProjetInfos`)** :
- Dates : début estimée, fin estimée, fin réelle (si `statut = termine`)
- Montants : devis / facturé (si renseigné), delta formaté
- Type + secteur en texte lisible

**Avancement (`ProjetAvancement`)** :
- 5 boutons pill : `0%` `25%` `50%` `75%` `100%`
- Le bouton actif est mis en valeur (couleur pleine)
- Au clic → PATCH `/api/projets/[id]` avec `{ avancement: value }`, pas de bouton "Enregistrer"
- État optimiste : mise à jour immédiate de l'UI, rollback si erreur

**Sous-onglets (`ProjetTabs`)** :

*Documents* (`ProjetDocuments`) :
- Liste : icône type, nom fichier, taille formatée, date upload, bouton télécharger
- Bouton "Ajouter un document" → ouvre un mini-dialog : champ `nom` (pré-rempli depuis le nom du fichier), select `type`, description optionnelle, puis bouton "Choisir un fichier" — l'upload ne démarre qu'après validation du formulaire
- Bucket Supabase Storage : `documents`, path `projets/[id]/[filename]`
- Fichiers acceptés : PDF, images (JPG, PNG), tout fichier jusqu'à 20 Mo
- Téléchargement via URL signée Supabase (60 min TTL)

*Tâches* (`ProjetTaches`) :
- Liste : checkbox statut (PATCH au clic), titre, badge priorité coloré, date échéance formatée
- Tri : tâches `a_faire` en premier, puis par priorité (haute → normale → basse), puis par date_echeance
- Bouton "Nouvelle tâche" → ouvre `TacheForm` modal avec `projet_id` pré-rempli
- `TacheForm` champs : titre\*, priorité, date échéance, description, notifications (toggle simple enregistré en base mais **non déclenché** — câblage Resend/WebPush en Plan 4)

*Échanges* (`ProjetInteractions`) :
- Liste : badge type (appel/email/visite/réunion/autre), date formatée, résumé tronqué à 2 lignes, `suite_a_donner` si renseigné
- Bouton "Nouvel échange" → redirect `router.push('/echanges/nouveau?projet=[id]')`
- La page `/echanges/nouveau` affiche "Module en cours de développement" jusqu'à Plan 5

*Notes* (`ProjetNotes`) :
- Clone exact de `ClientNotes` : textarea pleine largeur, autosave debounce 1s, PATCH `/api/projets/[id]`
- Indicateur "Enregistré" / "Modification en cours..."

### 6.4 FAB dashboard (`FabCreate`)

- Bouton `+` flottant en bas à droite (au-dessus de la bottom nav), visible uniquement sur la page `/`
- Au clic → menu contextuel 3 options :
  - "Nouveau client" → ouvre `ClientForm`
  - "Nouveau projet" → ouvre `ProjetForm` (sans client pré-rempli)
  - "Nouvelle tâche" → ouvre `TacheForm` (sans projet/client pré-rempli)
- Animation d'ouverture (transition CSS, pas de lib externe)

### 6.5 Mise à jour `ClientTabs` — onglet Projets

Remplace le placeholder actuel par :
- Liste des projets du client (cartes compactes : titre, badge statut, barre progression)
- Lien "Voir le projet" sur chaque carte → `/projets/[id]`
- Bouton "Nouveau projet" → ouvre `ProjetForm` avec `client_id` pré-rempli et verrouillé
- Si aucun projet : message "Aucun projet pour ce client" + bouton création

---

## 7. Comportement adaptatif

| Élément | Mobile | Desktop |
|---|---|---|
| FAB | Fixé au-dessus de la bottom nav | Fixé en bas à droite de la page |
| Modal ProjetForm | Plein écran avec scroll | Dialog centré max-w-2xl |
| Sous-onglets | Scroll horizontal si besoin | Onglets fixes alignés |
| Upload documents | Caméra + galerie + fichiers | Explorateur de fichiers |

---

## 8. Qualité & robustesse

- TypeScript strict, aucun `any`
- Zod sur tous les formulaires et toutes les API routes
- Skeleton loaders sur tous les chargements (`loading.tsx` + states internes)
- Error boundaries sur chaque page
- État optimiste sur les actions fréquentes (checkbox tâche, boutons avancement)
- Pagination côté serveur sur la liste projets
- RLS Supabase : toutes les tables déjà activées depuis Plan 2
- Tests unitaires : `ProjetCard`, `ProjetAvancement` (logique étapes), schemas Zod

---

## 9. Liens avec les autres plans

| Plan | Dépendance |
|---|---|
| Plan 2 | `ClientTabs` existant mis à jour — pas de rupture |
| Plan 3b | `ProjetDocuments` enrichi avec génération PDF |
| Plan 4 | `TacheForm` créé ici, réutilisé tel quel dans le module Tâches |
| Plan 5 | `/echanges/nouveau` placeholder remplacé par le vrai formulaire |
