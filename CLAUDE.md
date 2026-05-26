# CLAUDE.md — Application CRM ATEXIA

Ce fichier donne le contexte complet du projet à Claude à chaque nouvelle conversation.

---

## L'entreprise

**ATEXIA** — Entreprise BTP basée à La Réunion, spécialisée en :
- ⚡ **Courants forts** : réseaux BT, TGBT, études d'éclairement
- 📡 **Courants faibles** : réseaux informatiques, câblage, systèmes intelligents
- ☀️ **Photovoltaïque** : ombrières, carports, installations industrielles

Références clients : Carrefour Grand Nord (Saint-Denis), E. Leclerc Les Terrass (Saint-Joseph), Clinique des Orchidées (Le Port).

---

## Le projet

Application de **gestion de la relation client** (CRM) sur mesure pour ATEXIA.

**Utilisateur :** 1 seul utilisateur (le gérant)  
**Priorité absolue : zéro bug** — qualité et robustesse avant vitesse de livraison  
**Accès :** téléphone Android (principal) + ordinateur (secondaire)

---

## Stack technique validée

| Composant | Technologie | Raison |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript strict | SSR, API routes, typage fort |
| Styles | Tailwind CSS | Rapid UI, responsive natif |
| Backend | Next.js API Routes | Tout en un seul projet |
| Base de données | Supabase (PostgreSQL) | Gratuit, RLS, realtime |
| Stockage fichiers | Supabase Storage | Intégré, gratuit 1Go |
| Auth | Supabase Auth | Session unique, sécurisé |
| Génération PDF | `@react-pdf/renderer` | PDF depuis React |
| Emails | Resend | Gratuit 3000/mois |
| Notifications push | Web Push API | Natif navigateur, gratuit |
| Validation | Zod | Client + serveur |
| Mobile | PWA | Android = stable, gratuit, sans app store |
| Hébergement | Vercel | Gratuit pour 1 utilisateur |

**Coût total d'infrastructure : 0 €**

---

## Décisions d'architecture

- **Navigation** : barre basse 5 onglets sur mobile, sidebar sur desktop
- **Extensibilité** : onglet "Plus" pour les modules supplémentaires, sous-onglets configurables via table `modules_config`
- **PWA** : choisi sur Android (stable, performant, gratuit). Si besoin iOS natif un jour → migrer vers Capacitor sans réécrire le code
- **Single user** : pas de système de rôles en v1, RLS Supabase quand même activé pour la sécurité
- **Qualité** : TypeScript strict, Zod partout, error boundaries, skeletons, pagination sur toutes les listes

---

## Modules v1

1. **Tableau de bord** — KPIs, tâches du jour, projets récents
2. **Clients** — liste + fiche enrichie (contacts, KPIs financiers, actions rapides)
3. **Projets / Chantiers** — liste filtrée + fiche avec progression
4. **Tâches & Rappels** — avec notifications email (Resend) et push (Web Push)
5. **Documents** — upload fichiers + génération PDF depuis templates
6. **Échanges** — journal appels, emails, visites

---

## Modèle de données (tables Supabase)

- `clients` — entreprises clientes
- `contacts` — personnes chez chaque client
- `projets` — chantiers liés aux clients
- `documents` — fichiers uploadés ou générés
- `taches` — rappels et actions avec notifications
- `interactions` — historique des échanges
- `modules_config` — activation/ordre des modules (extensibilité)

Spec complète : [docs/superpowers/specs/2026-05-26-atexia-crm-design.md](docs/superpowers/specs/2026-05-26-atexia-crm-design.md)

---

## Hors périmètre v1

À ne pas implémenter sauf demande explicite :
- Facturation
- Gestion des fournisseurs
- Suivi des heures / planning équipes
- Multi-utilisateurs / rôles
- Mode hors-ligne complet
- App native (Capacitor)

---

## Comportement adaptatif

| Action | Mobile Android | Desktop |
|---|---|---|
| 📞 Appeler | `tel:` → composeur direct | Popup avec numéro à copier |
| ✉️ Email | `mailto:` → app mail | `mailto:` → client mail par défaut |
| 📍 Carte | Maps app Android | Google Maps dans navigateur |
| Upload | Caméra + galerie + fichiers | Explorateur de fichiers |

---

## Conventions de développement

- TypeScript strict — aucun `any`
- Zod sur tous les formulaires et toutes les API routes
- Error boundaries sur chaque page
- Skeleton loaders sur tous les chargements asynchrones
- Toutes les listes paginées
- RLS activé sur toutes les tables Supabase
- Pas de commentaires évidents — seulement les WHY non évidents
- Pas de features hors périmètre v1 sans validation utilisateur
