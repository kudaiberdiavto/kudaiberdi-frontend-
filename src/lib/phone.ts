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

/** "555 12 34 56" → "+996555123456" (the backend accepts only E.164 +996). */
export function toE164(local: string) {
	return `${COUNTRY_CODE}${local.replace(/\D/g, '')}`
}

/** "+996555123456" → "+996 555 12 34 56". */
export function formatE164(phone: string) {
	return phone.startsWith(COUNTRY_CODE)
		? `${COUNTRY_CODE} ${formatLocalPhone(phone.slice(COUNTRY_CODE.length))}`
		: phone
}
