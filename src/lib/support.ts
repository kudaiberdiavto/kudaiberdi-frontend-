import { Alert, Linking } from 'react-native'
import { formatE164 } from '@/lib/phone'
import { t } from '@/i18n'

/** «Помощь в WhatsApp» — the team's numbers, the first one is the main. */
export const SUPPORT_WHATSAPP = ['996700488402', '996700212070']

export function openSupport() {
	const open = (number: string) => Linking.openURL(`https://wa.me/${number}`)
	Alert.alert('Помощь в WhatsApp', t('Напишите нам — ответим и поможем'), [
		...SUPPORT_WHATSAPP.map((number) => ({ text: formatE164(`+${number}`), onPress: () => open(number) })),
		{ text: t('Отмена'), style: 'cancel' as const },
	])
}
