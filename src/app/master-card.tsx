import { useState } from 'react'
import { Image, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BrandLogo, Button, Chip, QueryErrorBanner, SectionLabel, ServiceBadge } from '@/components/ui'
import { ChatIcon, ChevronLeftIcon, MapPinIcon, PhoneIcon, ShareIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDay, formatHours, plural } from '@/lib/format'
import { useOpenChat } from '@/api/chats'
import { useMasterByLink, useMasterPublic, useMasterReviews, useServiceTypes } from '@/api/services'
import { ORIGINS } from '@/store/useServiceDraft'
import { ComplainLink, ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'

/**
 * Master profile for the client — no mockup; built from the shop profile [30].
 * `id` (from an offer [37]) or `publicId` from a share link /m/{publicId}.
 */
export default function MasterCardScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ id?: string; publicId?: string; serviceRequestId?: string }>()
	const byId = useMasterPublic(Number(params.id) || 0)
	const byLink = useMasterByLink(params.publicId ?? '')
	const query = params.publicId ? byLink : byId
	const master = query.data
	const reviews = useMasterReviews(master?.id ?? 0)
	const types = useServiceTypes().data
	const openChat = useOpenChat()
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)

	const cover = master?.photos[0]
	const open = master?.open
	const openLabel = open
		? open.openNow
			? `Открыт до ${formatHours(open.openTo)}`
			: open.opensAt
				? `Откроется ${formatHours(open.opensAt)}`
				: 'Закрыт'
		: ' '
	const origins = master?.origins.length
		? master.origins.map((o) => ORIGINS.find((x) => x.value === o)?.label ?? o).join(', ')
		: 'любые машины'

	const write = () =>
		master &&
		openChat.mutate(
			{ masterId: master.id, serviceRequestId: params.serviceRequestId ? Number(params.serviceRequestId) : undefined },
			{ onSuccess: (chat) => router.push({ pathname: '/chat', params: { chatId: String(chat.id) } }) }
		)

	const roundButton = { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center' as const, justifyContent: 'center' as const }

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
				<View style={{ height: 200 + insets.top, backgroundColor: raw.fill }}>
					{cover ? <Image source={{ uri: resolveUrl(cover.url) }} style={{ position: 'absolute', inset: 0 }} resizeMode="cover" /> : null}
					<View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
						<Pressable onPress={() => router.back()} style={roundButton}>
							<ChevronLeftIcon size={24} color={c.ink} />
						</Pressable>
						{master ? (
							<Pressable onPress={() => Share.share({ message: `${master.name}\nhttps://kudaibergen.kg/m/${master.publicId}` })} style={roundButton}>
								<ShareIcon size={20} color={c.ink} />
							</Pressable>
						) : null}
					</View>
				</View>

				<View style={{ marginTop: -44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
					{master?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(master.avatarUrl) }} style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: c.surface }} />
					) : (
						<View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.brandTint, borderWidth: 4, borderColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 32, fontFamily: fontFamily(700), color: c.brandStrong }}>{master?.name.charAt(0) ?? ' '}</Text>
						</View>
					)}
					<View style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: open?.openNow ? c.successTint : c.hairline, justifyContent: 'center' }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: open?.openNow ? c.success : c.muted }}>{openLabel}</Text>
					</View>
				</View>

				<View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 12 }}>
					<QueryErrorBanner error={query.error ?? openChat.error} onRetry={() => query.refetch()} />

					<View style={{ gap: 4 }}>
						<Text style={{ fontSize: 24, fontFamily: fontFamily(700), color: c.ink }}>{master?.name ?? ' '}</Text>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{master
								? master.reviewsCount
									? `★ ${master.rating.toFixed(1)} · ${master.reviewsCount} ${plural(master.reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}`
									: 'Новый мастер — отзывов пока нет'
								: ' '}
						</Text>
					</View>

					{master ? (
						<View style={{ flexDirection: 'row', gap: 8 }}>
							<Button
								label="Позвонить"
								variant="secondary"
								icon={PhoneIcon}
								height={48}
								style={{ flex: 1 }}
								disabled={!master.phone}
								onPress={() => master.phone && Linking.openURL(`tel:${master.phone}`)}
							/>
							<Button label="Написать" icon={ChatIcon} height={48} style={{ flex: 1.4 }} loading={openChat.isPending} onPress={write} />
						</View>
					) : null}

					{master ? (
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: c.card, padding: 14 }}>
							<MapPinIcon size={20} color={c.brandStrong} />
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>{master.address}</Text>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
									{master.mobile ? `Выезжает к клиенту · до ${master.radiusKm} км` : `Принимает в радиусе ${master.radiusKm} км`}
								</Text>
							</View>
						</View>
					) : null}

					{master?.services.length ? (
						<>
							<SectionLabel>Услуги</SectionLabel>
							<View style={{ gap: 8 }}>
								{master.services.map((service) => (
									<View key={service.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
										<ServiceBadge code={service.code} size={32} radius={9} />
										<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>
											{types.find((t) => t.code === service.code)?.name ?? service.name}
										</Text>
									</View>
								))}
							</View>
						</>
					) : null}

					{master ? (
						<>
							<SectionLabel>Марки и машины</SectionLabel>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
								{master.allBrands ? <Chip label="Все марки" height={34} radius={17} color={c.ink} /> : master.brands.map((brand) => <BrandLogo key={brand.id} brand={brand} size={34} />)}
							</View>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Откуда машины: {origins}</Text>
						</>
					) : null}

					{master && master.photos.length > 1 ? (
						<>
							<SectionLabel>Фото работ</SectionLabel>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
								{master.photos.map((photo) => (
									<Image key={photo.id} source={{ uri: resolveUrl(photo.thumbUrl) }} style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: raw.fill }} />
								))}
							</ScrollView>
						</>
					) : null}

					{master ? <SectionLabel>{`Отзывы · ${master.reviewsCount}`}</SectionLabel> : null}
					{(reviews.data ?? []).map((review) => (
						<Pressable
							key={review.id}
							onLongPress={() => setComplaint({ type: 'MASTER_REVIEW', targetId: review.id })}
							style={{ borderRadius: 14, backgroundColor: c.card, padding: 12, gap: 6 }}
						>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>
									{'★'.repeat(review.stars)}
									<Text style={{ color: raw.dashed }}>{'★'.repeat(5 - review.stars)}</Text>
								</Text>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{formatDay(review.createdAt)}</Text>
							</View>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.inkSecondary }}>
								{review.buyerName ?? 'Клиент'}
								{review.tags.length ? ` · ${review.tags.map((t) => t.label).join(', ')}` : ''}
							</Text>
						</Pressable>
					))}
					{reviews.isSuccess && !reviews.data.length ? (
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Отзывов пока нет</Text>
					) : null}
					{master ? <ComplainLink onPress={() => setComplaint({ type: 'MASTER', targetId: master.id })} label="Пожаловаться на мастера" /> : null}
				</View>
			</ScrollView>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</View>
	)
}
