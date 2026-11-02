import { cursorPaging, flattenPages, mapPages } from './pagination'

const data = {
	pages: [
		{ items: [{ id: 1 }, { id: 2 }], nextCursor: 'b' },
		{ items: [{ id: 3 }], nextCursor: null },
	],
	pageParams: [undefined, 'b'],
}

describe('pagination', () => {
	it('flattens loaded pages in order', () => {
		expect(flattenPages(data).map((item) => item.id)).toEqual([1, 2, 3])
		expect(flattenPages(undefined)).toEqual([])
	})

	it('stops when the server gives no cursor', () => {
		expect(cursorPaging.getNextPageParam(data.pages[0])).toBe('b')
		expect(cursorPaging.getNextPageParam(data.pages[1])).toBeUndefined()
	})

	it('mapPages edits every page and keeps cursors — the optimistic «Нет» / «Не моё»', () => {
		const next = mapPages(data, (items) => items.filter((item) => item.id !== 2))
		expect(next?.pages.map((page) => page.items.map((item) => item.id))).toEqual([[1], [3]])
		expect(next?.pages.map((page) => page.nextCursor)).toEqual(['b', null])
		expect(next?.pageParams).toBe(data.pageParams)
		// the cache entry it came from is untouched — needed to roll back
		expect(data.pages[0].items).toHaveLength(2)
	})

	it('mapPages leaves a missing cache missing', () => {
		expect(mapPages(undefined, (items) => items)).toBeUndefined()
	})
})
