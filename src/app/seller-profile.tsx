import { useState } from 'react'
import { Image, Linking, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { LocationCard, ProductCard, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { ChatIcon, ChevronLeftIcon, HeartIcon, MapPinIcon, PhoneIcon, ShareIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDay, formatPrice, formatSide, plural } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { usePublicShop, useShop, useShopParts, useShopReviews, useSignedIn, useToggleShopFavorite } from '@/api/catalog'
import { useOpenChat } from '@/api/chats'
import { ComplainLink, ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { briefPlace, openShopRoute } from '@/lib/shop-place'

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

	const [tab, setTab] = useState<Tab>('parts')
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)
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
			<ScrollView showsVerticalScrollIndicator={false}>
				<View>
					{/* One banner — the box's first photo; no gallery. */}
					{banner ? (
						<Image source={{ uri: resolveUrl(banner.url) }} style={{ width, height: 210 }} resizeMode="cover" />
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
						<Pressable onPress={() => router.back()} style={roundButton}>
							<ChevronLeftIcon size={24} color={c.ink} />
						</Pressable>
						<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
							{signedIn && shop ? (
								<Pressable onPress={() => favorite.mutate(!shop.isFavorite)} style={roundButton}>
									<HeartIcon size={20} color={shop.isFavorite ? c.danger : c.ink} filled={shop.isFavorite} />
								</Pressable>
							) : null}
							{shop ? (
								<Pressable
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
					) : (
						<View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: raw.fill, borderWidth: 4, borderColor: c.surface }} />
					)}
				</View>

				<View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 14 }}>
					<QueryErrorBanner error={query.error} onRetry={() => query.refetch()} />

					<View style={{ gap: 2 }}>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>{shop?.name ?? ' '}</Text>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{shop
								? shop.reviewsCount
									? <><Text style={{ color: STAR }}>★</Text>{` ${shop.rating.toFixed(1)} · ${shop.reviewsCount} ${plural(shop.reviewsCount, ['оценка', 'оценки', 'оценок'])}`}</>
									: 'Пока нет отзывов'
								: ' '}
						</Text>
					</View>

					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 14 }}>
						{/* On the market — row and box; a shop / centre elsewhere — its address. */}
						{shop && !shop.location ? (
							<Text style={{ fontSize: 16, lineHeight: 21, fontFamily: fontFamily(600), color: c.ink }}>{shop.address}</Text>
						) : (
							<LocationCard rowLabel={shop?.location?.rowCode ?? ' '} boxLabel={shop?.location ? String(shop.location.number) : ' '} />
						)}
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.inkSecondary }}>
								{shop?.location ? `${formatSide(shop.location.side)} сторона`.replace(/^./, (ch) => ch.toUpperCase()) : shop ? 'Магазин' : ' '}
							</Text>
							<Pressable
								onPress={route}
								style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: c.brandTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}
							>
								<MapPinIcon size={16} color={c.brandStrong} />
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{shop && !shop.location ? 'Маршрут' : 'На карте'}</Text>
							</Pressable>
						</View>
					</View>

					{brands.length ? (
						<View style={{ gap: 8 }}>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ПРОДАЁТ ДЛЯ МАРОК</Text>
							<View style={{ flexDirection: 'row' }}>
								{brands.slice(0, VISIBLE_BRANDS).map((brand, i) => (
									<View key={brand.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
										<BrandLogo brand={brand} size={36} />
									</View>
								))}
								{brands.length > VISIBLE_BRANDS ? (
									<View
										style={{
											marginLeft: -8,
											width: 36,
											height: 36,
											borderRadius: 18,
											backgroundColor: c.card,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>+{brands.length - VISIBLE_BRANDS}</Text>
									</View>
								) : null}
							</View>
						</View>
					) : null}

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable
							onPress={write}
							disabled={!shop || openChat.isPending}
							style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: c.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<ChatIcon size={20} color="#FFFFFF" />
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Написать</Text>
						</Pressable>
						<Pressable
							onPress={route}
							style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: raw.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<MapPinIcon size={20} color={c.ink} />
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>Маршрут</Text>
						</Pressable>
						{/* The phone is shown only when the shop made it visible (or after a chat). */}
						{shop?.phone ? (
							<Pressable
								onPress={() => Linking.openURL(`tel:${shop.phone}`)}
								style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: raw.fill, alignItems: 'center', justifyContent: 'center' }}
							>
								<PhoneIcon size={20} color={c.ink} />
							</Pressable>
						) : null}
					</View>
					{openChat.error ? (
						<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{openChat.error.message}</Text>
					) : null}

					<View style={{ flexDirection: 'row', gap: 20 }}>
						{(
							[
								{ value: 'parts', label: `Запчасти ${counts?.parts ?? ''}` },
								{ value: 'reviews', label: 'Отзывы' },
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
										fontSize: 15,
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
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 }}>
							{partItems.map((part) => (
								<ProductCard
									key={part.id}
									price={formatPrice(part.price)}
									title={part.title}
									fits={part.fits === true}
									location={briefPlace(part.shop)}
									photoUrl={resolveUrl(part.mainPhoto?.thumbUrl ?? part.mainPhoto?.url)}
									shopAvatarUrl={resolveUrl(part.shop.avatarUrl)}
									dimmed={part.stockStatus === 'OUT_OF_STOCK'}
									favorite={part.isFavorite}
									onPress={() => router.push({ pathname: '/part', params: { id: String(part.id) } })}
								/>
							))}
							{parts.hasNextPage ? (
								<Pressable onPress={() => parts.fetchNextPage()} style={{ width: '100%', paddingVertical: 12, alignItems: 'center' }}>
									<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>Показать ещё</Text>
								</Pressable>
							) : null}
							{parts.isSuccess && partItems.length === 0 ? (
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Запчасти ещё не выложены</Text>
							) : null}
						</View>
					) : null}

					{tab === 'reviews' ? (
						<View style={{ gap: 10, paddingBottom: 24 }}>
							{reviewItems.map((review) => (
								<Pressable
									key={review.id}
									onLongPress={() => setComplaint({ type: 'REVIEW', targetId: review.id })}
									style={{ borderRadius: 14, backgroundColor: c.card, padding: 12, gap: 6 }}
								>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: STAR }}>
											{'★'.repeat(review.stars)}
											<Text style={{ color: raw.dashed }}>{'★'.repeat(5 - review.stars)}</Text>
										</Text>
										<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{formatDay(review.createdAt)}</Text>
									</View>
									<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.inkSecondary }}>
										{review.buyerName ?? 'Покупатель'}
										{review.tags.length ? ` · ${review.tags.map((t) => t.label).join(', ')}` : ''}
									</Text>
									{review.reply ? (
										<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Ответ продавца: {review.reply}</Text>
									) : null}
								</Pressable>
							))}
							{reviews.hasNextPage ? (
								<Pressable onPress={() => reviews.fetchNextPage()} style={{ paddingVertical: 12, alignItems: 'center' }}>
									<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>Показать ещё</Text>
								</Pressable>
							) : null}
							{reviews.isSuccess && reviewItems.length === 0 ? (
								<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Отзывов пока нет</Text>
							) : null}
						</View>
					) : null}
				</View>
				{shop ? <ComplainLink onPress={() => setComplaint({ type: 'SHOP', targetId: shop.id })} label="Пожаловаться на магазин" /> : null}
			</ScrollView>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</View>
	)
}
