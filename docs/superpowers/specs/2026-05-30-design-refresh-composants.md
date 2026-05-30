# Design Refresh — Composants transversaux ATEXIA CRM

**Date :** 2026-05-30  
**Statut :** Approuvé  
**Périmètre :** 6 composants partagés, aucune nouvelle dépendance npm

---

## Contexte et objectifs

L'app utilise actuellement un thème dark sobre (`slate-950/800`) mais manque de fluidité et d'identité visuelle. Le gérant accède à l'app principalement sur Samsung Android. L'objectif est d'améliorer la qualité perçue sans réécrire de logique métier.

**Décisions de design :**
- Direction : **Identité ATEXIA** — header gradient bleu, bordures colorées par catégorie
- Icônes nav : **SVG Lucide inline** (cohérents sur tous les appareils)
- Icônes KPI/secteurs : **emojis conservés** (rendu Samsung correct, pas de dépendance)
- Animations : **subtiles uniquement** — transitions 150ms, feedback tactile scale(0.98)
- Approche : **composants transversaux d'abord** (impact max, risque minimal)

---

## Composants à modifier

### 1. `BottomNav` — `src/components/layout/bottom-nav.tsx`

**Changements :**
- Remplacer les emojis (`🏠 👥 🔨 ✅ ⋯`) par des icônes SVG Lucide inline (Home, Users, Building2, Clock, MoreHorizontal)
- Ajouter un point indicateur (`•`) sous l'onglet actif
- Fond : `bg-slate-900/80 backdrop-blur-md` au lieu de `bg-slate-800`
- Bordure top : `border-t-2 border-sky-500` au lieu de `border-slate-700`
- Icône active : `stroke-sky-400`, label : `text-sky-400 font-bold text-[10px]`
- Icône inactive : `stroke-slate-700`, label : `text-slate-700 text-[10px]`
- Transition : `transition-colors duration-150` sur chaque item

**SVG Lucide à utiliser (inline, pas de package) :**
| Tab | Icône Lucide | Path SVG |
|-----|-------------|----------|
| Accueil | Home | `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>` |
| Clients | Users | `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` |
| Projets | Building2 | `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>` |
| Tâches | Clock | `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>` |
| Plus | MoreHorizontal | `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>` |

---

### 2. `Badge` — `src/components/ui/badge.tsx`

**Changements :**
- `rounded` → `rounded-full` (pill)
- Fond translucide + bordure colorée au lieu de fond plein
- `px-2 py-0.5` → `px-2.5 py-0.5`

**Nouveaux styles par variant :**
```
info    : bg-sky-500/10 text-sky-300 border border-sky-500/30
success : bg-emerald-500/10 text-emerald-300 border border-emerald-500/30
warning : bg-amber-500/10 text-amber-300 border border-amber-500/30
danger  : bg-red-500/10 text-red-300 border border-red-500/30
neutral : bg-slate-500/10 text-slate-400 border border-slate-500/30
```

---

### 3. Cards — `ClientCard`, `ProjetCard`, `TacheCard`, `EchangeCard`, `DocumentCard`

Fichiers concernés :
- `src/components/clients/client-card.tsx`
- `src/components/projets/projet-card.tsx`
- `src/components/taches/tache-card.tsx`
- `src/components/echanges/echange-card.tsx`
- `src/components/documents/document-card.tsx`

**Changements communs à toutes les cards :**
- Fond : `bg-slate-800` → `bg-slate-900`
- Ajouter : `border border-slate-800`
- Ajouter : `border-l-4` avec couleur selon catégorie (voir tableau ci-dessous)
- Feedback tactile : `active:scale-[0.98] transition-transform duration-150`
- Hover desktop : `hover:border-slate-700`

**Couleurs `border-l-4` par catégorie :**
| Contexte | Couleur | Classe Tailwind |
|----------|---------|-----------------|
| Client actif / Projet en cours | sky-500 | `border-l-sky-500` |
| Client prospect / devis | violet-500 | `border-l-violet-500` |
| Client inactif / terminé | slate-600 | `border-l-slate-600` |
| Tâche haute priorité | red-500 | `border-l-red-500` |
| Tâche normale | amber-500 | `border-l-amber-500` |
| Échange / Document | sky-500 | `border-l-sky-500` |

---

### 4. `DashboardKpis` — `src/components/dashboard/dashboard-kpis.tsx`

**Changements :**
- `KpiCard` : remplacer `colorClass` (fond coloré) par `borderClass` (bordure gauche)
- Fond : `bg-slate-900 border border-slate-800 border-l-4`
- Emojis conservés (Samsung correct)
- Mapping des bordures :
  - Clients actifs → `border-l-sky-500`
  - Projets en cours → `border-l-violet-500`
  - Tâches urgentes → `border-l-red-500`
  - Devis → `border-l-amber-500`

---

### 5. Header dashboard — `src/app/(app)/page.tsx`

**Changements :**
- Remplacer le header texte brut par une carte gradient
- Structure :

```tsx
<div className="bg-gradient-to-r from-sky-900 to-sky-700 rounded-2xl p-4 mb-6 flex justify-between items-center">
  <div>
    <p className="text-sky-200 text-xs">Bonjour 👋</p>
    <h1 className="text-white text-xl font-bold">ATEXIA CRM</h1>
  </div>
  <span className="text-white/80 text-2xl font-black tracking-tighter">AX</span>
</div>
```

---

### 6. Headers de fiche — `ClientHeader`, `ProjetHeader`

Fichiers :
- `src/components/clients/client-header.tsx`
- `src/components/projets/projet-header.tsx`

**Changements :**
- Fond : `bg-slate-800 px-4 pt-4 pb-5` → bandeau gradient
- Fond container : `bg-gradient-to-r from-sky-950 to-slate-900 border-b border-sky-800/50 px-4 pt-4 pb-5`
- Lien retour : `← Clients` → SVG chevron-left + texte
  ```tsx
  <Link href="/clients" className="flex items-center gap-1 text-sky-400 text-sm mb-3">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Clients
  </Link>
  ```

---

## Ce qui ne change PAS

- Logique métier, requêtes Supabase, validations Zod
- Couleurs d'accentuation globales (`sky-400` reste la couleur active)
- `globals.css` (aucune modification nécessaire)
- Formulaires, modals, skeleton loaders
- Tout composant non listé ci-dessus

---

## Tests à prévoir

- Vérifier l'affichage de chaque composant modifié sur Chrome Android (émulateur) et desktop
- Vérifier que les tests existants (`badge.test.tsx`, `client-card.test.tsx`, etc.) passent toujours — les changements sont purement CSS/JSX, pas de logique
- Build `next build` sans erreur TypeScript
