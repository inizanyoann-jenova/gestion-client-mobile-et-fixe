type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  info: 'bg-sky-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  neutral: 'bg-slate-600 text-slate-200',
}

interface BadgeProps {
  label: string
  variant: BadgeVariant
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  )
}
