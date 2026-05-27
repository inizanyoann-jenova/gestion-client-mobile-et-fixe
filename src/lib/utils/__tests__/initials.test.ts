import { getInitials, getAvatarColor } from '../initials'

describe('getInitials', () => {
  it('retourne les initiales en majuscules', () => {
    expect(getInitials('Jean', 'Dupont')).toBe('JD')
  })

  it('fonctionne avec des minuscules', () => {
    expect(getInitials('alice', 'martin')).toBe('AM')
  })
})

describe('getAvatarColor', () => {
  it('retourne une classe bg-', () => {
    expect(getAvatarColor('Jean')).toMatch(/^bg-/)
  })

  it('est déterministe', () => {
    expect(getAvatarColor('test')).toBe(getAvatarColor('test'))
  })
})
