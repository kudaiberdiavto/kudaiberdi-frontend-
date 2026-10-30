import { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { EmptyState, QueryErrorBanner, Screen, ServiceIcon } from '@/components/ui'
import { RequestsIcon } from '@/components/icons'
import { VoicePlayer } from '@/components/voice'
import { MediaGallery, MediaStrip } from '@/components/media-strip'
import { RequestFrom, isPlaceholderText } from '@/components/request-from'
import { CheckMark, MicOutline, UrgentChip, myOfferLine } from '@/components/master-v23'
import { AccountStatusBanner } from '@/components/account-status-banner'
import { fontFamily, raw, useColors } from '@/theme'
import { formatAgo, formatDistance, formatPrice, minutesLeft } from '@/lib/format'
import { markServiceSeen, serviceName, useMasterFeed, useMasterOffer, useMyMaster, useServiceTypes } from '@/api/services'
import { flattenPages } from '@/api/pagination'
import { useMyRequests } from '@/api/requests'
import { LoupeIcon } from '@/components/buyer-v23'
import type { MasterFeedItem } from '@/api/types'

/** 18 «Заявки» — new requests and the ones already answered; reply by voice, «Не моё» or «Могу помочь». */
export default function MasterRequestsScreen() {
	const c = useColors()
	const types = useServiceTypes().data
	const profile = useMyMaster()
	const fresh = useMasterFeed('NEW')
	const answered = useMasterFeed('ANSWERED')
	const offer = useMasterOffer()
	const items = useMemo(() => [...flattenPages(fresh.data), ...flattenPages(answered.data)], [fresh.data, answered.data])
	const [now, setNow] = useState(() => new Date())
	// A master or СТО also buys parts — for a client's car [04]; their active part requests are here.
	const partRequests = flattenPages(useMyRequests('ACTIVE').data)

	// The master saw the card — once per request, for the buyer's «ответили» [17].
	const seen = useRef(new Set<number>())
	useEffect(() => {
		for (const item of items) {
			if (item.seen || seen.current.has(item.id)) continue
			seen.current.add(item.id)
			markServiceSeen(item.id)
		}
	}, [items])

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 30_000)
		return () => clearInterval(timer)
	}, [])

	// First master entry: fill the profile before the feed.
	if (profile.isSuccess && !profile.data) return <Redirect href={{ pathname: '/master-profile', params: { first: '1' } }} />

	const answer = (item: MasterFeedItem, record: boolean) =>
		router.push({ pathname: '/master-answer', params: { id: String(item.id), ...(record ? { record: '1' } : {}) } })

	const header = (
		<View style={{ gap: 10, paddingBottom: 4 }}>
			<View style={{ height: 60, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Text style={{ flex: 1, fontSize: 26, fontFamily: fontFamily(700), color: c.ink }}>Заявки</Text>
			</View>
			<Pressable
				onPress={() => router.push('/search-part')}
				style={{ borderRadius: 16, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
			>
				<View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<LoupeIcon size={20} color={c.brandStrong} />
				</View>
				<View style={{ flex: 1, gap: 2 }}>
					<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>Нужна запчасть?</Text>
				</View>
			</Pressable>
			{partRequests.map((request) => (
				<Pressable
					key={request.id}
					onPress={() => router.push({ pathname: '/request', params: { id: String(request.id) } })}
					style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, gap: 2 }}
				>
					<Text numberOfLines={1} style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.ink }}>
						{request.text} · {request.carLabel}
					</Text>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: request.haveCount ? c.success : c.muted }}>
						{request.haveCount
							? `${request.haveCount} есть${request.minPrice != null ? ` · от ${formatPrice(request.minPrice)}` : ''}`
							: `Ищем ещё ${minutesLeft(request.expiresAt)} мин`}
					</Text>
				</Pressable>
			))}
			{/* Requests reach only ACTIVE masters — say why the feed is empty. */}
			<AccountStatusBanner
				status={profile.data?.status}
				reason={profile.data?.blockReason}
				kind="master"
				action={{ label: 'Изменить профиль', onPress: () => router.push('/master-profile') }}
			/>
			<QueryErrorBanner error={fresh.error ?? answered.error ?? offer.error} onRetry={() => (fresh.refetch(), answered.refetch())} />
		</View>
	)

	return (
		<Screen>
			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				ListHeaderComponent={header}
				contentContainerStyle={{ flexGrow: 1, gap: 10, paddingBottom: 16 }}
				ListEmptyComponent={
					fresh.isSuccess && answered.isSuccess ? (
						<EmptyState title="Новых заявок нет" icon={RequestsIcon} />
					) : null
				}
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					if (fresh.hasNextPage && !fresh.isFetchingNextPage) fresh.fetchNextPage()
					else if (answered.hasNextPage && !answered.isFetchingNextPage) answered.fetchNextPage()
				}}
				onRefresh={() => (fresh.refetch(), answered.refetch())}
				refreshing={false}
				renderItem={({ item }) => (
					<RequestCard
						item={item}
						title={serviceName(types, item.service.code)}
						open={minutesLeft(item.expiresAt, now) > 0}
						now={now}
						onVoice={() => answer(item, true)}
						onHelp={() => answer(item, false)}
						onSkip={() => offer.mutate({ id: item.id, body: { answer: 'NOT_MINE' } })}
					/>
				)}
			/>
		</Screen>
	)
}

