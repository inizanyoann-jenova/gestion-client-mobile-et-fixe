# Spec — Améliorations #8, #9, #10 — ATEXIA CRM

**Date :** 2026-05-30  
**Stack :** Next.js 14 App Router, TypeScript strict, Supabase, Tailwind dark theme, Zod, Resend, Web Push

---

## #8 — Recherche globale instantanée

### Objectif
Permettre au gérant de retrouver n'importe quel enregistrement (client, projet, contact, devis) en quelques frappes depuis n'importe quelle page.

### Trigger
- **Mobile** : icône loupe dans le header de chaque page (bouton `<button>` qui ouvre le modal).
- **Desktop** : même icône dans le header + raccourci clavier `Cmd+K` / `Ctrl+K` (listener global via `useEffect`).
- La bottom-nav existante (5 onglets) n'est **pas modifiée**.

### API Route — `GET /api/search?q=...`
- Route authentifiée (Supabase Auth serveur).
- Paramètre `q` : string. Si vide ou < 2 caractères → retourne `{ clients: [], projets: [], contacts: [], devis: [] }`.
- 4 requêtes Supabase en parallèle via `Promise.all` :
  - `clients` : champs `id, nom, ville`. Filtre `ilike` sur `nom` et `ville`. Limit 5.
  - `projets` : champs `id, titre, statut`. Filtre `ilike` sur `titre`. Limit 5.
  - `contacts` : champs `id, nom, email, telephone, client_id`. Filtre `ilike` sur `nom`, `email`, `telephone`. Limit 5.
  - `devis` : champs `id, numero, statut, client_id`. Filtre `ilike` sur `numero`. Limit 5.
- Validation retour Zod : `SearchResultsSchema`.
- Gestion d'erreur : si une requête échoue, les autres continuent (try/catch par source).

### Composant — `SearchModal`
- `'use client'`, état local : `query` (string), `results` (SearchResults), `loading` (boolean), `isOpen` (boolean — géré par le parent via prop ou context).
- Debounce 300ms : `useRef<ReturnType<typeof setTimeout>>` + `clearTimeout` à chaque frappe.
- Requête fetch vers `/api/search?q=...` dès que `query.length >= 2`.
- **Affichage** :
  - Overlay plein écran sur mobile (`fixed inset-0 bg-slate-950/90 z-50`).
  - Dialog centré sur desktop (`max-w-lg mx-auto mt-20`).
  - Input autofocusé à l'ouverture.
  - Résultats groupés par section : **Clients | Projets | Contacts | Devis**.
  - Chaque résultat = ligne cliquable qui navigue vers la fiche (`router.push`) et ferme le modal.
  - Message "Aucun résultat" si `query >= 2` et résultats tous vides.
  - Skeleton loader pendant le chargement.
- **Fermeture** : touche Échap, clic sur le fond sombre.
- Routes de navigation :
  - Client → `/clients/[id]`
  - Projet → `/projets/[id]`
  - Contact → `/clients/[client_id]` (scroll vers la section contacts)
  - Devis → `/finances/devis/[id]`

### Intégration header
- Composant `PageHeader` réutilisable : `{ title, backHref?, onSearchOpen }`.
- Affiché en haut de chaque page principale (clients, projets, tâches, échanges, documents, finances, planning).
- Desktop : le bouton loupe affiche aussi le hint "⌘K".

### Tests
- `GET /api/search` : retourne 200 avec résultats groupés, retourne `{}` si `q` vide, gère erreur Supabase.
- `SearchModal` : render avec résultats, debounce (fake timers), navigation au clic, fermeture sur Échap.

---

## #9 — Planning / Calendrier

### Objectif
Donner une vue temporelle unifiée sur tâches, visites, échéances devis et factures.

### Page — `/planning`
- Route : `src/app/(app)/planning/page.tsx` — Server Component.
- Lien dans `/plus` (page modules supplémentaires) et éventuellement dans le dashboard.

