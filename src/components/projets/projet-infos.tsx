import { formatCurrency } from '@/lib/utils/currency'
import type { Projet, TypeProjet, SecteurProjet } from '@/lib/supabase/types'

const TYPE_LABEL: Record<TypeProjet, string> = {
  installation: 'Installation',
  etude: 'Étude',
  maintenance: 'Maintenance',
  sav: 'SAV',
}

const SECTEUR_LABEL: Record<SecteurProjet, string> = {
  courants_forts: 'Courants forts',
  courants_faibles: 'Courants faibles',
  photovoltaique: 'Photovoltaïque',
}

interface ProjetInfosProps {
  projet: Projet
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

export function ProjetInfos({ projet }: ProjetInfosProps) {
  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—'

  return (
    <div className="bg-slate-800 rounded-xl px-4 py-3 divide-y divide-slate-700">
      <InfoRow label="Type" value={TYPE_LABEL[projet.type]} />
      <InfoRow label="Secteur" value={SECTEUR_LABEL[projet.secteur]} />
      {projet.date_debut_estimee && (
        <InfoRow label="Début estimé" value={formatDate(projet.date_debut_estimee)} />
      )}
      {projet.date_fin_estimee && (
        <InfoRow label="Fin estimée" value={formatDate(projet.date_fin_estimee)} />
      )}
      {projet.statut === 'termine' && projet.date_fin_reelle && (
        <InfoRow label="Fin réelle" value={formatDate(projet.date_fin_reelle)} />
      )}
      {projet.montant_devis !== null && projet.montant_devis !== undefined && (
        <InfoRow label="Devis" value={formatCurrency(projet.montant_devis)} />
      )}
      {projet.montant_facture !== null && projet.montant_facture !== undefined && (
        <InfoRow label="Facturé" value={formatCurrency(projet.montant_facture)} />
      )}
    </div>
  )
}
