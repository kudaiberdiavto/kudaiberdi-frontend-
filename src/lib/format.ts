import { t } from '@/i18n'
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
	return t('{0}{1}сом', formatNumber(value), NBSP)
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
const months = () => [t('янв'), t('фев'), t('мар'), t('апр'), t('мая'), t('июн'), t('июл'), t('авг'), t('сен'), t('окт'), t('ноя'), t('дек')]
const WEEKDAYS = [t('вс'), t('пн'), t('вт'), t('ср'), t('чт'), t('пт'), t('сб')]

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
	const day = days === 0 ? t('сегодня') : days === 1 ? t('завтра') : formatDay(date)
	return `${day} ${formatClock(date)}`
}

/** «рядом», «850 м», «2,1 км». */
export function formatDistance(meters: number) {
	if (meters < 100) return t('рядом')
	return meters < 1000 ? t('{0} м', Math.round(meters / 10) * 10) : t('{0} км', (meters / 1000).toFixed(1).replace('.', ','))
}

/** «12 сен» — for anything older than yesterday. */
export function formatDay(value: string | Date) {
	const date = toDate(value)
	return `${date.getDate()} ${months()[date.getMonth()]}`
}

/**
 * Relative age: «только что», «12 мин назад», «3 ч назад», «вчера», «12 сен».
 * `short` drops «назад» — «2 мин» in the seller's request feed [11].
 */
export function formatAgo(value: string | Date, { short = false, now = new Date() } = {}) {
	const date = toDate(value)
	const diff = now.getTime() - date.getTime()
	const suffix = short ? '' : t(' назад')

	if (diff < MINUTE) return short ? t('1 мин') : t('только что')
	if (diff < HOUR) return t('{0} мин{1}', Math.floor(diff / MINUTE), suffix)
	const days = daysAgo(date, now)
	if (days === 0) return t('{0} ч{1}', Math.floor(diff / HOUR), suffix)
	if (days === 1) return t('вчера')
	return formatDay(date)
}

/** Chat list time [16]: today «9:38», «вчера», this week «пн», older «12 сен». */
export function formatChatTime(value: string | Date, now = new Date()) {
	const date = toDate(value)
	const days = daysAgo(date, now)
	if (days <= 0) return formatClock(date)
	if (days === 1) return t('вчера')
	if (days < 7) return WEEKDAYS[date.getDay()]
	return formatDay(date)
}

/** Minutes left until `expiresAt` (never negative). */
export function minutesLeft(expiresAt: string | Date, now = new Date()) {
	return Math.max(0, Math.ceil((toDate(expiresAt).getTime() - now.getTime()) / MINUTE))
}

/** «18 мин», «1 ч 20 мин», «3 ч». */
export function formatDuration(minutes: number) {
	if (minutes < 60) return t('{0} мин', minutes)
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return m ? t('{0} ч {1} мин', h, m) : t('{0} ч', h)
}

/** Timer label from `expiresAt`: «осталось 12 мин» / «время вышло». */
export function formatRemaining(expiresAt: string | Date, now = new Date()) {
	const left = minutesLeft(expiresAt, now)
	return left > 0 ? t('осталось {0}', formatDuration(left)) : t('время вышло')
}

// ─── Market place ────────────────────────────────────────────────────────────

type Side = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'

const SIDES: Record<Side, string> = {
	NORTH: t('северная'),
	SOUTH: t('южная'),
	EAST: t('восточная'),
	WEST: t('западная'),
}

/** «северная» (сторона ряда). */
export function formatSide(side: Side | null | undefined) {
	return side ? SIDES[side] : ''
}

/** «Ряд 14» — prefers the server's `rowLabel`, falls back to the row code. */
export function formatRow(row: { rowLabel?: string | null; row?: string | null; rowCode?: string | null }) {
	return row.rowLabel ?? t('Ряд {0}', row.row ?? row.rowCode ?? '')
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
	return box === null || box === undefined ? row : t('{0} · Контейнер {1}', row, box)
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
