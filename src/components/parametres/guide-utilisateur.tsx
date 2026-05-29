const ETAPES = [
  { num: 1, label: 'Configurer les informations entreprise', detail: 'Onglet Paramètres → Informations entreprise' },
  { num: 2, label: 'Créer le premier client', detail: 'Module Clients → bouton +' },
  { num: 3, label: 'Créer un projet lié à ce client', detail: 'Module Projets → bouton +' },
  { num: 4, label: 'Créer une tâche avec rappel', detail: 'Module Tâches → bouton +' },
  { num: 5, label: 'Activer les notifications push', detail: 'Module Plus → Paramètres → Notifications' },
]

const MODULES = [
  {
    titre: 'Dashboard',
    icone: '📊',
    description: 'KPIs du jour, tâches en retard, projets récents.',
    actions: 'Bouton + pour création rapide (client / projet / tâche).',
    astuce: 'Les KPIs se rafraîchissent à chaque ouverture.',
  },
  {
    titre: 'Clients & Contacts',
    icone: '🏢',
    description: 'Liste des entreprises clientes, fiches avec contacts, KPIs financiers, notes.',
    actions: 'Créer / modifier / archiver un client ; ajouter des contacts.',
    astuce: 'Appui long sur un numéro → composeur direct sur Android.',
  },
  {
    titre: 'Projets & Chantiers',
    icone: '🔧',
    description: 'Suivi des chantiers avec progression et statut.',
    actions: 'Créer un projet depuis la liste ou depuis la fiche client.',
    astuce: 'Filtre par statut (En cours / Terminé / En attente) en haut de liste.',
  },
  {
    titre: 'Tâches & Rappels',
    icone: '✅',
    description: "Actions à faire avec date d'échéance, notifications email J-1 et push J0.",
    actions: 'Créer / compléter / reporter ; activer les notifications push.',
    astuce: 'Les tâches du jour apparaissent aussi sur le Dashboard.',
  },
  {
    titre: 'Documents',
    icone: '📂',
    description: 'Upload de fichiers et génération de PDF depuis templates.',
    actions: 'Uploader (caméra / galerie / fichiers) ; générer un PDF.',
    astuce: 'Les PDF générés sont téléchargeables et partageables directement.',
  },
  {
    titre: 'Échanges',
    icone: '💬',
    description: 'Journal chronologique des interactions (appels, emails, visites).',
    actions: 'Logger un échange ; filtrer par type.',
    astuce: "Noter un échange juste après l'appel pour ne rien oublier.",
  },
]

export function GuideUtilisateur() {
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
        <div className="space-y-3">
          {MODULES.map((mod) => (
            <div key={mod.titre} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{mod.icone}</span>
                <h3 className="text-white text-sm font-semibold">{mod.titre}</h3>
              </div>
              <p className="text-slate-300 text-xs mb-1">{mod.description}</p>
              <p className="text-slate-300 text-xs mb-2">
                <span className="text-slate-400">Actions : </span>
                {mod.actions}
              </p>
              <p className="text-sky-400 text-xs">
                <span className="font-medium">Astuce : </span>
                {mod.astuce}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
