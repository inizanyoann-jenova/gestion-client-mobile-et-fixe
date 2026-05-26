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
- [ ] Plan 1 à implémenter (Next.js + Supabase + Auth + PWA + Navigation)
- [ ] Plans 2-6 à rédiger et implémenter

## Prochaine action

Implémenter le **Plan 1** en utilisant le skill `superpowers:subagent-driven-development` ou `superpowers:executing-plans`.

Commande : *"Implémente le Plan 1 en suivant `docs/superpowers/plans/2026-05-26-plan-1-foundation.md`"*

## Plans prévus

| # | Contenu | Statut |
|---|---|---|
| 1 | Foundation (scaffold, auth, DB, PWA, navigation) | Rédigé ✅ |
| 2 | Module Clients & Contacts | À rédiger |
| 3 | Module Projets & Chantiers | À rédiger |
| 4 | Tâches & Notifications (email + push) | À rédiger |
| 5 | Documents (upload + génération PDF) | À rédiger |
| 6 | Interactions & Tableau de bord complet | À rédiger |
