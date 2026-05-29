import { render, screen } from '@testing-library/react'
import { ModuleCard } from '../module-card'

describe('ModuleCard', () => {
  it('affiche le label et l\'icône', () => {
    render(<ModuleCard href="/documents" icon="📂" label="Documents" description="Fichiers et PDF" />)
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Fichiers et PDF')).toBeInTheDocument()
    expect(screen.getByText('📂')).toBeInTheDocument()
  })

  it('génère un lien vers le href', () => {
    render(<ModuleCard href="/echanges" icon="💬" label="Échanges" description="Journal des contacts" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/echanges')
  })
})
