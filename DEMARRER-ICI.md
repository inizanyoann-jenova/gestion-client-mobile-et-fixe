# Fichier de lancement — ATEXIA CRM

Colle ce fichier au début de chaque nouvelle discussion Claude pour reprendre sans recontextualiser.

---

## Contexte du projet

Je développe une application CRM pour l'entreprise **ATEXIA** (La Réunion), spécialisée en électricité BTP (courants forts, courants faibles, photovoltaïque).

**Stack validée :** Next.js 14 + TypeScript strict + Tailwind CSS + Supabase + PWA Android + Vercel (gratuit)  
**Utilisateur :** 1 seul (le gérant)  
**Priorité absolue :** zéro bug — qualité avant vitesse  
**Mobile :** PWA sur Android (stable, gratuit, sans app store)

## Documents de référence

- Spec complète : `docs/superpowers/specs/2026-05-26-atexia-crm-design.md`
- Plan 1 (Foundation) : `docs/superpowers/plans/2026-05-26-plan-1-foundation.md`
- Contexte complet : `CLAUDE.md`

## État actuel

- [x] Design et spec validés
- [x] Plan 1 (Foundation) rédigé
- [x] Task 1 — Next.js 16.2.6 initialisé (TypeScript strict, Tailwind, git)
- [x] Task 2 — Dépendances installées (@supabase/ssr, zod, next-pwa, jest)
- [x] Task 3 — Schéma SQL créé + Supabase configuré manuellement
- [ ] Task 4 à 10 — restent à implémenter
- [ ] Plans 2-6 à rédiger et implémenter

## Prochaine action

Continuer le **Plan 1** à partir de la **Task 4** en utilisant `superpowers:subagent-driven-development`.

Commande : *"Continue le Plan 1 à partir de la Task 4 — `docs/superpowers/plans/2026-05-26-plan-1-foundation.md`"*

## Notes importantes

- Next.js **16.2.6** installé (pas 14) — plan compatible car utilise `await cookies()` (pattern 15+)
- Supabase projet : **"suivi client mobile et fixe"** (pas "atexia-crm")
- RLS activé automatiquement via event trigger sur ce projet Supabase
- Commits : `e69f0d4` → `0e0948c` → `1f13043` → `2f26fb3`

## Plans prévus

| # | Contenu | Statut |
|---|---|---|
| 1 | Foundation (scaffold, auth, DB, PWA, navigation) | Rédigé ✅ |
| 2 | Module Clients & Contacts | À rédiger |
| 3 | Module Projets & Chantiers | À rédiger |
| 4 | Tâches & Notifications (email + push) | À rédiger |
| 5 | Documents (upload + génération PDF) | À rédiger |
| 6 | Interactions & Tableau de bord complet | À rédiger |
