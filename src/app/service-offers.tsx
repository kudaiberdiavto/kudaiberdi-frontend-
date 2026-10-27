import { useEffect, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { QueryErrorBanner, ServiceIcon } from '@/components/ui'
import { BackChevron, CallRow, SmallChip, offerWhen } from '@/components/master-v23'
import { ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { VoicePlayer } from '@/components/voice'
import { MediaStrip } from '@/components/media-strip'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDistance, formatNumber, minutesLeft, plural } from '@/lib/format'
import { useExtendServiceRequest, useServiceOffers, useServiceRequest, useServiceStats, useWidenServiceRequest } from '@/api/services'
import type { ServiceOffer } from '@/api/types'

type Sort = 'NEAR' | 'CHEAP' | 'TODAY'
const SORTS: { value: Sort; label: string }[] = [
	{ value: 'NEAR', label: 'Ближе' },
	{ value: 'CHEAP', label: 'Дешевле' },
	{ value: 'TODAY', label: 'Сегодня' },
]

const isToday = (offer: ServiceOffer, now: Date) =>
	!offer.availableAt || new Date(offer.availableAt).toDateString() === now.toDateString()

/** «ул. Лущихина · 600 м» / «выездной · 2 км». */
function offerPlace(offer: ServiceOffer) {
	const where = offer.master?.mobile ? 'выездной' : offer.master?.address.split(',')[0]
	return [where, formatDistance(offer.distanceM)].filter(Boolean).join(' · ')
}

/** 17 «Ответы мастеров» — the timer, sorting and the «Могу помочь» offers with «Позвонить». */
export default function ServiceOffersScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useServiceRequest(id)
	const stats = useServiceStats(id)
	const offers = useServiceOffers(id)
	const extend = useExtendServiceRequest(id)
	const widen = useWidenServiceRequest(id)
	const [sort, setSort] = useState<Sort>('NEAR')
	const [now, setNow] = useState(() => new Date())
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 15_000)
		return () => clearInterval(timer)
	}, [])

	const detail = request.data
	const data = stats.data
	const all = (offers.data ?? []).filter((offer) => offer.answer === 'CAN_HELP')
	const list = (sort === 'TODAY' ? all.filter((offer) => isToday(offer, now)) : [...all]).sort((a, b) =>
		sort === 'CHEAP' ? (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity) : a.distanceM - b.distanceM
	)
	const left = data ? minutesLeft(data.expiresAt, now) : 0
	const active = data?.status === 'ACTIVE' && left > 0
	const asked = data?.counts.delivered ?? detail?.recipientsCount ?? 0
	const answered = data?.counts.canHelp ?? all.length
	const title = detail ? detail.description.charAt(0).toUpperCase() + detail.description.slice(1) : ' '
	const actionError = extend.error ?? widen.error

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Pressable onPress={() => router.back()} hitSlop={10}>
					<BackChevron size={24} color={c.ink} />
				</Pressable>
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>
					{title}
				</Text>
				{detail ? (
					<View style={{ width: 34, height: 34, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
						<ServiceIcon code={detail.service.code} size={22} color={c.brandStrong} strokeWidth={2.2} />
					</View>
				) : null}
			</View>

			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16 + insets.bottom, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner
					error={request.error ?? stats.error ?? offers.error}
					onRetry={() => {
						request.refetch()
						stats.refetch()
						offers.refetch()
					}}
				/>

				{data ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
						<View
							style={{
								width: 20,
								height: 20,
								borderRadius: 10,
								backgroundColor: active ? '#E7F6EC' : c.surface,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: active ? c.success : c.border }} />
						</View>
						<View style={{ flex: 1, gap: 2 }}>
							<Text style={{ fontSize: 15, lineHeight: 19.5, fontFamily: fontFamily(700), color: c.ink }}>
								{active
									? `Ищем ещё ${left} ${plural(left, ['минуту', 'минуты', 'минут'])}`
									: data.status === 'CLOSED'
										? 'Заявка закрыта'
										: 'Время вышло'}
							</Text>
							<Text style={{ fontSize: 13.5, lineHeight: 17.5, fontFamily: fontFamily(400), color: c.muted }}>
								Спросили {asked} {plural(asked, ['мастера', 'мастеров', 'мастеров'])} · ответили {answered}
							</Text>
						</View>
						{/* Time is up: wait longer, or (nobody answered) look further away. */}
						{!active && data.status !== 'CLOSED' && (data.canExtend || detail?.canWiden) ? (
							<Pressable
								disabled={extend.isPending || widen.isPending}
								onPress={() => (answered || !detail?.canWiden ? extend.mutate(30) : widen.mutate(undefined))}
								style={{ height: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.brandTint, justifyContent: 'center' }}
							>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>
									{answered || !detail?.canWiden ? 'Ещё 30 мин' : `+5 км`}
								</Text>
							</Pressable>
						) : null}
					</View>
				) : null}
				{actionError ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{actionError.message}</Text> : null}

				{/* What the buyer attached — voice, photos, videos — not in the mockup, but they should see what they sent. */}
				{detail?.voice || detail?.media.length ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 8 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Ваша заявка</Text>
						{detail.voice ? <VoicePlayer voice={detail.voice} /> : null}
						<MediaStrip media={detail.media} />
					</View>
				) : null}

				<View style={{ flexDirection: 'row', gap: 8 }}>
					{SORTS.map((option) => {
						const selected = option.value === sort
						return (
							<Pressable
								key={option.value}
								onPress={() => setSort(option.value)}
								style={{
									height: 36,
									paddingHorizontal: 14,
									borderRadius: 18,
									backgroundColor: selected ? c.brand : c.card,
									borderWidth: selected ? 0 : 1.5,
									borderColor: c.border,
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: selected ? '#FFFFFF' : c.ink }}>{option.label}</Text>
							</Pressable>
						)
					})}
				</View>

				{list.map((offer, index) => (
					<OfferCard
						key={offer.id}
						offer={offer}
						best={index === 0}
						onComplain={() => setComplaint({ type: 'SERVICE_OFFER', targetId: offer.id, relatedServiceRequestId: id })}
					/>
				))}

				{offers.isSuccess && list.length === 0 ? (
					<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center', paddingVertical: 24 }}>
						{all.length
							? 'На сегодня никто не свободен — посмотрите все ответы'
							: active
								? 'Ждём ответы мастеров. Пришлём пуш, как только кто-то ответит.'
								: 'Никто не ответил. Подождите ещё или поищите дальше.'}
					</Text>
				) : null}
			</ScrollView>

			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</View>
	)
}

