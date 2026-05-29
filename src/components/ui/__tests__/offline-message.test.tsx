import { render, screen, act } from '@testing-library/react'
import { OfflineMessage } from '../offline-message'

describe('OfflineMessage', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('n\'affiche rien quand en ligne', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    render(<OfflineMessage />)
    expect(screen.queryByText(/hors ligne/i)).not.toBeInTheDocument()
  })

  it('affiche le bandeau quand hors ligne', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    render(<OfflineMessage />)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(/hors ligne/i)).toBeInTheDocument()
  })
})
