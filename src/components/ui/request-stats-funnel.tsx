import { Text, View } from 'react-native'
import { fontFamily, useColors } from '@/theme'
import type { RecipientCounts } from '@/api/types'

/** Five bars — got / saw / «Есть» / «Нет» / silent — scaled to «Получили» [32]. */
export function RequestStatsFunnel({ counts }: { counts: RecipientCounts }) {
	const c = useColors()
	const bars = [
		{ label: 'Получили', value: counts.delivered, color: '#8C96A5' },
		{ label: 'Посмотрели', value: counts.seen, color: c.brand },
		{ label: 'Ответили «Есть»', value: counts.have, color: c.success },
		{ label: 'Ответили «Нет»', value: counts.notHave, color: '#B8B4B4' },
		{ label: 'Ещё не ответили', value: counts.silent, color: c.border },
	]
	const max = Math.max(1, counts.delivered)

	return (
		<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 14, gap: 10 }}>
			{bars.map((bar) => (
				<View key={bar.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Text style={{ width: 128, fontSize: 14, fontFamily: fontFamily(400), color: c.inkSecondary }}>{bar.label}</Text>
					<View style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: c.surface, overflow: 'hidden' }}>
						{bar.value > 0 ? (
							<View style={{ width: `${Math.min(100, (bar.value / max) * 100)}%`, height: '100%', borderRadius: 6, backgroundColor: bar.color }} />
						) : null}
					</View>
					<Text style={{ width: 26, textAlign: 'right', fontSize: 16, fontFamily: fontFamily(800), color: c.ink }}>{bar.value}</Text>
				</View>
			))}
		</View>
	)
}