/** An offer [17]: avatar, name, place, «от 1 500 сом», time and note chips, «Позвонить» · chat · route. */
function OfferCard({ offer, best, onComplain }: { offer: ServiceOffer; best: boolean; onComplain: () => void }) {
	const c = useColors()
	const master = offer.master
	const name = master?.name ?? 'Мастер'
	const when = offerWhen(offer.availableAt, new Date(offer.createdAt))
	return (
		<Pressable
			onLongPress={onComplain}
			delayLongPress={450}
			style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10, borderWidth: 2, borderColor: best ? c.success : c.card }}
		>
			<Pressable
				onPress={master ? () => router.push({ pathname: '/master-card', params: { id: String(master.id) } }) : undefined}
				style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
			>
				{master?.avatarUrl ? (
					<Image source={{ uri: resolveUrl(master.avatarUrl) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
				) : (
					<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.brandStrong }}>{name.replace(/^(СТО|Мастер)\s*«?/, '').slice(0, 1)}</Text>
					</View>
				)}
				<View style={{ flex: 1, gap: 2 }}>
					<Text numberOfLines={1} style={{ fontSize: 16, lineHeight: 20.8, fontFamily: fontFamily(700), color: c.ink }}>
						{name}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: 13.5, lineHeight: 17.5, fontFamily: fontFamily(400), color: c.muted }}>
						{offerPlace(offer)}
					</Text>
				</View>
				{offer.priceFrom ? (
					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontSize: 22, lineHeight: 28.6, fontFamily: fontFamily(800), letterSpacing: -0.22, color: c.ink }}>
							<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: c.muted, letterSpacing: 0 }}>от </Text>
							{formatNumber(offer.priceFrom)}
						</Text>
						<Text style={{ fontSize: 12, lineHeight: 15.6, fontFamily: fontFamily(600), color: c.muted }}>сом</Text>
					</View>
				) : null}
			</Pressable>
			{when || offer.message ? (
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
					{when ? <SmallChip label={when} tone="green" /> : null}
					{offer.message ? <SmallChip label={offer.message} tone="grey" /> : null}
				</View>
			) : null}
			<CallRow
				onCall={master?.phone ? () => Linking.openURL(`tel:${master.phone}`) : undefined}
				onChat={offer.chatId ? () => router.push({ pathname: '/chat', params: { chatId: String(offer.chatId) } }) : undefined}
				// 2GIS: a route from here to the master's point (opens the 2GIS app if installed).
				onRoute={master ? () => Linking.openURL(`https://2gis.kg/bishkek/directions/points/%7C${master.lng}%2C${master.lat}`) : undefined}
			/>
		</Pressable>
	)
}
