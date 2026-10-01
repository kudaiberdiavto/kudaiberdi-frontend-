import { Pressable, Text, View } from 'react-native'
import { ClockIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { formatDuration, minutesLeft } from '@/lib/format'

/**
 * «Активен ещё 18 мин · из 30» + progress + «+30 мин» pill [32]. Green while running,
 * grey once time is up. `now` comes from the screen so all timers tick together.
 */
export function CountdownBar({
	expiresAt,
	durationMin,
	now,
	closed = false,
	extendLabel = '+30 мин',
	onExtend,
	extendDisabled = false,
}: {
	expiresAt: string
	durationMin: number
	now: Date
	closed?: boolean
	extendLabel?: string
	/** No handler — no pill. */
	onExtend?: () => void
	extendDisabled?: boolean
}) {
	const c = useColors()
	const left = closed ? 0 : minutesLeft(expiresAt, now)
	const active = left > 0
	const color = active ? c.success : c.muted
	const progress = durationMin > 0 ? Math.min(1, left / durationMin) : 0

	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			<ClockIcon size={20} color={color} />
			<View style={{ flex: 1, gap: 6 }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color }}>
						{closed ? 'Запрос закрыт' : active ? `Активен ещё ${formatDuration(left)}` : 'Время вышло'}
					</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>из {formatDuration(durationMin).replace(' мин', '')}</Text>
				</View>
				<View style={{ height: 6, borderRadius: 3, backgroundColor: raw.fill, overflow: 'hidden' }}>
					<View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 3, backgroundColor: c.success }} />
				</View>
			</View>
			{onExtend ? (
				<Pressable
					onPress={onExtend}
					disabled={extendDisabled}
					style={{
						height: 34,
						paddingHorizontal: 12,
						borderRadius: 17,
						backgroundColor: c.brandTint,
						justifyContent: 'center',
						opacity: extendDisabled ? 0.5 : 1,
					}}
				>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>{extendLabel}</Text>
				</Pressable>
			) : null}
		</View>
	)
}
