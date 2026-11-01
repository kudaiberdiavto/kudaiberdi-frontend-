import { Linking } from 'react-native'
import { t } from '@/i18n'

/**
 * WhatsApp with the shop: «Здравствуйте! Я из приложения Кудайберген. Меня интересует «…»» already typed.
 * `phone` — the shop's number (+996…); without it — nothing to open.
 */
export function openWhatsApp(phone: string, partTitle?: string | null) {
	const digits = phone.replace(/\D/g, '')
	const text = partTitle
		? t('Здравствуйте! Я из приложения Кудайберген. Меня интересует «{0}».', partTitle)
		: t('Здравствуйте! Я из приложения Кудайберген.')
	return Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`)
}

