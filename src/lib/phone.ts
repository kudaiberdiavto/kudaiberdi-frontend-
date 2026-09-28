export const COUNTRY_CODE = '+996'

/** Formats raw digits as "555 12 34 56" (3-2-2-2 grouping). */
export function formatLocalPhone(raw: string) {
	const digits = raw.replace(/\D/g, '').slice(0, 9)
	const groups = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)]
	return groups.filter(Boolean).join(' ')
}

export function isValidLocalPhone(raw: string) {
	return raw.replace(/\D/g, '').length === 9
}
