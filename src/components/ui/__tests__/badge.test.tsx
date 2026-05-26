import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  it('affiche le label', () => {
    render(<Badge label="En cours" variant="info" />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('applique la classe success', () => {
    render(<Badge label="Terminé" variant="success" />)
    expect(screen.getByText('Terminé')).toHaveClass('bg-emerald-500')
  })

  it('applique la classe danger', () => {
    render(<Badge label="SAV" variant="danger" />)
    expect(screen.getByText('SAV')).toHaveClass('bg-red-500')
  })

  it('applique la classe warning', () => {
    render(<Badge label="En étude" variant="warning" />)
    expect(screen.getByText('En étude')).toHaveClass('bg-amber-500')
  })
})
