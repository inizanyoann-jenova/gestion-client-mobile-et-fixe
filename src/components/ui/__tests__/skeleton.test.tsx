import { render } from '@testing-library/react'
import { Skeleton } from '../skeleton'

describe('Skeleton', () => {
  it('affiche avec les classes par défaut', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse', 'bg-slate-700', 'rounded')
  })

  it('accepte des classes personnalisées', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-32')
  })
})
