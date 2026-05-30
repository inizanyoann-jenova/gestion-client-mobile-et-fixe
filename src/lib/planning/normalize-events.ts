import type { CalendarEvent, PlanningData } from './types'

export function normalizeEvents(data: PlanningData): CalendarEvent[] {
  const events: CalendarEvent[] = []

  for (const t of data.taches) {
    if (!t.date_echeance) continue
    events.push({ id: t.id, type: 'tache', label: t.titre, date: t.date_echeance, href: '/taches', color: 'sky' })
  }

  for (const i of data.interactions) {
    if (i.type !== 'visite') continue
    events.push({ id: i.id, type: 'visite', label: 'Visite', date: i.date, href: '/echanges', color: 'emerald' })
  }

  for (const d of data.devis) {
    events.push({ id: d.id, type: 'devis', label: d.numero, date: d.date_validite, href: `/finances/devis/${d.id}`, color: 'amber' })
  }

  for (const f of data.factures) {
    events.push({ id: f.id, type: 'facture', label: f.numero, date: f.date_echeance, href: `/finances/factures/${f.id}`, color: 'red' })
  }

  return events
}
