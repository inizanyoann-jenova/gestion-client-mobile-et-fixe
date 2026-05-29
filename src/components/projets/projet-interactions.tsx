import { EchangeForm } from '@/components/echanges/echange-form'
import type { Interaction, TypeInteraction } from '@/lib/supabase/types'

interface ProjetInteractionsProps {
  interactions: Interaction[]
  projetId: string
}

const TYPE_LABEL: Record<TypeInteraction, string> = {
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  reunion: 'Réunion',
  autre: 'Autre',
}

const TYPE_COLOR: Record<TypeInteraction, string> = {
  appel: 'bg-sky-500/20 text-sky-400',
  email: 'bg-violet-500/20 text-violet-400',
  visite: 'bg-emerald-500/20 text-emerald-400',
  reunion: 'bg-amber-500/20 text-amber-400',
  autre: 'bg-slate-500/20 text-slate-400',
}

export function ProjetInteractions({ interactions, projetId }: ProjetInteractionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">{interactions.length} échange{interactions.length !== 1 ? 's' : ''}</span>
        <EchangeForm projetId={projetId} />
      </div>

      {interactions.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aucun échange enregistré</p>
      )}

      {interactions.map((interaction) => (
        <div key={interaction.id} className="bg-slate-900 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[interaction.type]}`}>
              {TYPE_LABEL[interaction.type]}
            </span>
            <span className="text-slate-500 text-xs ml-auto">
              {new Date(interaction.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-white text-sm line-clamp-2">{interaction.resume}</p>
          {interaction.suite_a_donner && (
            <p className="text-amber-400 text-xs mt-2">→ {interaction.suite_a_donner}</p>
          )}
        </div>
      ))}
    </div>
  )
}
