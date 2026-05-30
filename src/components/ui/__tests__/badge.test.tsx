import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  it('affiche le label', () => {
    render(<Badge label="En cours" variant="info" />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('applique la classe success', () => {
    render(<Badge label="Terminé" variant="success" />)
    expect(screen.getByText('Terminé')).toHaveClass('text-emerald-300')
  })

  it('applique la classe danger', () => {
    render(<Badge label="SAV" variant="danger" />)
    expect(screen.getByText('SAV')).toHaveClass('text-red-300')
  })

  it('applique la classe warning', () => {
    render(<Badge label="En étude" variant="warning" />)
    expect(screen.getByText('En étude')).toHaveClass('text-amber-300')
  })

  it('a la forme pill (rounded-full)', () => {
    render(<Badge label="Test" variant="info" />)
    expect(screen.getByText('Test')).toHaveClass('rounded-full')
  })
})
