# Spec — Guide utilisateur dans les Paramètres

**Date :** 2026-05-29  
**Statut :** Approuvé

---

## Contexte

La page `/parametres` contient actuellement deux sections : "Informations entreprise" (formulaire) et "Compte" (déconnexion). L'utilisateur souhaite y ajouter un guide utilisateur consultable directement dans l'app, accessible facilement depuis son téléphone Android, sans téléchargement.

---

## Objectif

Ajouter un onglet "Guide" dans la page Paramètres avec un contenu complet : démarrage rapide (onboarding) + référence des modules. Le guide doit être lisible sur mobile, statique (aucune BDD), et deep-linkable via URL.

---

## Architecture

### Navigation par onglets

La page `/parametres/page.tsx` lit `searchParams.tab` côté serveur (valeurs : `"parametres"` | `"guide"`, défaut `"parametres"`). Selon la valeur, elle affiche soit le contenu existant, soit le `GuideUtilisateur`.

La barre d'onglets est un **client component** minimal (`ParametresTabs`) qui utilise `useRouter` / `Link` pour changer le paramètre URL sans rechargement complet.

### Composants

| Composant | Type | Rôle |
|---|---|---|
| `ParametresTabs` | Client | Barre d'onglets 2 boutons, état actif via `searchParams` |
| `GuideUtilisateur` | Server | Contenu statique du guide, aucune dépendance externe |

**Pas de nouveau fichier de route.** Tout reste dans `/parametres`.

---

## Contenu du guide

### Section 1 — Démarrage rapide

Checklist numérotée avec icône et statut visuel (étape) :

1. Configurer les informations entreprise (onglet Paramètres → Informations entreprise)
2. Créer le premier client (module Clients → bouton +)
3. Créer un projet lié à ce client (module Projets → bouton +)
4. Créer une tâche avec rappel (module Tâches → bouton +)
5. Activer les notifications push (module Plus → Paramètres → section Notifications)

### Section 2 — Référence par module

Une carte par module. Contenu de chaque carte :

**Dashboard**
- Ce que ça fait : KPIs du jour (clients, projets actifs, tâches en retard), accès rapide aux éléments récents
- Actions clés : bouton FAB "+" pour création rapide (client / projet / tâche)
- Astuce : les KPIs se rafraîchissent à chaque ouverture

**Clients & Contacts**
- Ce que ça fait : liste paginée des entreprises clientes, fiche enrichie avec contacts, KPIs financiers, notes
- Actions clés : créer / modifier / archiver un client ; ajouter des contacts
- Astuce : appui long sur un numéro → composeur direct sur Android

**Projets & Chantiers**
- Ce que ça fait : suivi des chantiers liés aux clients, progression, statut
- Actions clés : créer un projet depuis la liste ou depuis la fiche client ; modifier le statut
- Astuce : filtre par statut (En cours / Terminé / En attente) disponible en haut de liste

**Tâches & Rappels**
- Ce que ça fait : liste des actions à faire avec date d'échéance, notifications email J-1 et push J0
- Actions clés : créer / compléter / reporter une tâche ; activer les notifications push
- Astuce : les tâches du jour apparaissent aussi sur le Dashboard

**Documents**
- Ce que ça fait : upload de fichiers liés aux projets/clients, génération de PDF depuis templates
- Actions clés : uploader un fichier (caméra / galerie / fichiers sur Android) ; générer un PDF
- Astuce : les PDF générés sont téléchargeables et partageables directement

**Échanges**
- Ce que ça fait : journal chronologique des interactions (appels, emails, visites) par client/projet
- Actions clés : logger un échange ; filtrer par type
- Astuce : noter un échange juste après l'appel pour ne rien oublier

---

## Rendu visuel

- Fond cohérent avec le reste de l'app (`bg-slate-900`, texte `text-white` / `text-slate-300`)
- Onglets : deux boutons pleins, couleur active `bg-blue-600`, inactif `bg-slate-800`
- Cartes modules : `bg-slate-800 rounded-xl p-4`, titre en blanc, contenu en `text-slate-300`
- Section démarrage rapide : numéros cerclés, texte descriptif
- Pas d'images, pas de liens externes — 100 % statique et offline-compatible

---

## Ce qui ne change pas

- Le formulaire entreprise (`EntrepriseForm`) reste identique
- Le bouton de déconnexion reste identique
- Aucune table Supabase touchée
- Aucune API route créée

---

## Tests

- `guide-utilisateur.test.tsx` — render du composant : vérifie la présence des 6 titres de modules et des 5 étapes de démarrage
- `parametres-tabs.test.tsx` — vérifie que l'onglet actif correspond au searchParam reçu
- Mise à jour de `parametres/page.tsx` : test de rendu avec `searchParams = { tab: 'guide' }` et `{ tab: 'parametres' }`

---

## Hors périmètre

- Pas d'export PDF du guide (non demandé)
- Pas de contenu éditable en BDD
- Pas de versioning du guide
