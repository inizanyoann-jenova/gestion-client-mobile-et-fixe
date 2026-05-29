import { render, screen } from '@testing-library/react'
import { ParametresTabs } from '../parametres-tabs'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('ParametresTabs', () => {
  it('affiche les deux onglets', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
    expect(screen.getByText('Guide')).toBeInTheDocument()
  })

  it('lien Paramètres pointe vers /parametres', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Paramètres').closest('a')).toHaveAttribute('href', '/parametres')
  })

  it('lien Guide pointe vers /parametres?tab=guide', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Guide').closest('a')).toHaveAttribute('href', '/parametres?tab=guide')
  })

  it('onglet actif a la classe bg-blue-600 quand activeTab=parametres', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Paramètres').closest('a')).toHaveClass('bg-blue-600')
  })

  it('onglet actif a la classe bg-blue-600 quand activeTab=guide', () => {
    render(<ParametresTabs activeTab="guide" />)
    expect(screen.getByText('Guide').closest('a')).toHaveClass('bg-blue-600')
  })

  it('onglet inactif a la classe bg-slate-800', () => {
    render(<ParametresTabs activeTab="parametres" />)
    expect(screen.getByText('Guide').closest('a')).toHaveClass('bg-slate-800')
  })
})
