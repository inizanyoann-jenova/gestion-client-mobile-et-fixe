'use client'

import { useState } from 'react'

const ETAPES = [
  { num: 1, label: "Configurer les informations entreprise", detail: "Paramètres → onglet Paramètres → Informations entreprise" },
  { num: 2, label: "Installer l'app sur Android", detail: "Chrome → Menu ⋮ → Ajouter à l'écran d'accueil" },
  { num: 3, label: "Créer le premier client", detail: "Module Clients → bouton +" },
  { num: 4, label: "Créer un projet lié à ce client", detail: "Module Projets → bouton + (ou depuis la fiche client)" },
  { num: 5, label: "Créer une tâche avec rappel", detail: "Module Tâches → bouton +" },
  { num: 6, label: "Créer un premier devis", detail: "Module Finances → bouton + Devis" },
  { num: 7, label: "Activer les notifications push", detail: "Paramètres → section Notifications → Activer" },
]

interface Partie {
  label: string
  items: string[]
}

interface SectionGuide {
  id: string
  titre: string
  icone: string
  description: string
  parties: Partie[]
  astuce: string
}

const SECTIONS: SectionGuide[] = [
  {
    id: 'dashboard',
    titre: 'Dashboard',
    icone: '📊',
    description: "Vue d'ensemble de l'activité ATEXIA en temps réel.",
    parties: [
      {
        label: 'KPIs affichés',
        items: [
          "CA du mois en cours",
          "Nombre de devis en attente de réponse",
          "Tâches à faire aujourd'hui",
          "Chantiers actifs",
        ],
      },
      {
        label: 'Actions rapides',
        items: [
          "Bouton + → créer un client, un projet ou une tâche sans quitter le Dashboard",
          "Projets récents : accès direct à la fiche d'un chantier en un tap",
          "Tâches du jour : cocher directement depuis le Dashboard",
        ],
      },
    ],
    astuce: "Les données se rafraîchissent à chaque ouverture de l'onglet.",
  },
  {
    id: 'clients',
    titre: 'Clients & Contacts',
    icone: '🏢',
    description: "Gestion complète du portefeuille clients et de leurs contacts.",
    parties: [
      {
        label: 'Créer un client',
        items: [
          "Bouton + → remplir le nom, secteur d'activité, adresse, SIRET, notes",
          "Un client peut avoir plusieurs contacts (personnes physiques)",
          "Associer des projets, documents et échanges depuis la fiche",
        ],
      },
      {
        label: 'Fiche client',
        items: [
          "Résumé : KPIs financiers (CA total, devis en cours, factures impayées)",
          "Contacts : ajouter / modifier / supprimer des interlocuteurs",
          "Projets : liste des chantiers liés au client",
          "Échanges : historique chronologique des interactions",
          "Notes libres : mémos, préférences, contexte commercial",
        ],
      },
      {
        label: 'Actions mobiles Android',
        items: [
          "📞 Appui sur un numéro → composeur téléphonique direct",
          "✉️ Appui sur un email → application mail du téléphone",
          "📍 Appui sur l'adresse → Google Maps avec itinéraire",
        ],
      },
      {
        label: 'Archiver un client',
        items: [
          "Menu de la fiche → Archiver → le client disparaît des listes actives",
          "Les données sont conservées, accessible via le filtre « Archivés »",
          "L'archivage est réversible",
        ],
      },
    ],
    astuce: "Utilise les notes client pour mémoriser les préférences, décideurs et contexte de chaque compte.",
  },
  {
    id: 'projets',
    titre: 'Projets & Chantiers',
    icone: '🔧',
    description: "Suivi de l'avancement de chaque chantier avec statut et progression.",
    parties: [
      {
        label: 'Créer un projet',
        items: [
          "Depuis la liste : bouton + → nom, client, dates, montant estimé, statut initial",
          "Depuis la fiche client : onglet Projets → bouton + (client déjà lié)",
          "Statuts disponibles : En attente / En cours / Terminé / Suspendu",
        ],
      },
      {
        label: 'Suivi terrain',
        items: [
          "Progression manuelle de 0 à 100 %",
          "Notes de chantier : texte libre pour consigner les avancées",
          "Documents liés : rattacher plans, photos, bons de livraison",
          "Tâches liées : rappels spécifiques à ce chantier",
        ],
      },
      {
        label: 'Navigation et filtres',
        items: [
          "Filtre par statut en haut de liste",
          "Recherche par nom de chantier ou nom de client",
          "Tri par date de début ou montant",
        ],
      },
    ],
    astuce: "Crée le projet depuis la fiche client pour qu'il soit automatiquement lié sans ressaisir le client.",
  },
  {
    id: 'taches',
    titre: 'Tâches & Rappels',
    icone: '✅',
    description: "Système de rappels avec notifications automatiques email (J-1) et push (J0).",
    parties: [
      {
        label: 'Créer une tâche',
        items: [
          "Bouton + → titre, description, date d'échéance, priorité (Normal / Urgent)",
          "Optionnel : lier à un client et/ou un projet",
          "Les tâches du jour apparaissent en haut du Dashboard",
        ],
      },
      {
        label: 'Notifications automatiques',
        items: [
          "J-1 (veille) : email de rappel envoyé automatiquement à ton adresse",
          "J0 (jour J) : notification push le matin si les notifications sont activées",
          "Les tâches en retard sont mises en évidence en rouge",
          "Aucune configuration manuelle requise, tout est automatique",
        ],
      },
      {
        label: 'Gérer les tâches',
        items: [
          "Cocher la case → passe en statut « Terminé »",
          "Reporter : modifier la date d'échéance depuis la fiche tâche",
          "Filtrer par statut : Toutes / En cours / Terminées / En retard",
        ],
      },
    ],
    astuce: "Active les notifications push (Paramètres → Notifications) pour recevoir le rappel même quand l'app est fermée.",
  },
  {
    id: 'documents',
    titre: 'Documents',
    icone: '📂',
    description: "Coffre-fort numérique pour tous les fichiers liés à tes clients et chantiers.",
    parties: [
      {
        label: 'Uploader un fichier',
        items: [
          "Bouton + → choisir la source : Caméra / Galerie / Fichiers",
          "Formats supportés : PDF, images (JPG, PNG), Word, Excel",
          "Associer le fichier à un client et/ou un projet lors de l'upload",
          "Renommer le fichier pour le retrouver facilement",
        ],
      },
      {
        label: 'Générer un PDF',
        items: [
          "Section Générer → sélectionner un template",
          "Remplir les champs du formulaire",
          "Le PDF est généré et sauvegardé automatiquement dans les documents",
          "Téléchargeable et partageable directement depuis l'app",
        ],
      },
      {
        label: 'Organiser et retrouver',
        items: [
          "Filtrer par client, par projet ou par type de document",
          "Aperçu intégré pour les PDF et les images",
          "Télécharger ou partager via les apps du téléphone",
        ],
      },
    ],
    astuce: "Prends une photo des bons de livraison ou CCAP directement depuis l'app pour centraliser toute la paperasse chantier.",
  },
  {
    id: 'echanges',
    titre: 'Échanges',
    icone: '💬',
    description: "Journal chronologique de toute la communication avec tes clients.",
    parties: [
      {
        label: 'Logger un échange',
        items: [
          "Bouton + → choisir le type : Appel / Email / Visite / Réunion",
          "Sélectionner le client concerné",
          "Résumé court + notes détaillées",
          "Date et heure enregistrées automatiquement (modifiables)",
        ],
      },
      {
        label: "Consulter l'historique",
        items: [
          "Filtrer par type d'échange (Appel, Email, Visite…)",
          "Filtrer par client ou par période",
          "Les échanges sont aussi visibles depuis la fiche client",
        ],
      },
    ],
    astuce: "Note l'échange juste après un appel, même en 2 lignes — c'est suffisant pour retrouver le contexte des semaines plus tard.",
  },
  {
    id: 'finances',
    titre: 'Finances',
    icone: '💰',
    description: "Devis et facturation avec workflow complet, TVA DOM 8,5 % et relances automatiques.",
    parties: [
      {
        label: 'Créer un devis',
        items: [
          "Bouton + Devis → choisir le client",
          "Ajouter des lignes depuis le Catalogue de prestations ou en saisie libre",
          "TVA calculée automatiquement à 8,5 % (taux DOM Réunion)",
          "Numérotation automatique : DEV-2026-0001",
          "Générer le PDF avant d'envoyer",
        ],
      },
      {
        label: 'Envoyer et faire signer',
        items: [
          "Bouton « Envoyer » → le client reçoit un email avec un lien sécurisé",
          "Portail client : le client consulte le devis en ligne et signe électroniquement",
          "Tu es notifié dès que le devis est signé",
          "Le devis signé est archivé avec la date et la preuve de signature",
        ],
      },
      {
        label: 'Convertir en facture',
        items: [
          "Bouton « Convertir en facture » → facture créée en un tap",
          "Numérotation automatique : FAC-2026-0001",
          "Envoyer la facture par email au client",
          "Bouton « Marquer payée » → date de paiement enregistrée",
        ],
      },
      {
        label: 'Relances automatiques',
        items: [
          "Facture impayée → email de relance automatique à J+7",
          "Toujours impayée → deuxième relance à J+30",
          "Les relances sont envoyées sans action de ta part",
          "Statut de chaque facture visible dans la liste (En attente / Envoyée / Payée / En retard)",
        ],
      },
    ],
    astuce: "Remplis le Catalogue de prestations (Paramètres → Catalogue) pour pré-remplir les lignes à chaque nouveau devis.",
  },
  {
    id: 'notifications',
    titre: 'Notifications Push',
    icone: '🔔',
    description: "Alertes en temps réel sur ton téléphone, même quand l'app est fermée.",
    parties: [
      {
        label: 'Activer les notifications',
        items: [
          "Aller dans Paramètres → section Notifications",
          "Appuyer sur « Activer les notifications push »",
          "Accepter la demande d'autorisation affichée par Chrome",
          "Un indicateur vert confirme que les notifications sont actives",
        ],
      },
      {
        label: 'Ce qui déclenche une notification',
        items: [
          "Tâche arrivant à échéance le jour même (envoyée le matin)",
          "Tâche en retard non complétée",
          "Devis signé par le client via le portail",
        ],
      },
      {
        label: 'Comportement sur Android',
        items: [
          "Les notifications apparaissent dans le volet de notifications Android",
          "Appui sur la notification → ouvre directement l'app sur la bonne page",
          "Fonctionne en arrière-plan si l'app est installée en PWA",
        ],
      },
    ],
    astuce: "Pour que les notifications push fonctionnent en arrière-plan, installe d'abord l'app en PWA (voir section Installation Android).",
  },
  {
    id: 'pwa',
    titre: 'Installation Android (PWA)',
    icone: '📱',
    description: "Installe ATEXIA CRM comme une vraie app Android, sans passer par le Play Store.",
    parties: [
      {
        label: 'Comment installer',
        items: [
          "1. Ouvrir l'app dans Chrome (pas Firefox, pas Samsung Internet)",
          "2. Appuyer sur les 3 points ⋮ en haut à droite",
          "3. Sélectionner « Ajouter à l'écran d'accueil »",
          "4. Confirmer → l'icône ATEXIA CRM apparaît sur l'écran d'accueil",
        ],
      },
      {
        label: 'Avantages',
        items: [
          "Lancement en plein écran sans la barre d'adresse Chrome",
          "Notifications push en arrière-plan",
          "Accès rapide depuis l'écran d'accueil comme une vraie app",
          "Mises à jour automatiques sans rien faire",
          "Fonctionne aussi sur PC (Chrome) pour une utilisation bureau",
        ],
      },
    ],
    astuce: "Après l'installation, active les notifications push (Paramètres → Notifications) pour ne rater aucun rappel.",
  },
]

