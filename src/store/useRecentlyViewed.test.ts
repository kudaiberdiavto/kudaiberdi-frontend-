import type { PartDetail } from '@/api/types'
import { useRecentlyViewed } from './useRecentlyViewed'

jest.mock('@/lib/local-json', () => ({
	localJsonStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}))

const part = (id: number, extra: Partial<PartDetail> = {}) =>
	({ id, title: `Запчасть ${id}`, price: id * 100, photos: [], video: null, shop: { name: 'Азамат' }, ...extra }) as unknown as PartDetail
const ids = () => useRecentlyViewed.getState().items.map((item) => item.id)
const add = (p: PartDetail) => useRecentlyViewed.getState().add(p)

describe('recently viewed', () => {
	beforeEach(() => useRecentlyViewed.getState().clear())

	it('puts the last opened first and does not repeat it', () => {
		add(part(1))
		add(part(2))
		add(part(1))
		expect(ids()).toEqual([1, 2])
	})

	it('keeps the last 12', () => {
		for (let i = 1; i <= 15; i++) add(part(i))
		expect(ids()).toHaveLength(12)
		expect(ids()[0]).toBe(15)
		expect(ids()).not.toContain(3)
	})

	it('takes the first photo, else the video poster', () => {
		add(part(1, { photos: [{ thumbUrl: '/p/1.jpg' }] as PartDetail['photos'] }))
		add(part(2, { video: { posterUrl: '/v/2.jpg' } as PartDetail['video'] }))
		const [video, photo] = useRecentlyViewed.getState().items
		expect(photo.thumbUrl).toBe('/p/1.jpg')
		expect(video.thumbUrl).toBe('/v/2.jpg')
	})
})
