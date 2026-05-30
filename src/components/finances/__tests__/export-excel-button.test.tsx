import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportExcelButton } from '../export-excel-button'

describe('ExportExcelButton', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    global.URL.createObjectURL = jest.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => jest.restoreAllMocks())

  it('affiche le bouton ↓ Excel', () => {
    render(<ExportExcelButton />)
    expect(screen.getByText('↓ Excel')).toBeInTheDocument()
  })

  it('affiche ... pendant le chargement', async () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<ExportExcelButton />)
    fireEvent.click(screen.getByText('↓ Excel'))
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it("appelle /api/finances/export avec l année courante", async () => {
    const annee = new Date().getFullYear()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(),
    })
    render(<ExportExcelButton />)
    fireEvent.click(screen.getByText('↓ Excel'))
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(`/api/finances/export?annee=${annee}`)
    )
  })
})
