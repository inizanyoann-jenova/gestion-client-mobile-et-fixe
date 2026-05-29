import Link from 'next/link'

const MODULES = [
  { href: '/echanges', icon: '💬', label: 'Échanges', description: 'Journal des appels, emails et visites' },
  { href: '/documents', icon: '📁', label: 'Documents', description: 'Fichiers, PDF, photos' },
  { href: '/parametres', icon: '⚙️', label: 'Paramètres', description: 'Compte et préférences', disabled: true },
]

export default function PlusPage() {
  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="text-xl font-bold text-white">Plus</h1>

      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod) => {
          const content = (
            <div className={`bg-slate-800 rounded-2xl p-4 space-y-2 active:bg-slate-700 transition-colors${mod.disabled ? ' opacity-50' : ''}`}>
              <span className="text-3xl">{mod.icon}</span>
              <p className="text-white text-sm font-semibold">{mod.label}</p>
              <p className="text-slate-400 text-xs leading-snug">{mod.description}</p>
              {mod.disabled && (
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">Bientôt</span>
              )}
            </div>
          )
          return mod.disabled ? (
            <div key={mod.href}>{content}</div>
          ) : (
            <Link key={mod.href} href={mod.href}>{content}</Link>
          )
        })}
      </div>
    </div>
  )
}
