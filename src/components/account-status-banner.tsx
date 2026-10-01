import { Pressable, Text, View } from 'react-native'
import { fontFamily, useColors } from '@/theme'

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
	const what = kind === 'shop' ? 'Магазин' : 'Профиль'
	const title =
		status === 'BLOCKED'
			? `${what} заблокирован`
			: status === 'REJECTED'
				? kind === 'shop'
					? 'Место не подтверждено'
					: 'Профиль отклонён'
				: `${what} на проверке`
	const text =
		reason ??
		(status === 'BLOCKED'
			? 'Запросы не приходят. Напишите в поддержку.'
			: status === 'REJECTED'
				? kind === 'shop'
					? 'Администрация не подтвердила контейнер. Магазин скрыт — выберите контейнер заново.'
					: 'Администрация не подтвердила профиль. Исправьте данные и сохраните.'
				: kind === 'shop'
					? 'Запросы начнут приходить, как только администрация подтвердит место.'
					: 'Заявки начнут приходить, как только администратор подтвердит профиль.')

	return (
		<View style={{ borderRadius: 12, backgroundColor: bad ? c.dangerTint : c.brandTint, padding: 12, gap: 4 }}>
			<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: bad ? c.danger : c.brandStrong }}>{title}</Text>
			<Text style={{ fontSize: 13, lineHeight: 18, fontFamily: fontFamily(400), color: c.inkSecondary }}>
				{reason && status === 'REJECTED' ? `Причина: ${reason}` : text}
			</Text>
			{action && status === 'REJECTED' ? (
				<Pressable onPress={action.onPress} hitSlop={8} style={{ paddingTop: 4 }}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{action.label} ›</Text>
				</Pressable>
			) : null}
		</View>
	)
}
