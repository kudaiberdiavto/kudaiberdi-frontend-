import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BrandLogo, Button, CountdownBar, QueryErrorBanner, RequestStatsFunnel } from '@/components/ui'
import { BuyerTabBar } from '@/components/buyer-tab-bar'
import { ChatIcon, ChevronLeftIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { formatDuration, formatNumber, plural } from '@/lib/format'
import { resolveUrl } from '@/lib/api'
import { useExtendRequest, useRequest, useRequestStats, useWidenRequest } from '@/api/requests'
import { useRows } from '@/api/market'
import type { RequestHave } from '@/api/types'

const MINUTE = 60_000

function joinCodes(codes: string[]) {
	return codes.length > 1 ? `${codes.slice(0, -1).join(', ')} и ${codes[codes.length - 1]}` : (codes[0] ?? '')
}

/**
 * 32 «Статистика запроса»: countdown with «+30 мин», funnel, who has it (by answer time),
 * who hasn't (row · box). Kept live by the REQUEST_STATS event on the inbox channel.
 */
export default function RequestStatsScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useRequest(id)
	const stats = useRequestStats(id)
	const rows = useRows()
	const extend = useExtendRequest(id)
	const widen = useWidenRequest(id)
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 15_000)
		return () => clearInterval(timer)
	}, [])

	const data = stats.data
	const detail = request.data
	const actionError = extend.error ?? widen.error

	// «Camry 50 · 2012 · ряды 14 и Ц»
	const codeById = new Map((rows.data ?? []).map((row) => [row.id, row.code]))
	const rowCodes = (detail?.targetRowIds ?? []).map((rowId) => codeById.get(rowId)).filter((code): code is string => !!code)
	const audience = !detail
		? ''
		: detail.target === 'ROWS'
			? `${rowCodes.length > 1 ? 'ряды' : 'ряд'} ${joinCodes(rowCodes)}`
			: detail.target === 'CONTAINERS'
				? `${detail.targetContainerIds.length} ${plural(detail.targetContainerIds.length, ['контейнер', 'контейнера', 'контейнеров'])}`
				: 'весь рынок'

	// «2 мин» — how long the seller took to answer.
	const answerTime = (item: RequestHave) =>
		detail && item.answeredAt
			? formatDuration(Math.max(1, Math.round((new Date(item.answeredAt).getTime() - new Date(detail.createdAt).getTime()) / MINUTE)))
			: null
	const have = [...(data?.have ?? [])].sort((a, b) => (a.answeredAt ?? '').localeCompare(b.answeredAt ?? ''))

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>Статистика запроса</Text>
			</View>

			<ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner
					error={stats.error ?? request.error}
					onRetry={() => {
						stats.refetch()
						request.refetch()
					}}
					offlineText="Нет сети. Обновим статистику, когда появится"
				/>

				{detail ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 14, gap: 10 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<BrandLogo brand={detail.car.brand} size={32} />
							<View style={{ flex: 1, gap: 2 }}>
								<Text numberOfLines={2} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>
									{detail.text}
								</Text>
								<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
									{detail.car.modelLabel} · {detail.car.year} · {audience}
								</Text>
							</View>
						</View>
						{data ? (
							<CountdownBar
								expiresAt={data.expiresAt}
								durationMin={data.durationMin}
								now={now}
								closed={data.status === 'CLOSED'}
								onExtend={data.status === 'CLOSED' ? undefined : () => extend.mutate(30)}
								extendDisabled={!data.canExtend || extend.isPending}
							/>
						) : null}
					</View>
				) : null}

				{data ? <RequestStatsFunnel counts={data.counts} /> : null}

				{actionError ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{actionError.message}</Text> : null}

				{/* Time is up and the audience was narrowed — offer the whole market. */}
				{data && data.status === 'EXPIRED' && detail && detail.target !== 'MARKET' ? (
					<Button label="Отправить всему рынку" variant="secondary" height={48} loading={widen.isPending} onPress={() => widen.mutate('MARKET')} />
				) : null}

				{have.length ? (
					<>
						<SectionHeader title={`Есть · ${have.length}`} hint="по времени ответа" />
						<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 4, paddingHorizontal: 14 }}>
							{have.map((item, i) => {
								const time = answerTime(item)
								return (
									<View
										key={item.shop.id}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: 12,
											paddingVertical: 10,
											borderBottomWidth: i < have.length - 1 ? 1.5 : 0,
											borderBottomColor: c.surface,
										}}
									>
										{item.shop.avatarUrl ? (
											<Image source={{ uri: resolveUrl(item.shop.avatarUrl) }} style={{ width: 40, height: 40, borderRadius: 20 }} />
										) : (
											<View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
												<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>{item.shop.name.slice(0, 1)}</Text>
											</View>
										)}
										<View style={{ flex: 1, gap: 2 }}>
											<Text numberOfLines={2} style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>
												{item.shop.name}
											</Text>
											<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
												{[item.row ? `Ряд ${item.row}` : null, item.container ? `Конт. ${item.container}` : null, time]
													.filter(Boolean)
													.join(' · ')}
											</Text>
										</View>
										{/* Short «3 200 с» — the row is tight. */}
										{item.price ? <Text style={{ fontSize: 15, fontFamily: fontFamily(800), color: c.ink }}>{formatNumber(item.price)} с</Text> : null}
										{item.chatId ? (
											<Pressable
												onPress={() => router.push({ pathname: '/chat', params: { chatId: String(item.chatId) } })}
												style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}
											>
												<ChatIcon size={18} color={c.brandStrong} strokeWidth={2.2} />
											</Pressable>
										) : null}
									</View>
								)
							})}
						</View>
					</>
				) : null}

				{data?.notHave.length ? (
					<>
						<SectionHeader title={`Нет · ${data.notHave.length}`} hint="ряд · контейнер" />
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
							{data.notHave.map((place, i) => (
								<View
									key={`${place.row}-${place.container}-${i}`}
									style={{ height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: c.card, justifyContent: 'center' }}
								>
									<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.inkSecondary }}>
										{[place.row, place.container].filter((part) => part !== null).join(' · ')}
									</Text>
								</View>
							))}
						</View>
					</>
				) : null}
			</ScrollView>

			<BuyerTabBar active="requests" />
		</View>
	)
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
			<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, textTransform: 'uppercase', color: c.muted }}>{title}</Text>
			<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{hint}</Text>
		</View>
	)
}