### Données chargées (Server Component)
Requêtes Supabase parallèles pour le mois affiché (plage `[début_mois - 1 semaine, fin_mois + 1 semaine]`) :
1. `taches` : `id, titre, date_echeance, statut`. Filtre `statut != 'terminée'`.
2. `interactions` : `id, type, notes, date`. Filtre `type = 'visite'`.
3. `devis` : `id, numero, statut, date_validite`. Filtre `statut IN ('brouillon', 'envoyé')`.
4. `factures` : `id, numero, statut, date_echeance`. Filtre `statut IN ('émise', 'en_retard')`.

### Normalisation — `CalendarEvent`
```ts
interface CalendarEvent {
  id: string
  type: 'tache' | 'visite' | 'devis' | 'facture'
  label: string    // titre tâche / "Visite" / numero devis / numero facture
  date: string     // YYYY-MM-DD
  href: string     // route vers la fiche
  color: 'sky' | 'emerald' | 'amber' | 'red'
}
```
Couleurs : tâche → `sky`, visite → `emerald`, devis → `amber`, facture → `red`.

### Composant — `PlanningCalendar`
- `'use client'`.
- State : `currentMonth: Date` (initialisation : mois courant passé en prop depuis le Server Component).
- CSS grid 7 colonnes (`grid-cols-7`). En-têtes : Lu Ma Me Je Ve Sa Di.
- Cellule de chaque jour :
  - Numéro du jour.
  - Events du jour : dots colorés + label court tronqué (1 ligne max).
  - Jour actuel : cerclé en `sky`.
  - Jour hors mois courant : texte `slate-600`.
