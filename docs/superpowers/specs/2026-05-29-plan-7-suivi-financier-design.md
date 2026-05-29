# Plan 7 — Module Suivi Financier ATEXIA CRM

**Date :** 2026-05-29  
**Auteur :** Brainstorming via Claude Code  
**Statut :** Validé

---

## Contexte

ATEXIA est une entreprise BTP à La Réunion. Le CRM dispose déjà des modules Clients, Projets, Tâches, Échanges, Documents et Dashboard (Plans 1–6). Le module Finances est la première extension hors périmètre v1 initial : il couvre la création de devis, la facturation et le suivi des paiements avec relances automatiques.

**Correction critique :** La TVA en vigueur à La Réunion est **8,5%** (taux normal). Les templates PDF existants utilisent incorrectement 20% — cette correction est incluse dans ce plan.

---

## Périmètre

- Catalogue de prestations réutilisables
- Création et suivi de devis (cycle complet)
- Génération de factures depuis un devis accepté
- Support de deux modes de paiement : unique et acompte + solde
- Envoi par email (Resend) + téléchargement PDF
- Relances automatiques pour factures en retard (J+7, J+30)
- Accès depuis : module `/finances`, fiche Projet, fiche Client

**Hors périmètre :** échéances multiples, comptabilité, export comptable, TVA réduite (2,1% / 1,05%).

---

## Navigation & Pages

### Accès
- `/plus` → carte **"Finances"** → `/finances`
- `/projets/[id]` → nouvel onglet **"Finances"**
- `/clients/[id]` → nouvel onglet **"Finances"**

### Pages

| Route | Composant | Description |
|---|---|---|
| `/finances` | Server Component | Vue globale : KPIs + onglets Devis / Factures |
| `/finances/devis/nouveau` | Client Component | Formulaire création devis |
| `/finances/devis/[id]` | Server Component | Fiche devis avec actions |
| `/finances/factures/[id]` | Server Component | Fiche facture avec actions |
| `/parametres?tab=catalogue` | Client Component | Gestion du catalogue de prestations |

### KPIs page `/finances`
- Montant total devis en cours (envoyés non répondus)
- CA facturé sur l'année en cours
- Montant impayé (factures émises non payées)
- Nombre de factures en retard

---

## Modèle de données

### Migration `supabase/migrations/004_finances.sql`

#### Table `prestations`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
libelle     text NOT NULL
description text
unite       text NOT NULL DEFAULT 'u'  -- u, h, m, m², forfait
prix_unitaire numeric(10,2) NOT NULL DEFAULT 0
taux_tva    numeric(4,2) NOT NULL DEFAULT 8.5
actif       boolean NOT NULL DEFAULT true
created_at  timestamptz NOT NULL DEFAULT now()
```

#### Table `devis`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
numero          text NOT NULL UNIQUE  -- DEV-2026-001
client_id       uuid NOT NULL REFERENCES clients(id)
projet_id       uuid REFERENCES projets(id)
statut          text NOT NULL DEFAULT 'brouillon'
                -- brouillon | envoyé | accepté | refusé | expiré
date_emission   date NOT NULL DEFAULT CURRENT_DATE
date_validite   date NOT NULL  -- défaut J+30
montant_ht      numeric(10,2) NOT NULL DEFAULT 0
montant_tva     numeric(10,2) NOT NULL DEFAULT 0
montant_ttc     numeric(10,2) NOT NULL DEFAULT 0
notes           text
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

#### Table `devis_lignes`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
devis_id        uuid NOT NULL REFERENCES devis(id) ON DELETE CASCADE
prestation_id   uuid REFERENCES prestations(id)  -- nullable (saisie libre)
libelle         text NOT NULL
quantite        numeric(10,3) NOT NULL DEFAULT 1
unite           text NOT NULL DEFAULT 'u'
prix_unitaire   numeric(10,2) NOT NULL
taux_tva        numeric(4,2) NOT NULL DEFAULT 8.5
total_ht        numeric(10,2) NOT NULL  -- quantite * prix_unitaire
ordre           integer NOT NULL DEFAULT 0
```

