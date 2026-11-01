import { Pressable, Text, View } from 'react-native'
import { fontFamily, useColors } from '@/theme'
import { t } from '@/i18n'

type Status = 'PENDING_VERIFICATION' | 'ACTIVE' | 'BLOCKED' | 'REJECTED'

/**
 * Why requests don't come [11, 21, 39]: on review / blocked / rejected by the administration, with the reason.
 * Rejected — the place was not confirmed: `action` («Выбрать другой контейнер», «Изменить профиль»).
 */
export function AccountStatusBanner({
	status,
	reason,
	kind,
	action,
}: {
	status: Status | undefined
	reason: string | null | undefined
	kind: 'shop' | 'master'
	action?: { label: string; onPress: () => void }
}) {
	const c = useColors()
	if (!status || status === 'ACTIVE') return null
	const bad = status === 'BLOCKED' || status === 'REJECTED'
	const what = kind === 'shop' ? t('Магазин') : t('Профиль')
	const title =
		status === 'BLOCKED'
			? t('{0} заблокирован', what)
			: status === 'REJECTED'
				? kind === 'shop'
					? t('Место не подтверждено')
					: t('Профиль отклонён')
				: t('{0} на проверке', what)
	const text =
		reason ??
		(status === 'BLOCKED'
			? t('Запросы не приходят. Напишите в поддержку.')
			: status === 'REJECTED'
				? kind === 'shop'
					? t('Администрация не подтвердила контейнер. Магазин скрыт — выберите контейнер заново.')
					: t('Администрация не подтвердила профиль. Исправьте данные и сохраните.')
				: kind === 'shop'
					? t('Запросы начнут приходить, как только администрация подтвердит место.')
					: t('Заявки начнут приходить, как только администратор подтвердит профиль.'))

	return (
		<View style={{ borderRadius: 12, backgroundColor: bad ? c.dangerTint : c.brandTint, padding: 12, gap: 4 }}>
			<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: bad ? c.danger : c.brandStrong }}>{title}</Text>
			<Text style={{ fontSize: 14.5, lineHeight: 20, fontFamily: fontFamily(400), color: c.inkSecondary }}>
				{reason && status === 'REJECTED' ? t('Причина: {0}', reason) : text}
			</Text>
			{action && status === 'REJECTED' ? (
				<Pressable onPress={action.onPress} hitSlop={8} style={{ paddingTop: 4 }}>
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{action.label} ›</Text>
				</Pressable>
			) : null}
		</View>
	)
}