export function GuideUtilisateur() {
  const [ouvert, setOuvert] = useState<string | null>(null)

  const toggle = (id: string) => {
    setOuvert(ouvert === id ? null : id)
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Démarrage rapide
        </h2>
        <div className="space-y-3">
          {ETAPES.map((etape) => (
            <div key={etape.num} className="bg-slate-800 rounded-xl p-4 flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                {etape.num}
              </span>
              <div>
                <p className="text-white text-sm font-medium">{etape.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{etape.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Référence des modules
        </h2>
        <div className="space-y-2">
          {SECTIONS.map((section) => {
            const estOuvert = ouvert === section.id
            return (
              <div key={section.id} className="bg-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                  aria-expanded={estOuvert}
                >
                  <span className="text-lg flex-shrink-0">{section.icone}</span>
                  <span className="flex-1 text-white text-sm font-semibold">{section.titre}</span>
                  <span className="text-slate-400 text-xs select-none" aria-hidden="true">
                    {estOuvert ? '▼' : '▶'}
                  </span>
                </button>

                <div className={estOuvert ? 'block' : 'hidden'}>
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-4">
                    <p className="text-slate-300 text-xs">{section.description}</p>

                    {section.parties.map((partie) => (
                      <div key={partie.label}>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                          {partie.label}
                        </p>
                        <ul className="space-y-1.5">
                          {partie.items.map((item, i) => (
                            <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                              <span className="text-sky-500 flex-shrink-0 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    <p className="text-sky-400 text-xs pt-1">
                      <span className="font-semibold">Astuce : </span>
                      {section.astuce}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