#### Table `factures`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
numero              text NOT NULL UNIQUE  -- FACT-2026-001
devis_id            uuid REFERENCES devis(id)  -- nullable (facture manuelle)
client_id           uuid NOT NULL REFERENCES clients(id)
projet_id           uuid REFERENCES projets(id)
type                text NOT NULL DEFAULT 'facture'
                    -- facture | acompte | solde
statut              text NOT NULL DEFAULT 'émise'
                    -- émise | payée | en_retard
date_emission       date NOT NULL DEFAULT CURRENT_DATE
date_echeance       date NOT NULL  -- défaut J+30
pourcentage_acompte numeric(5,2)   -- renseigné si type = acompte
montant_ht          numeric(10,2) NOT NULL DEFAULT 0
montant_tva         numeric(10,2) NOT NULL DEFAULT 0
montant_ttc         numeric(10,2) NOT NULL DEFAULT 0
date_paiement       date           -- renseigné quand payée
notes               text
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
```

#### Table `factures_lignes`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
facture_id      uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE
libelle         text NOT NULL
quantite        numeric(10,3) NOT NULL DEFAULT 1
unite           text NOT NULL DEFAULT 'u'
prix_unitaire   numeric(10,2) NOT NULL
taux_tva        numeric(4,2) NOT NULL DEFAULT 8.5
total_ht        numeric(10,2) NOT NULL
ordre           integer NOT NULL DEFAULT 0
```

### Numérotation auto
- Format devis : `DEV-YYYY-NNN` (ex : `DEV-2026-001`)
- Format facture : `FACT-YYYY-NNN`
- Auto-incrémentale par année, gérée côté API (SELECT MAX + parse)

### RLS
- Toutes les tables avec `auth.uid() IS NOT NULL` (single-user, cohérent avec le reste)

---

## Workflow Devis → Facture

```
DEVIS
  brouillon
    ↓ (bouton "Envoyer")
  envoyé  ──→ PDF généré + email Resend
    ↓
  accepté  ──→ bouton "Créer facture"
  refusé
  expiré   (auto : cron quotidien si date_validite < today et statut = envoyé)

FACTURE
  émise
    ↓ (bouton "Marquer payée" + saisie date)
  payée
  en_retard  (auto : cron quotidien si date_echeance < today et statut = émise)

RELANCES AUTO (extension cron existant)
  J+7  → email "relance douce" (Resend)
  J+30 → email "relance ferme" (Resend)
```

### Conversion devis accepté → facture(s)
1. Clic "Créer facture" sur un devis accepté
2. Modal : choix paiement unique ou acompte + solde
3. Si acompte + solde : saisie du pourcentage d'acompte (ex : 30%)
4. Création automatique :
   - Paiement unique → 1 facture type `facture` (100% du montant)
   - Acompte + solde → 2 factures : type `acompte` (X%) + type `solde` (100% - X%)
5. Les lignes sont copiées du devis vers la/les facture(s)

---

