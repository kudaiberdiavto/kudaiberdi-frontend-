import { useState } from 'react'
import { Linking, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from 'react-native'
import { onNearEnd } from '@/lib/scroll'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { LocationCard, QueryErrorBanner, Skeleton, SkeletonProductGrid, SkeletonRepeat } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { ChatIcon, ChevronLeftIcon, HeartIcon, MapPinIcon, PhoneIcon, ShareIcon, WhatsAppIcon } from '@/components/icons'
import { openWhatsApp } from '@/lib/whatsapp'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDay, formatSide, plural } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { usePublicShop, useShop, useShopParts, useShopReviews, useSignedIn, useToggleShopFavorite } from '@/api/catalog'
import { useOpenChat } from '@/api/chats'
import { ComplainLink, ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { open2gis, openShopRoute } from '@/lib/shop-place'
import { PartTile } from '@/components/catalog-screen'
import { t } from '@/i18n'

/** Filled rating stars — gold, the empty ones stay grey. */
const STAR = '#F5A623'

type Tab = 'parts' | 'reviews'
const VISIBLE_BRANDS = 4

/** 30 — shop profile for buyers. `id`, or `publicId` from a share link /s/{publicId}. */
export default function SellerProfileForBuyerScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const { width } = useWindowDimensions()
	const params = useLocalSearchParams<{ id?: string; publicId?: string }>()
	const signedIn = useSignedIn()
	const byId = useShop(Number(params.id) || 0)
	const byPublicId = usePublicShop(params.publicId ?? '')
	const query = params.publicId ? byPublicId : byId
	const shop = query.data
	const shopId = shop?.id ?? 0
	const loading = !shop && query.isLoading

	const [tab, setTab] = useState<Tab>('parts')
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)
	const [showAllBrands, setShowAllBrands] = useState(false)
	const parts = useShopParts(shopId)
	const reviews = useShopReviews(shopId, tab === 'reviews')
	const favorite = useToggleShopFavorite(shopId)
	const openChat = useOpenChat()

	const banner = shop?.photos[0]
	const partItems = flattenPages(parts.data)
	// Only reviews with something said (tags, the seller's reply) — a bare rating is in the ★ average above.
	const reviewItems = flattenPages(reviews.data).filter((review) => review.tags.length > 0 || review.reply)
	const brands = shop?.brands ?? []
	const counts = shop?.counts

	const route = () => shop && openShopRoute(shop)
	const write = () =>
		shop &&
		(signedIn
			? openChat.mutate({ shopId: shop.id }, { onSuccess: (chat) => router.push({ pathname: '/chat', params: { chatId: String(chat.id) } }) })
			: router.push('/'))

	const roundButton = { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' } as const

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={200}
				onScroll={onNearEnd(() => {
					const list = tab === 'parts' ? parts : reviews
					if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage()
				})}
			>
				<View>
					{/* One banner — the box's first photo; no gallery. */}
					{banner ? (
						<Image source={{ uri: resolveUrl(banner.url) }} style={{ width, height: 210 }} contentFit="cover" />
					) : loading ? (
						<Skeleton height={210} radius={0} />
					) : (
						<View style={{ width: '100%', height: 210, backgroundColor: raw.fill }} />
					)}
					<View
						style={{
							position: 'absolute',
							left: 16,
							right: 16,
							top: insets.top + 9,
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<Pressable accessibilityRole="button" accessibilityLabel={t('Назад')} onPress={() => router.back()} style={roundButton}>
							<ChevronLeftIcon size={24} color={c.ink} />
						</Pressable>
						<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
							{signedIn && shop ? (
								<Pressable accessibilityRole="button" accessibilityLabel={shop.isFavorite ? t('Убрать из избранного') : t('В избранное')} onPress={() => favorite.mutate(!shop.isFavorite)} style={roundButton}>
									<HeartIcon size={20} color={shop.isFavorite ? c.danger : c.ink} filled={shop.isFavorite} />
								</Pressable>
							) : null}
							{shop ? (
								<Pressable accessibilityRole="button" accessibilityLabel={t('Поделиться')}
									onPress={() => Share.share({ message: `${shop.name}\nhttps://kudaibergen.kg/s/${shop.publicId}` })}
									style={roundButton}
								>
									<ShareIcon size={20} color={c.ink} />
								</Pressable>
							) : null}
						</View>
					</View>
				</View>

				<View style={{ marginTop: -44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
					{shop?.avatarUrl ? (
						<Image
							source={{ uri: resolveUrl(shop.avatarUrl) }}
							style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: c.surface }}
						/>
					) : loading ? (
						<View style={{ borderRadius: 48, borderWidth: 4, borderColor: c.surface }}>
							<Skeleton width={80} height={80} radius={40} />
						</View>
					) : (
						<View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: raw.fill, borderWidth: 4, borderColor: c.surface }} />
					)}
				</View>

				<View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 14 }}>
					<QueryErrorBanner error={query.error} onRetry={() => query.refetch()} />

					{loading ? (
						<View style={{ gap: 10 }}>
							<Skeleton width="60%" height={24} />
							<Skeleton width="40%" height={15} />
						</View>
					) : (
					<View style={{ gap: 2 }}>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>{shop?.name ?? ' '}</Text>
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>
							{shop
								? shop.reviewsCount
									? <><Text style={{ color: STAR }}>★</Text>{` ${shop.rating.toFixed(1)} · ${shop.reviewsCount} ${plural(shop.reviewsCount, [t('оценка'), t('оценки'), t('оценок')])}`}</>
									: null
								: ' '}
						</Text>
					</View>
					)}

					{loading ? (
						<Skeleton height={128} radius={16} />
					) : (
					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 14 }}>
						{/* On the market — row and box; a shop / centre elsewhere — its address. */}
						{shop && !shop.location ? (
							<Text style={{ fontSize: 17.5, lineHeight: 23, fontFamily: fontFamily(600), color: c.ink }}>{shop.address}</Text>
						) : (
							<LocationCard rowLabel={shop?.location?.rowCode ?? ' '} boxLabel={shop?.location ? String(shop.location.number) : ' '} />
						)}
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.inkSecondary }}>
								{shop?.location ? t('{0} сторона', formatSide(shop.location.side)).replace(/^./, (ch) => ch.toUpperCase()) : shop ? t('Магазин') : ' '}
							</Text>
							<Pressable
								// The place in 2GIS — a market box shows the market itself.
								onPress={() => shop && open2gis({ lat: shop.lat, lng: shop.lng, address: shop.address ?? t('Рынок Кудайберген, Бишкек') })}
								style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: c.brandTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}
							>
								<MapPinIcon size={16} color={c.brandStrong} />
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('2ГИС')}</Text>
							</Pressable>
						</View>
					</View>
					)}

					{brands.length ? (
						<View style={{ gap: 8 }}>
							<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>{t('ПРОДАЁТ ДЛЯ МАРОК')}</Text>
							{showAllBrands ? (
								// all brands as chips: logo + name
								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
									{brands.map((brand) => (
										<View
											key={brand.id}
											style={{ height: 32, paddingLeft: 4, paddingRight: 10, borderRadius: 16, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 6 }}
										>
											<BrandLogo brand={brand} size={24} />
											<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.ink }}>{brand.name}</Text>
										</View>
									))}
								</View>
							) : (
								// a tap on the logos (or «+N») shows every brand
								<Pressable onPress={() => setShowAllBrands(true)} disabled={brands.length <= VISIBLE_BRANDS} style={{ flexDirection: 'row' }}>
									{brands.slice(0, VISIBLE_BRANDS).map((brand, i) => (
										<View key={brand.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
											<BrandLogo brand={brand} size={36} />
										</View>
									))}
									{brands.length > VISIBLE_BRANDS ? (
										<View
											style={{
												marginLeft: -8,
												height: 36,
												paddingHorizontal: 10,
												borderRadius: 18,
												backgroundColor: c.card,
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.brandStrong }}>+{brands.length - VISIBLE_BRANDS}</Text>
										</View>
									) : null}
								</Pressable>
							)}
						</View>
					) : null}

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable
							onPress={write}
							disabled={!shop || openChat.isPending}
							style={{ flex: 1, height: 48, paddingHorizontal: 10, borderRadius: 14, backgroundColor: c.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<ChatIcon size={20} color="#FFFFFF" />
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{t('Написать')}</Text>
						</Pressable>
						<Pressable
							onPress={route}
							style={{ flex: 1, height: 48, paddingHorizontal: 10, borderRadius: 14, backgroundColor: raw.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<MapPinIcon size={20} color={c.ink} />
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{shop && !shop.location ? t('2ГИС') : t('Маршрут')}</Text>
						</Pressable>
						{/* The phone, then WhatsApp at the edge — only when the shop made the number visible (or after a chat). */}
						{shop?.phone ? (
							<Pressable accessibilityRole="button" accessibilityLabel={t('Позвонить')}
								onPress={() => Linking.openURL(`tel:${shop.phone}`)}
								style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: raw.fill, alignItems: 'center', justifyContent: 'center' }}
							>
								<PhoneIcon size={20} color={c.ink} />
							</Pressable>
						) : null}
						{shop?.phone ? (
							<Pressable accessibilityRole="button" accessibilityLabel={t('Написать в WhatsApp')}
								onPress={() => shop.phone && openWhatsApp(shop.phone)}
								style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' }}
							>
								<WhatsAppIcon size={24} color="#FFFFFF" />
							</Pressable>
						) : null}
					</View>
					{openChat.error ? (
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{openChat.error.message}</Text>
					) : null}

					<View style={{ flexDirection: 'row', gap: 20 }}>
						{(
							[
								{ value: 'parts', label: t('Запчасти {0}', counts?.parts ?? '') },
								{ value: 'reviews', label: t('Отзывы') },
							] as const
						).map((item) => (
							<Pressable
								key={item.value}
								onPress={() => setTab(item.value)}
								style={{
									paddingBottom: 6,
									borderBottomWidth: 2,
									borderBottomColor: tab === item.value ? c.brand : 'transparent',
								}}
							>
								<Text
									style={{
										fontSize: 16.5,
										fontFamily: fontFamily(tab === item.value ? 700 : 600),
										color: tab === item.value ? c.ink : c.muted,
									}}
								>
									{item.label.trim()}
								</Text>
							</Pressable>
						))}
					</View>

					{tab === 'parts' ? (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 20, paddingBottom: 24 }}>
							{partItems.map((part) => (
								// the catalog's tile: a video part shows its poster with ▶ and opens the feed
								<View key={part.id} style={{ width: (width - 32 - 10) / 2 }}>
									<PartTile part={part} />
								</View>
							))}
							{parts.isFetchingNextPage ? (
								<View style={{ width: '100%' }}>
									<SkeletonProductGrid rows={1} gap={10} />
								</View>
							) : null}
							{loading || parts.isLoading ? (
								<View style={{ width: '100%' }}>
									<SkeletonProductGrid rows={2} gap={10} />
								</View>
							) : null}
							{parts.isSuccess && partItems.length === 0 ? (
								<Text style={{ fontSize: 16.5, fontFamily: fontFamily(400), color: c.muted }}>{t('Запчасти ещё не выложены')}</Text>
							) : null}
						</View>
					) : null}

					{tab === 'reviews' ? (
						<View style={{ gap: 10, paddingBottom: 24 }}>
							{reviews.isLoading ? (
								<SkeletonRepeat count={3} gap={10}>
									<View style={{ borderRadius: 14, backgroundColor: c.card, padding: 12, gap: 10 }}>
										<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
											<Skeleton width={90} height={16} />
											<Skeleton width={60} height={13} />
										</View>
										<Skeleton width="75%" height={14} />
									</View>
								</SkeletonRepeat>
							) : null}
							{reviewItems.map((review) => (
								<Pressable
									key={review.id}
									onLongPress={() => setComplaint({ type: 'REVIEW', targetId: review.id })}
									style={{ borderRadius: 14, backgroundColor: c.card, padding: 12, gap: 6 }}
								>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: STAR }}>
											{'★'.repeat(review.stars)}
											<Text style={{ color: raw.dashed }}>{'★'.repeat(5 - review.stars)}</Text>
										</Text>
										<Text style={{ fontSize: 14.5, fontFamily: fontFamily(400), color: c.muted }}>{formatDay(review.createdAt)}</Text>
									</View>
									<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>
										{review.buyerName ?? t('Покупатель')}
										{review.tags.length ? ` · ${review.tags.map((t) => t.label).join(', ')}` : ''}
									</Text>
									{review.reply ? (
										<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>{t('Ответ продавца: {0}', review.reply)}</Text>
									) : null}
								</Pressable>
							))}
							{reviews.isFetchingNextPage ? <Skeleton height={64} radius={14} /> : null}
						</View>
					) : null}
				</View>
				{shop ? <ComplainLink onPress={() => setComplaint({ type: 'SHOP', targetId: shop.id })} label={t('Пожаловаться на магазин')} /> : null}
			</ScrollView>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</View>
	)
}
