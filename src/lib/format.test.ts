import {
	countLabel,
	formatAgo,
	formatChatTime,
	formatDistance,
	formatDuration,
	formatNumber,
	formatPrice,
	formatRemaining,
	minutesLeft,
	plural,
} from './format'

const NBSP = ' '
const PARTS = ['запчасть', 'запчасти', 'запчастей'] as const

describe('prices', () => {
	it('groups thousands with a non-breaking space', () => {
		expect(formatNumber(3200)).toBe(`3${NBSP}200`)
		expect(formatNumber(1_250_000)).toBe(`1${NBSP}250${NBSP}000`)
		expect(formatNumber(999)).toBe('999')
	})

	it('rounds to whole soms', () => {
		expect(formatNumber(2899.6)).toBe(`2${NBSP}900`)
	})

	it('prints «сом» and nothing for a missing price', () => {
		expect(formatPrice(3200)).toBe(`3${NBSP}200${NBSP}сом`)
		expect(formatPrice(0)).toBe(`0${NBSP}сом`)
		expect(formatPrice(null)).toBe('')
		expect(formatPrice(undefined)).toBe('')
	})
})

describe('plural', () => {
	it.each([
		[1, 'запчасть'],
		[21, 'запчасть'],
		[2, 'запчасти'],
		[24, 'запчасти'],
		[5, 'запчастей'],
		[11, 'запчастей'],
		[12, 'запчастей'],
		[14, 'запчастей'],
		[111, 'запчастей'],
		[0, 'запчастей'],
	])('%i → %s', (n, form) => {
		expect(plural(n, PARTS)).toBe(form)
	})

	it('countLabel keeps the number formatted', () => {
		expect(countLabel(1024, PARTS)).toBe(`1${NBSP}024 запчасти`)
	})
})

describe('time', () => {
	const now = new Date(2026, 10, 2, 15, 0)
	const minutesBefore = (m: number) => new Date(now.getTime() - m * 60_000)

	it('formatAgo', () => {
		expect(formatAgo(minutesBefore(0.5), { now })).toBe('только что')
		expect(formatAgo(minutesBefore(12), { now })).toBe('12 мин назад')
		expect(formatAgo(minutesBefore(12), { now, short: true })).toBe('12 мин')
		expect(formatAgo(minutesBefore(180), { now })).toBe('3 ч назад')
		expect(formatAgo(new Date(2026, 10, 1, 20, 0), { now })).toBe('вчера')
		expect(formatAgo(new Date(2026, 8, 12, 9, 0), { now })).toBe('12 сен')
	})

	it('formatChatTime: today clock, yesterday, weekday, date', () => {
		expect(formatChatTime(new Date(2026, 10, 2, 9, 38), now)).toBe('9:38')
		expect(formatChatTime(new Date(2026, 10, 1, 9, 38), now)).toBe('вчера')
		expect(formatChatTime(new Date(2026, 9, 29, 9, 38), now)).toBe('чт')
		expect(formatChatTime(new Date(2026, 8, 12, 9, 38), now)).toBe('12 сен')
	})

	it('minutesLeft rounds up and never goes negative', () => {
		expect(minutesLeft(new Date(now.getTime() + 61_000), now)).toBe(2)
		expect(minutesLeft(minutesBefore(5), now)).toBe(0)
	})

	it('formatDuration and formatRemaining', () => {
		expect(formatDuration(18)).toBe('18 мин')
		expect(formatDuration(80)).toBe('1 ч 20 мин')
		expect(formatDuration(180)).toBe('3 ч')
		expect(formatRemaining(new Date(now.getTime() + 12 * 60_000), now)).toBe('осталось 12 мин')
		expect(formatRemaining(minutesBefore(1), now)).toBe('время вышло')
	})
})

describe('formatDistance', () => {
	it('«рядом», metres to tens, kilometres with a comma', () => {
		expect(formatDistance(40)).toBe('рядом')
		expect(formatDistance(847)).toBe('850 м')
		expect(formatDistance(2140)).toBe('2,1 км')
	})
})
