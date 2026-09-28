import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Button } from '@/components/ui'
import { CheckIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'

const tags = ['Быстро ответил', 'Деталь как надо', 'Легко найти бокс']

export default function RequestClosedScreen() {
	const c = useColors()
	const [rating, setRating] = useState(4)
	const [tag, setTag] = useState(0)

	return (
		<View style={{ flex: 1, backgroundColor: raw.sheetBackdrop, justifyContent: 'flex-end' }}>
			<View
				style={{
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 12,
					paddingHorizontal: 20,
					paddingBottom: 28,
					gap: 18,
				}}
			>
				<View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: raw.dashed, alignSelf: 'center' }} />

				<View
					style={{
						width: 56,
						height: 56,
						borderRadius: 28,
						backgroundColor: c.successTint,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<CheckIcon size={28} color={c.success} />
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 24, fontFamily: fontFamily(700), color: c.ink }}>Запрос закрыт</Text>
					<Text style={{ fontSize: 16, lineHeight: 23.2, fontFamily: fontFamily(400), color: c.muted }}>
						Остальные продавцы больше его не видят. Как прошло у Автодеталь Азамат?
					</Text>
				</View>

				<View style={{ flexDirection: 'row', gap: 10 }}>
					{[1, 2, 3, 4, 5].map((star) => {
						const active = star <= rating
						return (
							<Pressable
								key={star}
								onPress={() => setRating(star)}
								style={{
									flex: 1,
									height: 52,
									borderRadius: 12,
									backgroundColor: active ? c.brandTint : raw.fill,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 26, color: active ? c.brandStrong : raw.fillInk }}>★</Text>
							</Pressable>
						)
					})}
				</View>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{tags.map((label, i) => {
						const active = tag === i
						return (
							<Pressable
								key={label}
								onPress={() => setTag(i)}
								style={{
									height: 44,
									paddingHorizontal: 12,
									borderRadius: 20,
									borderWidth: 2,
									borderColor: active ? c.brand : c.border,
									backgroundColor: active ? c.brandTint : raw.fill,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text
									style={{
										fontSize: 14,
										fontFamily: fontFamily(active ? 700 : 600),
										color: active ? c.brandStrong : c.inkSecondary,
									}}
								>
									{label}
								</Text>
							</Pressable>
						)
					})}
				</View>

				<Button label="Готово" onPress={() => router.replace('/buyer')} />
			</View>
		</View>
	)
}
