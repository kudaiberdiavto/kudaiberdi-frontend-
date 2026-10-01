import { Pressable, Text, View } from 'react-native'
import { fontFamily, useColors } from '@/theme'
import type { RequestDuration } from '@/api/types'

/** «30 мин / 1 час / 3 часа / До 17:00» — how long to wait for answers [06б]. */
export const DURATION_OPTIONS: { value: RequestDuration; label: string; hint?: string; words: string }[] = [
	{ value: 'MIN_30', label: '30 мин', hint: 'по умолч.', words: '30 минут' },
	{ value: 'HOUR_1', label: '1 час', words: '1 час' },
	{ value: 'HOUR_3', label: '3 часа', words: '3 часа' },
	{ value: 'END_OF_DAY', label: 'До 17:00', hint: 'конец дня', words: 'до 17:00' },
]

export function DurationPicker({ value, onChange }: { value: RequestDuration; onChange: (value: RequestDuration) => void }) {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', gap: 8 }}>
			{DURATION_OPTIONS.map((option) => {
				const active = option.value === value
				return (
					<Pressable
						key={option.value}
						onPress={() => onChange(option.value)}
						style={{
							flex: 1,
							height: 56,
							borderRadius: 12,
							backgroundColor: active ? c.brandTint : c.card,
							borderWidth: 2,
							borderColor: active ? c.brand : c.border,
							alignItems: 'center',
							justifyContent: 'center',
							gap: 1,
						}}
					>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
							{option.label}
						</Text>
						{option.hint ? (
							<Text style={{ fontSize: 11.5, fontFamily: fontFamily(400), color: active ? c.brandStrong : c.muted }}>
								{option.hint}
							</Text>
						) : null}
					</Pressable>
				)
			})}
		</View>
	)
}
