import { Linking } from 'react-native'

/**
 * WhatsApp with the shop: «Здравствуйте! Я из приложения Кудайберген. Меня интересует «…»» already typed.
 * `phone` — the shop's number (+996…); without it — nothing to open.
 */
export function openWhatsApp(phone: string, partTitle?: string | null) {
	const digits = phone.replace(/\D/g, '')
	const text = partTitle
		? `Здравствуйте! Я из приложения Кудайберген. Меня интересует «${partTitle}».`
		: 'Здравствуйте! Я из приложения Кудайберген.'
	return Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`)
}

/** WhatsApp with the courier service (Ылдам): «Здравствуйте! Я из приложения Кудайберген, по доставке KDB-…». */
export function openCourierWhatsApp(phone: string, orderNumber?: string | null) {
	const digits = phone.replace(/\D/g, '')
	const text = orderNumber
		? `Здравствуйте! Я из приложения Кудайберген, по доставке ${orderNumber}.`
		: 'Здравствуйте! Я из приложения Кудайберген, хочу заказать доставку.'
	return Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`)
}
