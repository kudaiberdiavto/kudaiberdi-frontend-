import { useRecentSearches } from './useRecentSearches'

jest.mock('@/lib/local-json', () => ({
	localJsonStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}))

const items = () => useRecentSearches.getState().items
const add = (q: string) => useRecentSearches.getState().add(q)

describe('recent searches', () => {
	beforeEach(() => useRecentSearches.getState().clear())

	it('puts the newest first and trims', () => {
		add('колодки')
		add('  стойка KYB ')
		expect(items()).toEqual(['стойка KYB', 'колодки'])
	})

	it('moves a repeat to the top instead of duplicating it, ignoring case', () => {
		add('колодки')
		add('стойка')
		add('Колодки')
		expect(items()).toEqual(['Колодки', 'стойка'])
	})

	it('skips one-letter noise', () => {
		add('к')
		add(' ')
		expect(items()).toEqual([])
	})

	it('keeps the last 8', () => {
		for (let i = 1; i <= 10; i++) add(`запрос ${i}`)
		expect(items()).toHaveLength(8)
		expect(items()[0]).toBe('запрос 10')
		expect(items()).not.toContain('запрос 2')
	})

	it('removes one', () => {
		add('колодки')
		add('стойка')
		useRecentSearches.getState().remove('колодки')
		expect(items()).toEqual(['стойка'])
	})
})
