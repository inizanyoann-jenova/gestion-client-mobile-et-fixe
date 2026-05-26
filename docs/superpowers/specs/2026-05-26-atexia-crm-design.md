# Spécification — Application CRM Atexia

**Date :** 2026-05-26  
**Projet :** Application de gestion de clients pour ATEXIA (La Réunion)  
**Statut :** Validé

---

## 1. Contexte et objectif

ATEXIA est une entreprise BTP basée à La Réunion, spécialisée dans trois domaines :
- **Courants forts** : réseaux BT, TGBT, études d'éclairement
- **Courants faibles** : réseaux informatiques, câblage, systèmes intelligents
- **Photovoltaïque** : ombrières, carports, installations industrielles

L'application a pour but de centraliser la gestion de la relation client : suivi des contacts, des chantiers, des documents, des échanges et des tâches. Elle remplace un suivi fragmenté (fichiers, notes, mémoire) par un outil unique, accessible sur téléphone et ordinateur.

**Utilisateur :** 1 seul utilisateur (le gérant ou commercial d'ATEXIA)  
**Priorité absolue :** zéro bug — qualité et robustesse avant vitesse de livraison

---

## 2. Stack technique

| Composant | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript strict |
| Styles | Tailwind CSS |
| Backend | Next.js API Routes |
| Base de données | Supabase (PostgreSQL) |
| Stockage fichiers | Supabase Storage |
| Authentification | Supabase Auth (session unique) |
| Génération PDF | `@react-pdf/renderer` |
| Emails | Resend (notifications, rappels) |
| Notifications push | Web Push API (natif navigateur) |
| Validation | Zod (côté client et serveur) |
| Hébergement | Vercel (plan gratuit suffisant) |
| Mobile | PWA (Progressive Web App) — installable sans app store |

---

## 3. Modèle de données

### `clients`
```
id, nom, secteur (courants_forts | courants_faibles | photovoltaique | mixte),
adresse, siret, statut (prospect | actif | inactif),
notes, created_at, updated_at
```

### `contacts`
```
id, client_id (FK), prenom, nom, poste,
telephone, email, est_principal (bool),
created_at, updated_at
```

### `projets`
```
id, client_id (FK), titre,
type (installation | etude | maintenance | sav),
secteur (courants_forts | courants_faibles | photovoltaique),
statut (en_etude | en_cours | termine | sav),
avancement (0-100), montant_devis, montant_facture,
date_debut_estimee, date_fin_estimee, date_fin_reelle,
notes, created_at, updated_at
```

### `documents`
```
id, client_id (FK nullable), projet_id (FK nullable),
type (devis | rapport | plan | photo | contrat | autre),
nom, description, storage_path, taille_octets,
genere_par_app (bool), created_at
```

### `taches`
```
id, client_id (FK nullable), projet_id (FK nullable),
titre, description, date_echeance,
priorite (haute | normale | basse),
statut (a_faire | fait),
notification_active (bool), notification_email (bool), notification_push (bool),
created_at, updated_at
```

### `interactions`
```
id, client_id (FK nullable), projet_id (FK nullable),
type (appel | email | visite | reunion | autre),
date, resume, suite_a_donner,
created_at
```

### `modules_config`
```
id, cle, label, icone, ordre, visible (bool), created_at
```
*(Table permettant d'activer/désactiver les modules depuis les paramètres)*

---

## 4. Architecture de navigation

### Navigation principale (barre basse — 5 onglets)
1. **Accueil** — Tableau de bord
2. **Clients** — Liste et fiches clients
3. **Projets** — Liste des chantiers
4. **Tâches** — Rappels et actions à faire
5. **Plus** — Grille des modules supplémentaires (Documents, Échanges, Paramètres…)

### Extensibilité
- Le 5ème onglet "Plus" affiche une grille de tous les modules non affichés en barre principale
- Chaque section principale peut avoir des **sous-onglets scrollables** (ex : Projets → En cours / Terminés / SAV)
- Les sous-onglets sont configurables via la table `modules_config`
- Ajouter un nouveau module ne nécessite pas de modifier les écrans existants

---

## 5. Écrans et fonctionnalités

### 5.1 Tableau de bord
- Salutation avec nom de l'entreprise
- 4 KPIs : clients actifs, projets en cours, tâches urgentes, devis envoyés
- Liste des tâches du jour (priorité colorée : rouge/orange/vert)
- Projets récents avec statut
- Accès rapide au bouton de création universelle

### 5.2 Liste des clients
- Recherche par nom
- Filtre par statut (prospect / actif / inactif)
- Filtre par secteur (⚡ / 📡 / ☀️)
- Carte par client : nom, statut, dernier contact
- Bouton "Nouveau client"

### 5.3 Fiche client (détail)
**En-tête :**
- Nom, secteur, statut (badge coloré)
- 4 boutons d'action rapide :
  - 📞 Appeler → `tel:` sur mobile / popup numéro sur desktop
  - ✉️ Email → `mailto:` sur les deux
  - 📝 Note rapide → formulaire in-app
  - 📍 Carte → Maps app sur mobile / Google Maps desktop

**Section infos :**
- 3 KPIs financiers : CA réalisé, montant en attente, nombre de projets
- Contacts multiples (initiales colorées, appel direct, "principal" marqué)
- Informations entreprise : adresse, SIRET, secteur, date d'entrée en relation

**Section activité :**
- Dernier échange résumé
- Prochain rappel mis en évidence

**Notes libres :** zone de texte éditable

**Sous-onglets scrollables :**
- Projets (compteur)
- Documents (compteur)
- Échanges (compteur)
- Tâches (compteur)
- ＋ (bouton pour ajouter un sous-onglet à l'avenir)

### 5.4 Liste des projets
- Recherche par nom de projet ou client
- Filtre par statut : En cours / En étude / Terminé / SAV
- Filtre par type : ⚡ Courants forts / 📡 Courants faibles / ☀️ Photovoltaïque
- Carte par projet : titre, client, type, montant, barre de progression, dates
- Alerte visuelle rouge pour les SAV urgents

### 5.5 Fiche projet (détail)
- Toutes les infos du projet (statut, dates, montant devis/facturé)
- Barre de progression éditable
- Lien vers le client associé
- Sous-onglets : Documents / Tâches / Échanges / Notes

### 5.6 Tâches & Rappels
- Liste triée par date d'échéance
- Filtre par priorité (haute / normale / basse)
- Filtre par statut (à faire / fait)
- Lien contextuel vers le client ou projet associé
- Création rapide avec date, priorité, notification on/off

### 5.7 Documents
- Liste de tous les fichiers (PDF, photos, plans)
- Filtre par type (devis / rapport / plan / photo / contrat)
- Upload de fichiers (stockés dans Supabase Storage)
- Génération de PDF depuis templates (`@react-pdf/renderer`)
- Aperçu in-app et téléchargement

### 5.8 Historique des échanges
- Journal de tous les contacts (appels, emails, visites, réunions)
- Filtrable par client, projet, type, date
- Champ "suite à donner" pour chaque échange
- Création rapide depuis la fiche client

### 5.9 Paramètres
- Informations de l'entreprise (nom, logo)
- Gestion des modules (activer/désactiver, réordonner)
- Préférences de notification (email, push)
- Compte et sécurité

---

## 6. Système de notifications

### Email (Resend)
- Rappel de tâche J-1 et J0 à l'heure définie
- Résumé quotidien des tâches du jour (optionnel)

### Web Push
- Notification push sur le téléphone/navigateur
- Activée par tâche individuellement
- Fonctionne même quand l'app est fermée (service worker)

---

## 7. Génération de documents PDF

- Templates configurables (devis, rapport d'intervention, bon de réception)
- Champs pré-remplis depuis les données client/projet
- Logo ATEXIA et mise en page professionnelle
- Sauvegarde automatique dans le dossier Documents du projet/client

---

## 8. Comportement adaptatif desktop/mobile

| Élément | Mobile | Desktop |
|---|---|---|
| Navigation | Barre basse 5 onglets | Sidebar gauche + barre basse masquée |
| 📞 Appeler | Ouvre le composeur | Popup avec numéro à lire/copier |
| ✉️ Email | Ouvre l'app mail | Ouvre le client mail par défaut (`mailto:`) |
| 📍 Carte | Ouvre Maps app | Ouvre Google Maps dans navigateur |
| Upload fichiers | Caméra + galerie + fichiers | Explorateur de fichiers |

---

## 9. Qualité et robustesse

- **TypeScript strict** (`strict: true`) — aucun `any` autorisé
- **Validation Zod** sur toutes les entrées (formulaires + API routes)
- **Gestion d'erreurs** : error boundaries React, messages utilisateur clairs
- **Row Level Security (RLS)** Supabase activé sur toutes les tables
- **Tests** : tests unitaires sur la logique métier critique (calculs financiers, logique de notifications)
- **Loading states** : skeletons sur tous les chargements asynchrones
- **Offline graceful** : message clair si pas de réseau (pas d'offline complet requis)
- **Pagination** : toutes les listes paginées pour éviter les problèmes de performance

---

## 10. Hors périmètre (v1)

Les éléments suivants sont volontairement exclus de la v1 mais l'architecture les rend ajoutables sans refonte :
- Facturation et génération de factures
- Gestion des fournisseurs
- Suivi des heures / planning équipes
- Multi-utilisateurs / rôles
- Mode hors-ligne complet
- Application native (Capacitor) si la PWA s'avère insuffisante
