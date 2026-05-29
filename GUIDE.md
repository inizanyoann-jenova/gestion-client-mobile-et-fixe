# ATEXIA CRM — Guide de configuration et d'utilisation

## Ce que fait l'application

CRM sur mesure pour **ATEXIA** (entreprise BTP à La Réunion). Accessible depuis un téléphone Android ou un ordinateur, sans installation d'app store.

### Modules disponibles

| Module | Ce qu'il fait |
|---|---|
| **Tableau de bord** | KPIs financiers, tâches du jour, projets récents |
| **Clients** | Fiche client complète, contacts, historique des échanges |
| **Projets** | Suivi des chantiers, progression, documents associés |
| **Tâches** | Rappels avec notifications email et push (J-1 et J0) |
| **Documents** | Upload de fichiers + génération PDF (rapports, devis) |
| **Échanges** | Journal des appels, emails et visites par client |
| **Paramètres** | Configuration de l'application |

---

## Accès à l'application

**URL de production :** `https://gestion-client-mobile-et-fixe-inizanyoann-jenovas-projects.vercel.app`

---

## Étape 1 — Créer le compte utilisateur (à faire une seule fois)

L'application utilise **Supabase Auth** pour la connexion. Le compte doit être créé manuellement.

1. Aller sur : `https://supabase.com/dashboard/project/ecsvgwgbyftaitimdtdk/auth/users`
2. Cliquer sur **"Add user" → "Create new user"**
3. Remplir :
   - **Email :** `inizan.yoann@gmail.com`
   - **Password :** choisir un mot de passe solide
   - **Auto Confirm User :** cocher cette case
4. Cliquer sur **"Create user"**

Ensuite retourner sur l'app et se connecter avec ces identifiants.

---

## Étape 2 — Variables d'environnement sur Vercel

Ces variables sont déjà configurées sur Vercel pour la production. Ce tableau sert de référence si tu dois reconfigurer.

| Variable | Description | Où la trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Dashboard Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé privée Supabase (ne jamais partager) | Dashboard Supabase → Settings → API |
| `RESEND_API_KEY` | Clé API pour l'envoi d'emails | resend.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | URL de l'app en production | L'URL Vercel |
| `NOTIF_EMAIL` | Email qui reçoit les notifications | `inizan.yoann@gmail.com` |
| `CRON_SECRET` | Secret pour sécuriser le cron job | Générer aléatoirement |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique pour les notifications push | Généré une fois (voir ci-dessous) |
| `VAPID_PRIVATE_KEY` | Clé privée pour les notifications push | Généré une fois (voir ci-dessous) |
| `VAPID_EMAIL` | Email associé aux notifications push | `notifications@atexia.re` |

---

## Étape 3 — Installer l'app sur Android (PWA)

L'application fonctionne comme une vraie app mobile sans passer par le Play Store.

1. Ouvrir Chrome sur ton téléphone Android
2. Aller sur l'URL de production
3. Se connecter
4. Chrome affiche une bannière **"Ajouter à l'écran d'accueil"** — appuyer dessus
5. L'app apparaît sur l'écran d'accueil comme une application native

Si la bannière ne s'affiche pas : menu Chrome (3 points) → **"Ajouter à l'écran d'accueil"**

---

## Étape 4 — Activer les notifications push

1. Se connecter à l'application
2. Aller dans **Paramètres**
3. Section **Notifications** → activer les notifications push
4. Accepter la demande de permission du navigateur

Les rappels de tâches sont envoyés :
- La **veille** à 6h00 heure de La Réunion (3h UTC)
- Le **jour même** à 6h00 heure de La Réunion

---

## Infrastructure (coût : 0 €)

| Service | Usage | Limites gratuites |
|---|---|---|
| **Vercel** | Hébergement | Illimité pour 1 utilisateur |
| **Supabase** | Base de données + Auth + Stockage | 500 Mo DB, 1 Go stockage |
| **Resend** | Emails de notifications | 3 000 emails/mois |
| **Web Push** | Notifications push | Natif navigateur, gratuit |

---

## Projet Supabase

- **Nom :** suivi client mobile et fixe
- **ID :** `ecsvgwgbyftaitimdtdk`
- **Région :** eu-west-1 (Europe)
- **Dashboard :** `https://supabase.com/dashboard/project/ecsvgwgbyftaitimdtdk`

---

## Cron job (rappels automatiques)

Un job s'exécute chaque jour à 3h UTC (6h heure de La Réunion) pour envoyer les notifications de rappel.

Configuré dans [vercel.json](vercel.json) :
```json
{
  "crons": [{ "path": "/api/cron/rappels", "schedule": "0 3 * * *" }]
}
```

Pour vérifier que le cron tourne : Vercel Dashboard → ton projet → **Cron Jobs**.
