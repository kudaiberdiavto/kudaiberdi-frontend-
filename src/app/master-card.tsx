import { useState } from 'react'
import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BrandLogo, Button, Chip, QueryErrorBanner, SectionLabel, ServiceBadge, Skeleton, MoreButton } from '@/components/ui'
import { ChatIcon, ChevronLeftIcon, MapPinIcon, PhoneIcon, ShareIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDay, plural } from '@/lib/format'
import { useOpenChat } from '@/api/chats'
import { useMasterByLink, useMasterPublic, useMasterReviews, useServiceTypes } from '@/api/services'
import { ORIGINS } from '@/store/useServiceDraft'
import { ComplainLink, ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { t } from '@/i18n'

/** Filled rating stars — gold, the empty ones stay grey. */
const STAR = '#F5A623'

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
	const loading = !master && query.isLoading
	const reviews = useMasterReviews(master?.id ?? 0)
	// Only reviews with tags — a bare rating is in the ★ average at the top.
	const commented = (reviews.data ?? []).filter((review) => review.tags.length > 0)
	const types = useServiceTypes().data
	const openChat = useOpenChat()
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)

	const cover = master?.photos[0]
	const origins = master?.origins.length
		? master.origins.map((o) => ORIGINS.find((x) => x.value === o)?.label ?? o).join(', ')
		: t('любые машины')

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
					{loading ? <Skeleton height="100%" radius={0} style={{ position: 'absolute' }} /> : null}
					{cover ? <Image source={{ uri: resolveUrl(cover.url) }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" /> : null}
					<View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
						<Pressable accessibilityRole="button" accessibilityLabel={t('Назад')} onPress={() => router.back()} style={roundButton}>
							<ChevronLeftIcon size={24} color={c.ink} />
						</Pressable>
						{master ? (
							<Pressable accessibilityRole="button" accessibilityLabel={t('Поделиться')} onPress={() => Share.share({ message: `${master.name}\nhttps://kudaibergen.kg/m/${master.publicId}` })} style={roundButton}>
								<ShareIcon size={20} color={c.ink} />
							</Pressable>
						) : null}
					</View>
				</View>

				<View style={{ marginTop: -44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
					{master?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(master.avatarUrl) }} style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: c.surface }} />
					) : loading ? (
						<View style={{ borderRadius: 48, borderWidth: 4, borderColor: c.surface }}>
							<Skeleton width={80} height={80} radius={40} />
						</View>
					) : (
						<View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.brandTint, borderWidth: 4, borderColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 32, fontFamily: fontFamily(700), color: c.brandStrong }}>{master?.name.charAt(0) ?? ' '}</Text>
						</View>
					)}
				</View>

				<View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 12 }}>
					<QueryErrorBanner error={query.error ?? openChat.error} onRetry={() => query.refetch()} />

					<View style={{ gap: 4, display: loading ? 'none' : 'flex' }}>
						<Text style={{ fontSize: 24, fontFamily: fontFamily(700), color: c.ink }}>{master?.name ?? ' '}</Text>
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>
							{master
								? master.reviewsCount
									? <><Text style={{ color: STAR }}>★</Text>{` ${master.rating.toFixed(1)} · ${master.reviewsCount} ${plural(master.reviewsCount, [t('оценка'), t('оценки'), t('оценок')])}`}</>
									: null
								: ' '}
						</Text>
					</View>

					{loading ? (
						<View style={{ gap: 12 }}>
							<Skeleton width="60%" height={26} />
							<Skeleton width="40%" height={15} />
							<View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
								<Skeleton width="auto" height={48} radius={14} style={{ flex: 1 }} />
								<Skeleton width="auto" height={48} radius={14} style={{ flex: 1.4 }} />
							</View>
							<Skeleton height={68} radius={14} />
							<Skeleton width={90} height={14} style={{ marginTop: 4 }} />
							{[0, 1, 2].map((i) => (
								<View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
									<Skeleton width={32} height={32} radius={9} />
									<Skeleton width={[140, 110, 160][i]} height={16} />
								</View>
							))}
						</View>
					) : null}

					{master ? (
						<View style={{ flexDirection: 'row', gap: 8 }}>
							<Button
								label={t('Позвонить')}
								variant="success"
								icon={PhoneIcon}
								height={48}
								style={{ flex: 1 }}
								disabled={!master.phone}
								onPress={() => master.phone && Linking.openURL(`tel:${master.phone}`)}
							/>
							<Button label={t('Написать')} variant="success" icon={ChatIcon} height={48} style={{ flex: 1.4 }} loading={openChat.isPending} onPress={write} />
						</View>
					) : null}

					{master ? (
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: c.card, padding: 14 }}>
							<MapPinIcon size={20} color={c.brandStrong} />
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.ink }}>{master.address}</Text>
								<Text style={{ fontSize: 14.5, fontFamily: fontFamily(400), color: c.muted }}>
									{master.mobile ? t('Выезжает к клиенту · до {0} км', master.radiusKm) : t('Принимает в радиусе {0} км', master.radiusKm)}
								</Text>
							</View>
						</View>
					) : null}

					{master?.services.length ? (
						<>
							<SectionLabel>{t('Услуги')}</SectionLabel>
							<View style={{ gap: 8 }}>
								{master.services.map((service) => (
									<View key={service.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
										<ServiceBadge code={service.code} size={32} radius={9} />
										<Text style={{ fontSize: 16.5, fontFamily: fontFamily(600), color: c.ink }}>
											{types.find((t) => t.code === service.code)?.name ?? service.name}
										</Text>
									</View>
								))}
							</View>
						</>
					) : null}

					{master ? (
						<>
							<SectionLabel>{t('Марки и машины')}</SectionLabel>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
								{master.allBrands ? <Chip label={t('Все марки')} height={34} radius={17} color={c.ink} /> : master.brands.map((brand) => <BrandLogo key={brand.id} brand={brand} size={34} />)}
							</View>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>{t('Откуда машины: {0}', origins)}</Text>
						</>
					) : null}

					{master && master.photos.length > 1 ? (
						<>
							<SectionLabel>{t('Фото работ')}</SectionLabel>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
								{master.photos.map((photo) => (
									<Image key={photo.id} source={{ uri: resolveUrl(photo.thumbUrl) }} style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: raw.fill }} />
								))}
							</ScrollView>
						</>
					) : null}

					{master && commented.length ? <SectionLabel>{t('Отзывы · {0}', commented.length)}</SectionLabel> : null}
					{commented.map((review) => (
						<Pressable
							key={review.id}
							onLongPress={() => setComplaint({ type: 'MASTER_REVIEW', targetId: review.id })}
							style={{ borderRadius: 14, backgroundColor: c.card, padding: 12, gap: 6 }}
						>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: STAR }}>
									{'★'.repeat(review.stars)}
									<Text style={{ color: raw.dashed }}>{'★'.repeat(5 - review.stars)}</Text>
								</Text>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
									<Text style={{ fontSize: 14.5, fontFamily: fontFamily(400), color: c.muted }}>{formatDay(review.createdAt)}</Text>
									<MoreButton label={t('Пожаловаться на отзыв')} onPress={() => setComplaint({ type: 'MASTER_REVIEW', targetId: review.id })} />
								</View>
							</View>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>
								{review.buyerName ?? t('Клиент')}
								{review.tags.length ? ` · ${review.tags.map((t) => t.label).join(', ')}` : ''}
							</Text>
						</Pressable>
					))}
					{master ? <ComplainLink onPress={() => setComplaint({ type: 'MASTER', targetId: master.id })} label={t('Пожаловаться на мастера')} /> : null}
				</View>
			</ScrollView>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</View>
	)
}
