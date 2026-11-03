import { Text, View } from 'react-native'
import { BottomSheet, Button } from '@/components/ui'
import { BellIcon } from '@/components/buyer-v23'
import { fontFamily, fs, useColors } from '@/theme'
import { allowPush, type PushMoment, snoozePush, usePushPrimer } from '@/lib/push'
import { t } from '@/i18n'

/** What the pushes give at this moment — the reason to say «yes». */
const COPY: Record<PushMoment, { title: string; text: string }> = {
	request: {
		title: t('Сообщить, когда продавцы ответят?'),
		text: t('Ответы приходят за несколько минут. Пришлём уведомление с ценой — не нужно держать приложение открытым.'),
	},
	service: {
		title: t('Сообщить, когда мастер откликнется?'),
		text: t('Пришлём уведомление, как только мастер ответит, — с ценой и временем.'),
	},
	shop: {
		title: t('Получать запросы покупателей?'),
		text: t('Покупатели ищут запчасти прямо сейчас. Кто ответит первым — тот и продаст.'),
	},
	master: {
		title: t('Получать заявки клиентов?'),
		text: t('Пришлём уведомление о новой заявке рядом — успейте откликнуться первым.'),
	},
}

/** Our own «allow notifications?» before the system one; mounted once in the root layout. */
export function PushPrimer() {
	const c = useColors()
	const { moment, denied } = usePushPrimer()
	if (!moment) return null
	const copy = COPY[moment]
	return (
		<BottomSheet
			onClose={snoozePush}
			footer={
				<View style={{ gap: 8 }}>
					<Button label={denied ? t('Открыть настройки') : t('Разрешить уведомления')} onPress={allowPush} />
					<Button label={t('Не сейчас')} variant="outline" onPress={snoozePush} />
				</View>
			}
		>
			<View style={{ alignItems: 'center', gap: 14, paddingTop: 4, paddingBottom: 8 }}>
				<View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<BellIcon size={40} color={c.brandStrong} />
				</View>
				<Text style={{ fontSize: fs.h3, fontFamily: fontFamily(800), color: c.ink, textAlign: 'center' }}>{copy.title}</Text>
				<Text style={{ fontSize: fs.base, lineHeight: 23, fontFamily: fontFamily(400), color: c.inkSecondary, textAlign: 'center' }}>
					{denied ? t('Уведомления выключены в настройках телефона. Включите их для KUDAIBERDI.') : copy.text}
				</Text>
			</View>
		</BottomSheet>
	)
}
