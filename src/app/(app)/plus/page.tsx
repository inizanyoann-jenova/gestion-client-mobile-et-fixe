import { ModuleCard } from '@/components/plus/module-card'

const MODULES = [
  { href: '/finances', icon: '💶', label: 'Finances', description: 'Devis et factures' },
  { href: '/echanges', icon: '💬', label: 'Échanges', description: 'Appels, emails, visites' },
  { href: '/documents', icon: '📂', label: 'Documents', description: 'Fichiers et PDF' },
  { href: '/parametres', icon: '⚙️', label: 'Paramètres', description: 'Entreprise et compte' },
]

export default function PlusPage() {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Plus</h1>
      <div className="grid grid-cols-2 gap-4">
        {MODULES.map((mod) => (
          <ModuleCard key={mod.href} {...mod} />
        ))}
      </div>
    </div>
  )
}