/** A request card; `full` — on its own screen: photos and videos large, no tap-through. */
export function RequestCard({
	item,
	title,
	open,
	now,
	onVoice,
	onHelp,
	onSkip,
	full,
}: {
	full?: boolean
	item: MasterFeedItem
	title: string
	open: boolean
	now: Date
	onVoice: () => void
	onHelp: () => void
	onSkip: () => void
}) {
	const c = useColors()
	const car = [item.car.modelLabel, item.car.year].filter(Boolean).join(' · ') || item.car.label
	const meta = [car, formatDistance(item.distanceM), formatAgo(item.notifiedAt, { short: true, now })].join(' · ')
	const mine = item.myOffer

	return (
		<Pressable
			disabled={full}
			onPress={() => router.push({ pathname: '/master-request', params: { id: String(item.id) } })}
			style={{ borderRadius: 20, backgroundColor: c.card, padding: 16, gap: 12 }}
		>
			<RequestFrom name={item.buyerName} fallback="Клиент" />
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<ServiceIcon code={item.service.code} size={26} color={c.brandStrong} strokeWidth={2.2} />
				</View>
				<View style={{ flex: 1, gap: 2 }}>
					<Text numberOfLines={1} style={{ fontSize: 19, lineHeight: 24, fontFamily: fontFamily(700), color: c.ink }}>
						{title}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
						{meta}
					</Text>
				</View>
				{item.urgent ? <UrgentChip /> : null}
			</View>

			<View style={{ gap: 6 }}>
				{isPlaceholderText(item.description) ? null : (
					<Text style={{ fontSize: 17.5, lineHeight: 23, fontFamily: fontFamily(600), color: c.ink }}>{item.description}</Text>
				)}
				{item.voice ? <VoicePlayer voice={item.voice} /> : null}
				{full ? <MediaGallery media={item.media} /> : <MediaStrip media={item.media} />}
			</View>

			{mine ? (
				<View
					style={{
						minHeight: 44,
						borderRadius: 12,
						backgroundColor: mine.answer === 'CAN_HELP' ? '#E7F6EC' : c.surface,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 6,
						paddingHorizontal: 10,
					}}
				>
					{mine.answer === 'CAN_HELP' ? <CheckMark size={18} color={c.success} strokeWidth={2.8} /> : null}
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: mine.answer === 'CAN_HELP' ? c.success : c.muted }}>
						{mine.answer === 'CAN_HELP' ? myOfferLine(mine.priceFrom, mine.availableAt, mine.createdAt) : 'Вы ответили «Не моё»'}
					</Text>
				</View>
			) : !open ? (
				<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.muted, textAlign: 'center', paddingVertical: 12 }}>Время на ответ вышло</Text>
			) : (
				<>
					<Pressable
						onPress={onVoice}
						style={{
							height: 56,
							borderRadius: 14,
							backgroundColor: c.brand,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 10,
							shadowColor: c.brand,
							shadowOpacity: 0.25,
							shadowOffset: { width: 0, height: 6 },
							shadowRadius: 14,
							elevation: 4,
						}}
					>
						<View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
							<MicOutline size={20} color="#FFFFFF" />
						</View>
						<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Ответить голосом</Text>
					</Pressable>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable onPress={onSkip} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: raw.fill, alignItems: 'center', justifyContent: 'center' }}>
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>Не моё</Text>
						</Pressable>
						<Pressable
							onPress={onHelp}
							style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: '#E7F6EC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<CheckMark size={20} color={c.success} />
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.success }}>Могу помочь</Text>
						</Pressable>
					</View>
				</>
			)}
		</Pressable>
	)
}
