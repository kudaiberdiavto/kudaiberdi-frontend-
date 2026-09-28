import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Screen, SectionLabel } from '@/components/ui'
import { fontFamily, raw, useColors } from '@/theme'
import { sellerStats } from '@/mocks'

export default function SellerStatsScreen() {
	const c = useColors()
	const [period, setPeriod] = useState(0)

	const tiles = [
		{ value: sellerStats.total, label: 'запросов по вашим маркам', color: c.ink },
		{ value: sellerStats.answered, label: 'вы ответили «есть»', color: c.brandStrong },
		{ value: sellerStats.chats, label: 'написали вам в чат', color: c.ink },
		{ value: sellerStats.sales, label: 'продаж, запрос закрыт', color: c.success },
	]

	return (
		<Screen padding={0}>
			<View style={{ flex: 1, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>
						Статистика
					</Text>
					<View style={{ flexDirection: 'row', gap: 3, padding: 3, borderRadius: 10, backgroundColor: c.card }}>
						{['Неделя', 'Месяц'].map((label, i) => {
							const active = period === i
							return (
								<Pressable
									key={label}
									onPress={() => setPeriod(i)}
									style={{
										height: 34,
										paddingHorizontal: 12,
										borderRadius: 8,
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: active ? c.brand : 'transparent',
									}}
								>
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>
										{label}
									</Text>
								</Pressable>
							)
						})}
					</View>
				</View>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
					{tiles.map((tile) => (
						<View
							key={tile.label}
							style={{
								width: 174,
								height: 100,
								borderRadius: 14,
								backgroundColor: c.card,
								padding: 14,
								gap: 4,
							}}
						>
							<Text style={{ fontSize: 28, fontFamily: fontFamily(700), color: tile.color }}>{tile.value}</Text>
							<Text style={{ fontSize: 13, lineHeight: 16.9, fontFamily: fontFamily(400), color: c.muted }}>
								{tile.label}
							</Text>
						</View>
					))}
				</View>

				<View
					style={{
						borderRadius: 14,
						backgroundColor: c.card,
						borderWidth: 2,
						borderColor: raw.statBannerBorder,
						padding: 14,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<View style={{ flex: 1, gap: 3 }}>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
							{sellerStats.missed} запроса без ответа
						</Text>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
							бокс был открыт, но вы не ответили
						</Text>
					</View>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Смотреть</Text>
				</View>

				<View
					style={{
						borderRadius: 14,
						backgroundColor: c.card,
						padding: 14,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.inkSecondary }}>Среднее время ответа</Text>
					<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>{sellerStats.avgReply}</Text>
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Чаще всего спрашивают</SectionLabel>

				<View style={{ gap: 10 }}>
					{sellerStats.topParts.map((part) => (
						<View key={part.label} style={{ gap: 5 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.ink }}>{part.label}</Text>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{part.count}</Text>
							</View>
							<View style={{ height: 6, borderRadius: 3, backgroundColor: c.card }}>
								<View
									style={{
										height: 6,
										borderRadius: 3,
										backgroundColor: c.brand,
										width: `${part.ratio * 100}%`,
									}}
								/>
							</View>
						</View>
					))}
				</View>
			</View>
		</Screen>
	)
}
