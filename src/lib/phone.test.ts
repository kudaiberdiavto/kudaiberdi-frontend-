import { formatE164, formatLocalPhone, isValidLocalPhone, toE164 } from './phone'

describe('phone', () => {
	it('groups digits 3-2-2-2 as they are typed', () => {
		expect(formatLocalPhone('555')).toBe('555')
		expect(formatLocalPhone('55512')).toBe('555 12')
		expect(formatLocalPhone('555123456')).toBe('555 12 34 56')
	})

	it('ignores everything but digits and stops at 9', () => {
		expect(formatLocalPhone('(555) 12-34-56 78')).toBe('555 12 34 56')
	})

	it('accepts exactly 9 digits', () => {
		expect(isValidLocalPhone('555 12 34 56')).toBe(true)
		expect(isValidLocalPhone('555 12 34 5')).toBe(false)
		expect(isValidLocalPhone('')).toBe(false)
	})

	it('round-trips through E.164', () => {
		expect(toE164('555 12 34 56')).toBe('+996555123456')
		expect(formatE164('+996555123456')).toBe('+996 555 12 34 56')
	})

	it('leaves a foreign number as is', () => {
		expect(formatE164('+77011234567')).toBe('+77011234567')
	})
})