- Sur mobile : dots seuls (pas de label pour économiser l'espace), max 3 dots par jour.
- Sur desktop (md+) : label court visible sous chaque dot, max 3 events par jour + compteur "+N" si plus.
- Navigation : boutons `‹` et `›` qui modifient `currentMonth`, bouton "Aujourd'hui".
- Clic sur un event → `router.push(href)`.
- Clic sur un jour sans event → rien (pas de création d'event depuis le calendrier).

> Le mois affiché côté client peut diverger du mois chargé côté serveur : si l'utilisateur navigue vers un mois non chargé, le composant affiche les events disponibles (vides pour ce mois) et indique visuellement qu'il faut rafraîchir. Une implémentation v2 pourrait charger dynamiquement via une API route ; en v1 on charge le mois courant ± 1 mois.

### Tests
- Fonction de normalisation des events.
- Rendu `PlanningCalendar` avec events mock : vérifie l'affichage par type/couleur.
- Navigation entre mois.

---

## #10 — Portail client + signature électronique devis

### Objectif
Permettre à un client de consulter et signer un devis en ligne, sans créer de compte, via un lien sécurisé à durée de vie limitée.

### Migration SQL

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

-- Index pour les lookups par token
CREATE INDEX devis_tokens_token_idx ON devis_tokens(token);

-- RLS : pas de politique restrictive (accès public par token)
ALTER TABLE devis_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "token_public_read" ON devis_tokens FOR SELECT USING (true);
CREATE POLICY "token_public_update" ON devis_tokens FOR UPDATE USING (true);
```

### Flux utilisateur

1. Gérant ouvre `/finances/devis/[id]` → clique **"Envoyer pour signature"**.
2. `POST /api/devis/[id]/envoyer-signature` crée un token + envoie email Resend.
3. Client reçoit email avec le lien `https://[domain]/devis/[token]`.
4. Client consulte le devis (HTML) + saisit son nom + coche "J'accepte".
5. Clic "Signer et accepter" → `POST /api/devis/signer`.
6. Redirect vers `/devis/[token]/confirme`.

### Routes API

#### `POST /api/devis/[id]/envoyer-signature`
- Auth : Supabase serveur (réservé au gérant).
- Validation : devis existe, statut = `'envoyé'` ou `'brouillon'`.
- Actions :
  1. Insert dans `devis_tokens` (token généré par Postgres via `gen_random_uuid()`).
  2. Récupère l'email du contact principal du client (ou email saisi manuellement si absent).
  3. Envoie email Resend avec lien `/devis/[token]`.
- Retour : `{ ok: true, token: string }`.
- Erreur : 400 si devis déjà signé ou statut incompatible.

#### `POST /api/devis/signer`
- **Pas d'auth** — accessible publiquement.
- Body Zod : `{ token: string, signe_par: string }`.
- Validations :
  1. Token existe dans `devis_tokens`.
  2. `expires_at > now()`.
  3. `signed_at IS NULL` (pas déjà signé).
- Actions (si valide) :
  1. Update `devis_tokens` : `signed_at = now()`, `signe_par`.
  2. Update `devis.statut = 'accepté'`.
  3. Envoie notification Web Push au patron.
- Retour : `{ ok: true }`.
- Erreurs : 404 (token inconnu), 410 (expiré), 409 (déjà signé).
- Client Supabase : **service-role** (bypass RLS, sans auth utilisateur).

### Pages publiques

#### `src/app/devis/[token]/page.tsx`
- Hors du groupe `(app)` → pas de bottom-nav, pas de layout auth.
- Server Component : charge `devis_tokens` + devis complet via service-role client.
- Si token invalide/expiré/déjà signé → affiche message d'état approprié (pas de 404 brutal).
- Affichage HTML du devis :
  - En-tête : numéro, date, client.
  - Lignes du devis (tableau).
  - Totaux HT / TVA / TTC.
  - Pas de bouton "Télécharger PDF" en v1 (la route PDF est authentifiée ; le client peut imprimer depuis le navigateur).
- Formulaire de signature (composant `'use client'` `SignatureForm`) :
  - Champ texte "Votre nom complet" (requis).
  - Case à cocher "Je déclare avoir pris connaissance du devis et l'accepte sans réserve".
  - Bouton "Signer et accepter" (désactivé jusqu'à case cochée + nom saisi).
  - Si `signed_at` renseigné : formulaire remplacé par "✓ Devis signé le [date] par [nom]".

#### `src/app/devis/[token]/confirme/page.tsx`
- Page statique publique : "Votre acceptation a bien été enregistrée. Nous vous recontacterons prochainement."
- Lien de retour vers le devis signé.

### Composant — `EnvoyerSignatureButton`
- Affiché sur `/finances/devis/[id]` si `statut IN ('brouillon', 'envoyé')`.
- Appelle `POST /api/devis/[id]/envoyer-signature`.
- Feedback : toast succès ("Lien de signature envoyé") ou erreur.

### Type Supabase à ajouter
```ts
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

### Tests
- `POST /api/devis/[id]/envoyer-signature` : crée token, appelle Resend mock, 400 si déjà signé.
- `POST /api/devis/signer` : succès, 410 si expiré, 409 si déjà signé, 404 si token inconnu.
- `SignatureForm` : bouton désactivé par défaut, activé après nom + case.
- `EnvoyerSignatureButton` : render, appel API, feedback toast.

---

## Résumé des fichiers à créer

### #8 Recherche
- `src/app/api/search/route.ts`
- `src/components/search/search-modal.tsx`
- `src/components/search/__tests__/search-modal.test.tsx`
- `src/components/layout/page-header.tsx`
- Modification : headers de chaque page principale

### #9 Planning
- `src/app/(app)/planning/page.tsx`
- `src/app/(app)/planning/loading.tsx`
- `src/components/planning/planning-calendar.tsx`
- `src/components/planning/__tests__/planning-calendar.test.tsx`
- `src/lib/planning/normalize-events.ts`
- `src/lib/planning/__tests__/normalize-events.test.ts`
- Modification : lien dans `/plus`

### #10 Portail signature
- Migration SQL `devis_tokens`
- `src/app/api/devis/[id]/envoyer-signature/route.ts`
- `src/app/api/devis/signer/route.ts`
- `src/app/devis/[token]/page.tsx`
- `src/app/devis/[token]/confirme/page.tsx`
- `src/app/devis/layout.tsx` (layout minimal public)
- `src/components/finances/envoyer-signature-button.tsx`
- `src/components/finances/signature-form.tsx`
- `src/components/finances/__tests__/envoyer-signature-button.test.tsx`
- Modification : `src/lib/supabase/finance-types.ts` (ajout `DevisToken`)
- Modification : `src/app/(app)/finances/devis/[id]/page.tsx` (ajout bouton)
