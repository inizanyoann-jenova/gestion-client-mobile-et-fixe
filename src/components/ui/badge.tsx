type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  info: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
  success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
  danger: 'bg-red-500/10 text-red-300 border border-red-500/30',
  neutral: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
}

interface BadgeProps {
  label: string
  variant: BadgeVariant
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  )
}
