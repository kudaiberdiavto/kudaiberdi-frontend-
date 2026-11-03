export const COUNTRY_CODE = '+996'

/**
 * The 9 local digits from whatever was typed or autofilled: «+996 555 12 34 56» and «0555 12 34 56» lose
 * the country code / trunk zero, so autofill doesn't leave «996 55 51 23 4».
 */
function localDigits(raw: string) {
	const digits = raw.replace(/\D/g, '')
	if (digits.length > 9 && digits.startsWith('996')) return digits.slice(3, 12)
	if (digits.length === 10 && digits.startsWith('0')) return digits.slice(1)
	return digits.slice(0, 9)
}

/** Formats raw digits as "555 12 34 56" (3-2-2-2 grouping). */
export function formatLocalPhone(raw: string) {
	const digits = localDigits(raw)
	const groups = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)]
	return groups.filter(Boolean).join(' ')
}

export function isValidLocalPhone(raw: string) {
	return localDigits(raw).length === 9
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
