import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { QueryErrorBanner, Screen, SectionLabel } from '@/components/ui'
import { fontFamily, raw, useColors } from '@/theme'
import { formatDuration, formatNumber, plural } from '@/lib/format'
import { useShopStats } from '@/api/stats'

const PERIODS = [
	{ value: 'WEEK' as const, label: 'Неделя' },
	{ value: 'MONTH' as const, label: 'Месяц' },
]

/** 17 «Статистика» of the box — last 7 / 30 days. */
export default function SellerStatsScreen() {
	const c = useColors()
	const [period, setPeriod] = useState(0)
	const stats = useShopStats(PERIODS[period].value)
	const s = stats.data

	const tiles = [
		{ value: s?.requestsByBrands, label: 'запросов по вашим маркам', color: c.ink },
		{ value: s?.answeredHave, label: 'вы ответили «есть»', color: c.brandStrong },
		{ value: s?.wroteInChat, label: 'написали вам в чат', color: c.ink },
		{ value: s?.sales, label: 'продаж, запрос закрыт', color: c.success },
	]
	const top = s?.topCategories ?? []
	const topMax = Math.max(1, ...top.map((t) => t.count))

	return (
		<Screen padding={0}>
			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>
						Статистика
					</Text>
					<View style={{ flexDirection: 'row', gap: 3, padding: 3, borderRadius: 10, backgroundColor: c.card }}>
						{PERIODS.map(({ label }, i) => {
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

				<QueryErrorBanner error={stats.error} onRetry={() => stats.refetch()} offlineText="Нет сети. Покажем статистику, когда появится" />

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
							<Text style={{ fontSize: 28, fontFamily: fontFamily(700), color: tile.color }}>
								{tile.value === undefined ? ' ' : formatNumber(tile.value)}
							</Text>
							<Text style={{ fontSize: 13, lineHeight: 16.9, fontFamily: fontFamily(400), color: c.muted }}>
								{tile.label}
							</Text>
						</View>
					))}
				</View>

				<Pressable
					onPress={() => router.push('/seller-missed')}
					disabled={!s?.unanswered}
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
							{s ? `${s.unanswered} ${plural(s.unanswered, ['запрос', 'запроса', 'запросов'])} без ответа` : ' '}
						</Text>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
							бокс был открыт, но вы не ответили
						</Text>
					</View>
					{s?.unanswered ? (
						<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Смотреть</Text>
					) : null}
				</Pressable>

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
					<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>
						{s?.avgReplyMinutes != null ? formatDuration(Math.max(1, Math.round(s.avgReplyMinutes))) : '—'}
					</Text>
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Чаще всего спрашивают</SectionLabel>

				<View style={{ gap: 10 }}>
					{top.length === 0 && s ? (
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Пока мало запросов с категорией</Text>
					) : null}
					{top.map((part) => (
						<View key={part.categoryId} style={{ gap: 5 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.ink }}>{part.name}</Text>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{part.count}</Text>
							</View>
							<View style={{ height: 6, borderRadius: 3, backgroundColor: c.card }}>
								<View
									style={{
										height: 6,
										borderRadius: 3,
										backgroundColor: c.brand,
										// Bar length relative to the top category (counts come from the server).
										width: `${(part.count / topMax) * 100}%`,
									}}
								/>
							</View>
						</View>
					))}
				</View>
			</ScrollView>
		</Screen>
	)
}