## APIs

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/prestations` | Liste catalogue (filtre actif) |
| POST | `/api/prestations` | Créer prestation |
| PUT | `/api/prestations/[id]` | Modifier prestation |
| DELETE | `/api/prestations/[id]` | Désactiver (actif = false) |
| GET | `/api/devis` | Liste devis (filtres : client_id, projet_id, statut) |
| POST | `/api/devis` | Créer devis + lignes |
| GET | `/api/devis/[id]` | Fiche devis + lignes |
| PUT | `/api/devis/[id]` | Modifier devis + lignes (brouillon seulement) |
| DELETE | `/api/devis/[id]` | Supprimer (brouillon seulement) |
| POST | `/api/devis/[id]/envoyer` | Générer PDF + envoyer email + statut → envoyé |
| POST | `/api/devis/[id]/statut` | Mettre à jour statut (accepté/refusé) |
| POST | `/api/devis/[id]/convertir` | Créer facture(s) depuis devis accepté |
| GET | `/api/factures` | Liste factures (filtres : client_id, projet_id, statut) |
| POST | `/api/factures` | Créer facture manuelle |
| GET | `/api/factures/[id]` | Fiche facture + lignes |
| PUT | `/api/factures/[id]` | Marquer payée (date_paiement) |
| POST | `/api/factures/[id]/envoyer` | Générer PDF + envoyer email |

---

## Génération PDF

Utilise `@react-pdf/renderer` déjà installé. Deux nouveaux templates :

### Template Devis (`DevisPdf`)
Plan 6 a créé un template statique `DevisPdf`. Plan 7 le remplace par une version dynamique alimentée par les données réelles de la table `devis` :
- En-tête ATEXIA (logo, adresse, SIRET)
- Destinataire (client + contact)
- Numéro devis, date émission, date validité
- Tableau des lignes : libellé / qté / unité / PU HT / TVA / Total HT
- Totaux : HT / TVA (8,5%) / TTC
- Mentions légales BTP (validité, conditions de paiement)

### Template Facture (`FacturePdf`)
- Même structure que devis
- Mention du type (FACTURE / FACTURE D'ACOMPTE / FACTURE DE SOLDE)
- Référence au devis d'origine si applicable
- Numéro facture, date émission, date d'échéance
- Coordonnées bancaires (RIB) — depuis `app_settings`
- Mention légale : "TVA 8,5% — DOM"

### Correction templates existants
- Mettre à jour `RapportPdf` et `DevisPdf` existants : remplacer TVA 20% → 8,5%

---

## Composants UI

| Composant | Description |
|---|---|
| `FinancesKpis` | 4 cartes KPI (CA devis, CA facturé, impayés, en retard) |
| `DevisCard` | Carte liste devis avec statut coloré + actions rapides |
| `FactureCard` | Carte liste factures avec statut + montant + échéance |
| `DevisForm` | Formulaire création/édition devis avec lignes dynamiques |
| `DevisLigneRow` | Ligne de devis avec recherche catalogue inline |
| `CatalogueForm` | Formulaire ajout/édition prestation dans Paramètres |
| `ConvertirModal` | Modal choix paiement unique / acompte + solde |
| `PdfDevisButton` | Bouton télécharger PDF devis |
| `PdfFactureButton` | Bouton télécharger PDF facture |
| `EnvoyerDevisButton` | Bouton envoyer devis par email |
| `MarquerPayeeButton` | Bouton marquer facture payée + saisie date |

---

## Relances automatiques

Extension du cron existant (`/api/cron/notifications`) :

```
Quotidien (même job que les tâches J-1/J0) :
1. Passer statut → en_retard : factures émises dont date_echeance < today
2. Passer statut → expiré : devis envoyés dont date_validite < today
3. Envoyer relance J+7 : factures en_retard depuis 7 jours (date_echeance = today - 7)
4. Envoyer relance J+30 : factures en_retard depuis 30 jours (date_echeance = today - 30)
```

Emails via Resend, template texte simple avec montant TTC, numéro facture, lien de contact.

---

## Paramètres entreprise (app_settings)

Nouvelles clés dans la table `app_settings` existante :
- `rib_iban` — IBAN pour les factures
- `rib_bic` — BIC
- `rib_banque` — Nom de la banque
- `devis_validite_jours` — Durée validité par défaut (défaut : 30)
- `facture_echeance_jours` — Délai paiement par défaut (défaut : 30)
- `facture_mentions` — Mentions légales personnalisées

---

## Tests attendus

~35 nouveaux tests (total app ≈ 135) :
- Schémas Zod devis, factures, prestations (8 tests)
- APIs devis CRUD + envoyer + convertir (10 tests)
- APIs factures CRUD + marquer payée (8 tests)
- APIs prestations CRUD (4 tests)
- Composants DevisForm, FactureCard, DevisCard (5 tests)
- Cron relances (3 tests)
- Templates PDF devis + facture (render sans crash) (2 tests)

---

## Contraintes techniques

- TypeScript strict — aucun `any`
- Zod sur tous les schemas et API routes
- Skeleton loaders sur toutes les listes
- Pagination sur les listes devis et factures
- RLS activé sur toutes les nouvelles tables
- Les devis/factures en statut final (accepté/refusé/expiré/payé) ne sont pas modifiables
- Suppression uniquement autorisée sur devis en statut `brouillon`
