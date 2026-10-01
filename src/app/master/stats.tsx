import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { QueryErrorBanner, Screen, SectionLabel } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { formatDuration, formatNumber, plural } from '@/lib/format'
import { useMasterStats } from '@/api/services'

const PERIODS = [
	{ value: 'WEEK' as const, label: 'Неделя' },
	{ value: 'MONTH' as const, label: 'Месяц' },
]

/** Master «Статистика» — no mockup; built like the box stats [17]. GET /my/master/stats. */
export default function MasterStatsScreen() {
	const c = useColors()
	const [period, setPeriod] = useState(0)
	const stats = useMasterStats(PERIODS[period].value)
	const s = stats.data

	const tiles = [
		{ value: s?.received, label: 'заявок по вашим услугам', color: c.ink },
		{ value: s?.canHelp, label: 'вы ответили «Могу помочь»', color: c.brandStrong },
		{ value: s?.wroteInChat, label: 'написали вам в чат', color: c.ink },
		{ value: s?.deals, label: 'договорились с вами', color: c.success },
	]
	const top = s?.topServices ?? []
	const topMax = Math.max(1, ...top.map((t) => t.count))

	return (
		<Screen padding={0}>
			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Статистика</Text>
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
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>{label}</Text>
								</Pressable>
							)
						})}
					</View>
				</View>

				<QueryErrorBanner error={stats.error} onRetry={() => stats.refetch()} offlineText="Нет сети. Покажем статистику, когда появится" />

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
					{tiles.map((tile) => (
						<View key={tile.label} style={{ width: '48%', flexGrow: 1, height: 100, borderRadius: 14, backgroundColor: c.card, padding: 14, gap: 4 }}>
							<Text style={{ fontSize: 28, fontFamily: fontFamily(700), color: tile.color }}>{tile.value === undefined ? ' ' : formatNumber(tile.value)}</Text>
							<Text style={{ fontSize: 13, lineHeight: 16.9, fontFamily: fontFamily(400), color: c.muted }}>{tile.label}</Text>
						</View>
					))}
				</View>

				<View style={{ borderRadius: 14, backgroundColor: c.card, padding: 14, gap: 3 }}>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
						{s ? `${s.unanswered} ${plural(s.unanswered, ['заявка', 'заявки', 'заявок'])} без ответа` : ' '}
					</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						{s ? `«Не моё» — ${s.notMine}. Время вышло, а вы не ответили — остальные.` : ' '}
					</Text>
				</View>

				<View style={{ borderRadius: 14, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.inkSecondary }}>Среднее время ответа</Text>
					<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>
						{s?.avgReplyMinutes != null ? formatDuration(Math.max(1, Math.round(s.avgReplyMinutes))) : '—'}
					</Text>
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Чаще всего просят</SectionLabel>
				<View style={{ gap: 10 }}>
					{top.length === 0 && s ? <Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Пока мало заявок</Text> : null}
					{top.map((service) => (
						<View key={service.code} style={{ gap: 5 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.ink }}>{service.name}</Text>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{service.count}</Text>
							</View>
							<View style={{ height: 6, borderRadius: 3, backgroundColor: c.card }}>
								<View style={{ height: 6, borderRadius: 3, backgroundColor: c.brand, width: `${(service.count / topMax) * 100}%` }} />
							</View>
						</View>
					))}
				</View>
			</ScrollView>
		</Screen>
	)
}
