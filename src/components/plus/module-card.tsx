import Link from 'next/link'

interface ModuleCardProps {
  href: string
  icon: string
  label: string
  description: string
}

export function ModuleCard({ href, icon, label, description }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 bg-slate-800 rounded-2xl p-5 active:bg-slate-700 transition-colors text-center"
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-white text-sm font-semibold">{label}</span>
      <span className="text-slate-400 text-xs">{description}</span>
    </Link>
  )
}
