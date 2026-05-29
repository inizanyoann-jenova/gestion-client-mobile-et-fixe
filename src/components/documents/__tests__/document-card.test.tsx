import { render, screen } from '@testing-library/react'
import { DocumentCard } from '../document-card'
import type { Document } from '@/lib/supabase/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

global.fetch = jest.fn()

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
})

afterEach(() => {
  jest.clearAllMocks()
})

const mockDoc: Document & {
  client: { id: string; nom: string } | null
  projet: { id: string; titre: string } | null
} = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  nom: 'Devis Carrefour.pdf',
  type: 'devis',
  description: null,
  storage_path: 'standalone/123-devis.pdf',
  taille_octets: 204800,
  genere_par_app: false,
  client_id: null,
  projet_id: null,
  created_at: '2026-05-29T10:00:00.000Z',
  client: null,
  projet: null,
}

describe('DocumentCard', () => {
  it('affiche le nom du document', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByText('Devis Carrefour.pdf')).toBeInTheDocument()
  })

  it('affiche la taille formatée', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByText(/200 Ko/)).toBeInTheDocument()
  })

  it('affiche l\'icône du type devis', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByText('📄')).toBeInTheDocument()
  })

  it('affiche le bouton télécharger si storage_path présent', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByRole('button', { name: /télécharger/i })).toBeInTheDocument()
  })

  it('affiche le bouton supprimer', () => {
    render(<DocumentCard document={mockDoc} />)
    expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument()
  })
})
