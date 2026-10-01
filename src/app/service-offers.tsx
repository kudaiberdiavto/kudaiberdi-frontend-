import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, OfferCard, QueryErrorBanner, SectionLabel, ServiceBadge } from '@/components/ui'
import { BuyerTabBar } from '@/components/buyer-tab-bar'
import { ChevronLeftIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { formatDistance, formatDuration, formatNumber, formatWhenAt, minutesLeft, plural } from '@/lib/format'
import {
	serviceName,
	useExtendServiceRequest,
	useServiceOffers,
	useServiceRequest,
	useServiceStats,
	useServiceTypes,
	useWidenServiceRequest,
} from '@/api/services'
import type { ServiceOffer } from '@/api/types'
import { ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'

/** «★ 4.9 · 212 отзывов · 2,1 км» / «… · выезд · 3,4 км» */
function offerMeta(offer: ServiceOffer) {
	const master = offer.master
	if (!master) return formatDistance(offer.distanceM)
	return [
		master.reviewsCount ? `★ ${master.rating.toFixed(1)}` : 'новый',
		master.reviewsCount ? `${master.reviewsCount} ${plural(master.reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}` : null,
		master.mobile ? 'выезд' : null,
		formatDistance(offer.distanceM),
	]
		.filter(Boolean)
		.join(' · ')
}

/** 37 «Отклики мастеров»: who got it / saw / can help, the timer, and the «Могу помочь» offers. */
export default function ServiceOffersScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const types = useServiceTypes().data
	const request = useServiceRequest(id)
	const stats = useServiceStats(id)
	const offers = useServiceOffers(id)
	const extend = useExtendServiceRequest(id)
	const widen = useWidenServiceRequest(id)
	const [now, setNow] = useState(() => new Date())
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 15_000)
		return () => clearInterval(timer)
	}, [])

	const detail = request.data
	const data = stats.data
	const list = (offers.data ?? []).filter((o) => o.answer === 'CAN_HELP')
	const left = data ? minutesLeft(data.expiresAt, now) : 0
	const active = data?.status === 'ACTIVE' && left > 0
	const progress = data && data.durationMin > 0 ? Math.min(1, left / data.durationMin) : 0
	const actionError = extend.error ?? widen.error

	const count = (label: string, value: number | undefined, color = c.inkSecondary) => (
		<Text style={{ fontSize: 13, lineHeight: 16, fontFamily: fontFamily(400), color, flexShrink: 1 }}>
			{label}
			{'\n'}
			<Text style={{ fontFamily: fontFamily(700) }}>{value ?? '–'}</Text>
		</Text>
	)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>Отклики мастеров</Text>
			</View>

			<ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner
					error={request.error ?? stats.error ?? offers.error}
					onRetry={() => {
						request.refetch()
						stats.refetch()
						offers.refetch()
					}}
				/>

				{detail ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<ServiceBadge code={detail.service.code} />
							<View style={{ flex: 1, gap: 1 }}>
								<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
									{serviceName(types, detail.service.code, true)} · {detail.description.charAt(0).toLowerCase() + detail.description.slice(1)}
								</Text>
								<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
									{detail.car.label}
								</Text>
							</View>
						</View>
						<View style={{ flexDirection: 'row', gap: 16 }}>
							{count('Получили', data?.counts.delivered)}
							{count('Посмотрели', data?.counts.seen)}
							{count('Могут', data?.counts.canHelp, c.success)}
							{count('Не их профиль', data?.counts.notMine)}
						</View>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
							<View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: raw.fill, overflow: 'hidden' }}>
								<View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: c.success }} />
							</View>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: active ? c.success : c.muted }}>
								{active ? `ещё ${formatDuration(left)}` : data?.status === 'CLOSED' ? 'закрыта' : 'время вышло'}
							</Text>
						</View>
					</View>
				) : null}

				{actionError ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{actionError.message}</Text> : null}

				{/* Time is up: extend, or (no offers) look further away. */}
				{data && detail && !active && data.status !== 'CLOSED' ? (
					<View style={{ flexDirection: 'row', gap: 8 }}>
						{data.canExtend ? (
							<Button label="+30 мин" variant="secondary" height={48} style={{ flex: 1 }} loading={extend.isPending} onPress={() => extend.mutate(30)} />
						) : null}
						{detail.canWiden ? (
							<Button
								label={`Радиус ${data.radiusKm + 5} км`}
								height={48}
								style={{ flex: 1.4 }}
								loading={widen.isPending}
								onPress={() => widen.mutate(undefined)}
							/>
						) : null}
					</View>
				) : null}

				{list.length ? (
					<>
						<SectionLabel>{`Могут помочь · ${list.length}`}</SectionLabel>
						{list.map((offer) => (
							<OfferCard
								key={offer.id}
								name={offer.master?.name ?? 'Мастер'}
								avatarUrl={offer.master?.avatarUrl ?? null}
								meta={offerMeta(offer)}
								price={offer.priceFrom ? `от ${formatNumber(offer.priceFrom)} с` : null}
								when={offer.availableAt ? formatWhenAt(offer.availableAt, now) : null}
								message={offer.message}
								onCall={offer.master?.phone ? () => Linking.openURL(`tel:${offer.master!.phone}`) : undefined}
								onWrite={offer.chatId ? () => router.push({ pathname: '/chat', params: { chatId: String(offer.chatId) } }) : undefined}
								onOpen={offer.master ? () => router.push({ pathname: '/master-card', params: { id: String(offer.master!.id) } }) : undefined}
								onComplain={() => setComplaint({ type: 'SERVICE_OFFER', targetId: offer.id, relatedServiceRequestId: id })}
							/>
						))}
					</>
				) : data && offers.isSuccess ? (
					<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center', paddingVertical: 24 }}>
						{active ? 'Ждём ответы мастеров. Пришлём пуш, как только кто-то откликнется.' : 'Никто не откликнулся. Продлите время или расширьте радиус.'}
					</Text>
				) : null}
			</ScrollView>

			{/* «Договорились» — close with the chosen master and rate them [09]. */}
			{list.length && data?.status !== 'CLOSED' ? (
				<View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: c.surface }}>
					<Button
						label="Договорились"
						variant="outline"
						height={48}
						onPress={() => router.push({ pathname: '/closed', params: { id: String(id), kind: 'service' } })}
					/>
				</View>
			) : null}

			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
			<BuyerTabBar active="requests" />
		</View>
	)
}
