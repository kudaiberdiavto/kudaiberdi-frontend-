import { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { haptic } from '@/lib/haptics'
import { Image } from '@/components/ui/image'
import { Redirect, router, useScrollToTop } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { usePullRefresh } from '@/lib/use-pull-refresh'
import { EmptyState, QueryErrorBanner, Screen, ServiceIcon, SkeletonRepeat, SkeletonRequestCard } from '@/components/ui'
import { RequestsIcon } from '@/components/icons'
import { VoicePlayer } from '@/components/voice'
import { MediaGallery, MediaStrip } from '@/components/media-strip'
import { isPlaceholderText } from '@/components/request-text'
import { CheckMark, MicOutline, UrgentChip, myOfferLine } from '@/components/master-v23'
import { AccountStatusBanner } from '@/components/account-status-banner'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { formatAgo, formatDistance, formatPrice, minutesLeft } from '@/lib/format'
import { markServiceSeen, serviceName, useMasterFeed, useMasterOffer, useMyMaster, useServiceTypes } from '@/api/services'
import { flattenPages } from '@/api/pagination'
import { resolveUrl } from '@/lib/api'
import { useMyRequests } from '@/api/requests'
import { LoupeIcon } from '@/components/buyer-v23'
import type { MasterFeedItem } from '@/api/types'
import { t } from '@/i18n'

/** 18 «Заявки» — new requests and the ones already answered; reply by voice, «Не моё» or «Могу помочь». */
export default function MasterRequestsScreen() {
	const c = useColors()
	// Tapping the active tab again scrolls back to the top, as in every app.
	const list = useRef<FlatList<MasterFeedItem>>(null)
	useScrollToTop(list)
	const types = useServiceTypes().data
	const profile = useMyMaster()
	const fresh = useMasterFeed('NEW')
	const answered = useMasterFeed('ANSWERED')
	const offer = useMasterOffer()
	const pull = usePullRefresh(() => [fresh.refetch(), answered.refetch()])
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

	const sectionStyle = { fontSize: fs.sm, fontFamily: fontFamily(700), letterSpacing: 1.04, textTransform: 'uppercase', color: c.muted } as const

	const answer = (item: MasterFeedItem, record: boolean) =>
		router.push({ pathname: '/master-answer', params: { id: String(item.id), ...(record ? { record: '1' } : {}) } })

	const header = (
		<View style={{ gap: 10, paddingBottom: 4 }}>
			<View style={{ height: 60, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Text style={{ flex: 1, fontSize: fs.h1, fontFamily: fontFamily(700), color: c.ink }}>{t('Заявки')}</Text>
			</View>
			{/* A part for a client's car — the same big banner as the buyer's «Найти запчасть». */}
			<Pressable onPress={() => router.push('/search-part')}>
				<LinearGradient
					colors={fixed.brandGradient}
					start={{ x: 0.25, y: 0 }}
					end={{ x: 0.75, y: 1 }}
					style={{
						height: 108,
						borderRadius: 24,
						paddingHorizontal: 18,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 14,
						overflow: 'hidden',
						shadowColor: fixed.brandShadow,
						shadowOpacity: 0.32,
						shadowOffset: { width: 0, height: 14 },
						shadowRadius: 15,
						elevation: 12,
					}}
				>
					<View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
						<LoupeIcon size={24} color={fixed.white} strokeWidth={2.6} />
					</View>
					<View style={{ flex: 1, gap: 3 }}>
						<Text style={{ fontSize: fs.h3, lineHeight: 29, fontFamily: fontFamily(800), letterSpacing: -0.4, color: fixed.white }}>{t('Нужна запчасть?')}</Text>
						<Text style={{ fontSize: fs.md, lineHeight: 20, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.88)' }}>{t('Для машины клиента — продавцы ответят с ценой')}</Text>
					</View>
				</LinearGradient>
			</Pressable>
			{/* The master's own part requests — a separate, labelled block so they don't mix with clients' requests. */}
			{partRequests.length ? <Text style={[sectionStyle, { marginTop: 8 }]}>{t('Мои запросы запчастей')}</Text> : null}
			{partRequests.map((request) => (
				<Pressable
					key={request.id}
					onPress={() => router.push({ pathname: '/request', params: { id: String(request.id) } })}
					style={{ borderRadius: 16, backgroundColor: c.card, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
				>
					{request.thumbUrl ? (
						<Image source={{ uri: resolveUrl(request.thumbUrl) }} style={{ width: 48, height: 48, borderRadius: 12 }} />
					) : (
						<View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<LoupeIcon size={22} color={c.brandStrong} strokeWidth={2.4} />
						</View>
					)}
					<View style={{ flex: 1, gap: 2 }}>
						<Text numberOfLines={1} style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.ink }}>
							{request.text}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: request.haveCount ? c.success : c.muted }}>
							{request.haveCount
								? t('{0} есть', request.haveCount) + (request.minPrice != null ? t(' · от {0}', formatPrice(request.minPrice)) : '')
								: t('Ищем ещё {0} мин', minutesLeft(request.expiresAt))}
							<Text style={{ color: c.muted, fontFamily: fontFamily(400) }}> · {request.carLabel}</Text>
						</Text>
					</View>
				</Pressable>
			))}
			{/* Requests reach only ACTIVE masters — say why the feed is empty. */}
			<AccountStatusBanner
				status={profile.data?.status}
				reason={profile.data?.blockReason}
				kind="master"
				action={{ label: t('Изменить профиль'), onPress: () => router.push('/master-profile') }}
			/>
			<QueryErrorBanner error={fresh.error ?? answered.error ?? offer.error} onRetry={() => (fresh.refetch(), answered.refetch())} />
			<Text style={[sectionStyle, { marginTop: 8 }]}>{t('Заявки от клиентов')}</Text>
		</View>
	)

	return (
		<Screen>
			<FlatList
				ref={list}
				data={items}
				keyExtractor={(item) => String(item.id)}
				ListHeaderComponent={header}
				contentContainerStyle={{ flexGrow: 1, gap: 10, paddingBottom: 16 }}
				ListEmptyComponent={
					fresh.isSuccess && answered.isSuccess ? (
						<EmptyState title={t('Пока заявок нет')} icon={RequestsIcon} />
					) : fresh.isLoading ? (
						<SkeletonRepeat count={4} gap={10}>
							<SkeletonRequestCard actions={2} />
						</SkeletonRepeat>
					) : undefined
				}
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					if (fresh.hasNextPage && !fresh.isFetchingNextPage) fresh.fetchNextPage()
					else if (answered.hasNextPage && !answered.isFetchingNextPage) answered.fetchNextPage()
				}}
				onRefresh={pull.onRefresh}
				refreshing={pull.refreshing}
				renderItem={({ item }) => (
					<RequestCard
						item={item}
						title={serviceName(types, item.service.code)}
						open={minutesLeft(item.expiresAt, now) > 0}
						now={now}
						onVoice={() => answer(item, true)}
						onHelp={() => answer(item, false)}
						onSkip={() => (haptic.tap(), offer.mutate({ id: item.id, body: { answer: 'NOT_MINE' } }))}
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
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<ServiceIcon code={item.service.code} size={26} color={c.brandStrong} strokeWidth={2.2} />
				</View>
				<View style={{ flex: 1, gap: 2 }}>
					<Text numberOfLines={1} style={{ fontSize: fs.xl, lineHeight: 24, fontFamily: fontFamily(700), color: c.ink }}>
						{title}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: fs.md, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
						<Text style={{ fontFamily: fontFamily(600), color: c.inkSecondary }}>{item.buyerName?.trim() || t('Клиент')}</Text> · {meta}
					</Text>
				</View>
				{item.urgent ? <UrgentChip /> : null}
			</View>

			<View style={{ gap: 6 }}>
				{isPlaceholderText(item.description) ? null : (
					<Text style={{ fontSize: fs.lg, lineHeight: 23, fontFamily: fontFamily(600), color: c.ink }}>{item.description}</Text>
				)}
				{item.voice ? <VoicePlayer voice={item.voice} /> : null}
				{full ? <MediaGallery media={item.media} /> : <MediaStrip media={item.media} />}
			</View>

			{mine ? (
				<View
					style={{
						minHeight: 44,
						borderRadius: 12,
						backgroundColor: mine.answer === 'CAN_HELP' ? c.successSoft : c.surface,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 6,
						paddingHorizontal: 10,
					}}
				>
					{mine.answer === 'CAN_HELP' ? <CheckMark size={18} color={c.success} strokeWidth={2.8} /> : null}
					<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: mine.answer === 'CAN_HELP' ? c.success : c.muted }}>
						{mine.answer === 'CAN_HELP' ? myOfferLine(mine.priceFrom, mine.availableAt, mine.createdAt) : t('Вы ответили «Не моё»')}
					</Text>
				</View>
			) : !open ? (
				<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: c.muted, textAlign: 'center', paddingVertical: 12 }}>{t('Время на ответ вышло')}</Text>
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
							<MicOutline size={20} color={fixed.white} />
						</View>
						<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(700), color: fixed.white }}>{t('Ответить голосом')}</Text>
					</Pressable>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable onPress={onSkip} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>{t('Не моё')}</Text>
						</Pressable>
						<Pressable
							onPress={onHelp}
							style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.successSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<CheckMark size={20} color={c.success} />
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.success }}>{t('Могу помочь')}</Text>
						</Pressable>
					</View>
				</>
			)}
		</Pressable>
	)
}
