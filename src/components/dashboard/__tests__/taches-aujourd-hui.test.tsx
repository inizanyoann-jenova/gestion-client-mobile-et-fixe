import { render, screen } from '@testing-library/react'
import { TachesAujourdhui } from '../taches-aujourd-hui'
import type { TacheLite } from '@/lib/validations/dashboard'

const tache: TacheLite = {
  id: '00000000-0000-0000-0000-000000000001',
  titre: 'Vérifier tableau électrique',
  priorite: 'haute',
  date_echeance: '2026-05-29T08:00:00.000Z',
  client: { id: 'c1', nom: 'Carrefour Grand Nord' },
  projet: null,
}

describe('TachesAujourdhui', () => {
  it('affiche le message vide quand aucune tâche', () => {
    render(<TachesAujourdhui taches={[]} />)
    expect(screen.getByText(/aucune tâche/i)).toBeInTheDocument()
  })

  it('affiche le titre de la tâche', () => {
    render(<TachesAujourdhui taches={[tache]} />)
    expect(screen.getByText('Vérifier tableau électrique')).toBeInTheDocument()
  })

  it('affiche le nom du client', () => {
    render(<TachesAujourdhui taches={[tache]} />)
    expect(screen.getByText('Carrefour Grand Nord')).toBeInTheDocument()
  })

  it('affiche plusieurs tâches', () => {
    const t2 = { ...tache, id: '00000000-0000-0000-0000-000000000002', titre: 'Réunion chantier' }
    render(<TachesAujourdhui taches={[tache, t2]} />)
    expect(screen.getByText('Vérifier tableau électrique')).toBeInTheDocument()
    expect(screen.getByText('Réunion chantier')).toBeInTheDocument()
  })
})
