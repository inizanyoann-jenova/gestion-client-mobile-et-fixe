import { render, screen, fireEvent } from '@testing-library/react'
import { PlanningCalendar } from '../planning-calendar'
import type { CalendarEvent } from '@/lib/planning/types'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => mockPush.mockReset())

const EVENTS: CalendarEvent[] = [
  { id: '1', type: 'tache', label: 'Appeler Carrefour', date: '2026-06-15', href: '/taches', color: 'sky' },
  { id: '2', type: 'facture', label: 'FAC-001', date: '2026-06-20', href: '/finances/factures/2', color: 'red' },
]

describe('PlanningCalendar', () => {
  it('affiche le mois et l\'année courants', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    expect(screen.getByText(/juin 2026/i)).toBeInTheDocument()
  })

  it('affiche les 7 en-têtes de jours', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    expect(screen.getByText('Lu')).toBeInTheDocument()
    expect(screen.getByText('Ma')).toBeInTheDocument()
    expect(screen.getByText('Di')).toBeInTheDocument()
  })

  it('navigue vers le mois suivant', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByLabelText('Mois suivant'))
    expect(screen.getByText(/juillet 2026/i)).toBeInTheDocument()
  })

  it('navigue vers le mois précédent', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByLabelText('Mois précédent'))
    expect(screen.getByText(/mai 2026/i)).toBeInTheDocument()
  })

  it('navigue de décembre à janvier', () => {
    render(<PlanningCalendar initialMonth="2026-12-01" events={[]} />)
    fireEvent.click(screen.getByLabelText('Mois suivant'))
    expect(screen.getByText(/janvier 2027/i)).toBeInTheDocument()
  })

  it('navigue de janvier à décembre', () => {
    render(<PlanningCalendar initialMonth="2026-01-01" events={[]} />)
    fireEvent.click(screen.getByLabelText('Mois précédent'))
    expect(screen.getByText(/décembre 2025/i)).toBeInTheDocument()
  })

  it("bouton Aujourd'hui ramène au mois initial", () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByLabelText('Mois suivant'))
    expect(screen.getByText(/juillet 2026/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText("Aujourd'hui"))
    expect(screen.getByText(/juin 2026/i)).toBeInTheDocument()
  })

  it('affiche un event sur le bon jour', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    expect(screen.getByText('Appeler Carrefour')).toBeInTheDocument()
  })

  it('navigue vers la fiche au clic sur un event', () => {
    render(<PlanningCalendar initialMonth="2026-06-01" events={EVENTS} />)
    fireEvent.click(screen.getByText('Appeler Carrefour'))
    expect(mockPush).toHaveBeenCalledWith('/taches')
  })
})
