// Display formatting for server data. Strings follow the mockups exactly:
// «3 200 сом», «12 мин назад», «9:38», «вчера», «Ряд 14 · Бокс 12», «Camry 50 · 2012».
// Server dates are UTC ISO-8601; everything here renders in the device's local time.

const NBSP = ' '

// ─── Numbers ─────────────────────────────────────────────────────────────────

/** 3200 → «3 200» (non-breaking thousands separator). */
export function formatNumber(value: number) {
	return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
}

/** 3200 → «3 200 сом». Prices are whole soms (`currency: "KGS"`). */
export function formatPrice(value: number | null | undefined) {
	if (value === null || value === undefined) return ''
	return `${formatNumber(value)}${NBSP}сом`
}

/** Russian plural: plural(24, ['запчасть', 'запчасти', 'запчастей']) → «запчасти». */
export function plural(n: number, forms: readonly [one: string, few: string, many: string]) {
	const mod10 = Math.abs(n) % 10
	const mod100 = Math.abs(n) % 100
	if (mod10 === 1 && mod100 !== 11) return forms[0]
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
	return forms[2]
}

/** countLabel(24, ['запчасть', 'запчасти', 'запчастей']) → «24 запчасти». */
export function countLabel(n: number, forms: readonly [string, string, string]) {
	return `${formatNumber(n)} ${plural(n, forms)}`
}

// ─── Time ────────────────────────────────────────────────────────────────────

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value))

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Whole calendar days between `date` and `now` in local time (0 — today, 1 — yesterday). */
function daysAgo(date: Date, now: Date) {
	return Math.round((startOfDay(now) - startOfDay(date)) / (24 * HOUR))
}

/** «9:38» — local time of day. */
export function formatClock(value: string | Date) {
	const date = toDate(value)
	return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** A moment ahead: «сегодня 15:00», «завтра 10:00», «12 сен 9:00» [37, 39]. */
export function formatWhenAt(value: string | Date, now = new Date()) {
	const date = toDate(value)
	const days = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000)
	const day = days === 0 ? 'сегодня' : days === 1 ? 'завтра' : formatDay(date)
	return `${day} ${formatClock(date)}`
}

/** «рядом», «850 м», «2,1 км». */
export function formatDistance(meters: number) {
	if (meters < 100) return 'рядом'
	return meters < 1000 ? `${Math.round(meters / 10) * 10} м` : `${(meters / 1000).toFixed(1).replace('.', ',')} км`
}

/** «12 сен» — for anything older than yesterday. */
export function formatDay(value: string | Date) {
	const date = toDate(value)
	return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

/**
 * Relative age: «только что», «12 мин назад», «3 ч назад», «вчера», «12 сен».
 * `short` drops «назад» — «2 мин» in the seller's request feed [11].
 */
export function formatAgo(value: string | Date, { short = false, now = new Date() } = {}) {
	const date = toDate(value)
	const diff = now.getTime() - date.getTime()
	const suffix = short ? '' : ' назад'

	if (diff < MINUTE) return short ? '1 мин' : 'только что'
	if (diff < HOUR) return `${Math.floor(diff / MINUTE)} мин${suffix}`
	const days = daysAgo(date, now)
	if (days === 0) return `${Math.floor(diff / HOUR)} ч${suffix}`
	if (days === 1) return 'вчера'
	return formatDay(date)
}

/** Chat list time [16]: today «9:38», «вчера», this week «пн», older «12 сен». */
export function formatChatTime(value: string | Date, now = new Date()) {
	const date = toDate(value)
	const days = daysAgo(date, now)
	if (days <= 0) return formatClock(date)
	if (days === 1) return 'вчера'
	if (days < 7) return WEEKDAYS[date.getDay()]
	return formatDay(date)
}

/** Minutes left until `expiresAt` (never negative). */
export function minutesLeft(expiresAt: string | Date, now = new Date()) {
	return Math.max(0, Math.ceil((toDate(expiresAt).getTime() - now.getTime()) / MINUTE))
}

/** «18 мин», «1 ч 20 мин», «3 ч». */
export function formatDuration(minutes: number) {
	if (minutes < 60) return `${minutes} мин`
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return m ? `${h} ч ${m} мин` : `${h} ч`
}

/** Timer label from `expiresAt`: «осталось 12 мин» / «время вышло». */
export function formatRemaining(expiresAt: string | Date, now = new Date()) {
	const left = minutesLeft(expiresAt, now)
	return left > 0 ? `осталось ${formatDuration(left)}` : 'время вышло'
}

// ─── Market place ────────────────────────────────────────────────────────────

type Side = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'

const SIDES: Record<Side, string> = {
	NORTH: 'северная',
	SOUTH: 'южная',
	EAST: 'восточная',
	WEST: 'западная',
}

/** «северная» (сторона ряда). */
export function formatSide(side: Side | null | undefined) {
	return side ? SIDES[side] : ''
}

/** «Ряд 14» — prefers the server's `rowLabel`, falls back to the row code. */
export function formatRow(row: { rowLabel?: string | null; row?: string | null; rowCode?: string | null }) {
	return row.rowLabel ?? `Ряд ${row.row ?? row.rowCode ?? ''}`
}

/**
 * «Ряд 14 · Бокс 12». Accepts both shapes the API uses:
 * flat `{row, rowLabel, container}` and location `{rowCode, rowLabel, number}`.
 */
export function formatPlace(place: {
	rowLabel?: string | null
	row?: string | null
	rowCode?: string | null
	container?: number | null
	number?: number | null
}) {
	const box = place.container ?? place.number
	const row = formatRow(place)
	return box === null || box === undefined ? row : `${row} · Бокс ${box}`
}

// ─── Cars ────────────────────────────────────────────────────────────────────

/** «Camry 50 · 2012» — prefers the server's ready `label`. */
export function formatCar(car: {
	label?: string | null
	displayName?: string | null
	modelLabel?: string | null
	model?: { label?: string | null } | null
	year?: number | null
}) {
	if (car.label) return car.label
	const model = car.displayName ?? car.modelLabel ?? car.model?.label ?? ''
	return car.year ? `${model} · ${car.year}` : model
}
