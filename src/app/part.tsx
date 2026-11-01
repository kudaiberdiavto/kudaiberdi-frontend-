import { useState } from 'react'
import { Image, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { PhotoPlaceholder, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { ChatIcon, CheckIcon, ChevronLeftIcon, HeartIcon, MapPinIcon, ShareIcon, WhatsAppIcon } from '@/components/icons'
import { openWhatsApp } from '@/lib/whatsapp'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { type PartFilters, usePart, usePublicPart, useSearchParts, useSignedIn, useTogglePartFavorite } from '@/api/catalog'
import { flattenPages } from '@/api/pagination'
import { useVideoViewer } from '@/store/useVideoViewer'
import { PlayIcon } from '@/components/voice'
import { PartTile } from '@/components/catalog-screen'
import { useOpenChat } from '@/api/chats'
import type { PartCondition } from '@/api/types'
import { toPartFilters, useCatalogFilters } from '@/store/useCatalogFilters'
import { useCars } from '@/api/garage'
import { ComplainLink, ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { openShopRoute, shopPlace } from '@/lib/shop-place'
import { t } from '@/i18n'

const CONDITION: Record<PartCondition, string> = { NEW: t('Новое'), USED: t('Б/У'), ON_ORDER: t('Под заказ') }

/** 29 — part card. `id` from the catalog, or `publicId` from a share link /p/{publicId}. */
export default function PartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const { width } = useWindowDimensions()
	const params = useLocalSearchParams<{ id?: string; publicId?: string }>()
	const signedIn = useSignedIn()
	const filters = useCatalogFilters()
	const primaryCar = useCars().data?.find((car) => car.isPrimary)

	// The catalog's car decides «Подходит к вашей …».
	const carId = filters.carId === undefined ? primaryCar?.id : (filters.carId ?? undefined)
	const { brandId, modelId } = toPartFilters({ ...filters, carId: carId ?? null })
	const byId = usePart(Number(params.id) || 0, { carId, brandId, modelId })
	const byPublicId = usePublicPart(params.publicId ?? '')
	const query = params.publicId ? byPublicId : byId
	const part = query.data

	const favorite = useTogglePartFavorite(part?.id ?? 0)
	const openChat = useOpenChat()
	const [photoIndex, setPhotoIndex] = useState(0)
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)

	const photos = part?.photos ?? []
	const shop = part?.shop
	const share = () => part && Share.share({ message: `${part.title ?? ''}\nhttps://kudaibergen.kg/p/${part.publicId}` })
	const write = () =>
		shop &&
		(signedIn
			? openChat.mutate(
					{ shopId: shop.id, partId: part?.id },
					{ onSuccess: (chat) => router.push({ pathname: '/chat', params: { chatId: String(chat.id) } }) }
				)
			: router.push('/'))

	const roundButton = { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' } as const

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<View>
				{photos.length ? (
					<ScrollView
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
					>
						{photos.map((photo) => (
							<Image key={photo.id} source={{ uri: resolveUrl(photo.url) }} style={{ width, height: 320 }} resizeMode="cover" />
						))}
					</ScrollView>
				) : part?.video?.posterUrl ? (
					// A video part without photos: the video's poster, ▶ opens the feed on it.
					<Pressable
						onPress={() => {
							useVideoViewer.getState().openVideo(part.id)
							router.push('/videos')
						}}
					>
						<Image source={{ uri: resolveUrl(part.video.posterUrl) }} style={{ width, height: 320 }} resizeMode="cover" />
						<View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
							<View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
								<PlayIcon size={26} />
							</View>
						</View>
					</Pressable>
				) : (
					<PhotoPlaceholder width={undefined} height={320} radius={0} style={{ width: '100%' }} />
				)}

				<View
					style={{
						position: 'absolute',
						left: 16,
						right: 16,
						top: insets.top + 9,
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}
				>
					<Pressable onPress={() => router.back()} style={roundButton}>
						<ChevronLeftIcon size={24} color={c.ink} />
					</Pressable>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						{signedIn && part ? (
							<Pressable onPress={() => favorite.mutate(!part.isFavorite)} style={roundButton}>
								<HeartIcon size={20} color={part.isFavorite ? c.danger : c.ink} filled={part.isFavorite} />
							</Pressable>
						) : null}
						<Pressable onPress={share} style={roundButton}>
							<ShareIcon size={20} color={c.ink} />
						</Pressable>
					</View>
				</View>

				{photos.length > 1 ? (
					<View
						style={{
							position: 'absolute',
							right: 16,
							bottom: 16,
							height: 24,
							paddingHorizontal: 8,
							borderRadius: 12,
							backgroundColor: 'rgba(32,31,29,0.6)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
							{photoIndex + 1} / {photos.length}
						</Text>
					</View>
				) : null}
			</View>

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={query.error} onRetry={() => query.refetch()} />

				<Text style={{ fontSize: 28, fontFamily: fontFamily(800), letterSpacing: -0.28, color: c.ink }}>
					{formatPrice(part?.price) || ' '}
				</Text>
				<Text style={{ fontSize: 18.5, fontFamily: fontFamily(400), color: c.inkSecondary }}>{part?.title ?? ' '}</Text>

				{part?.fit ? (
					<View
						style={{
							borderRadius: 12,
							backgroundColor: part.fit.fits ? c.successTint : c.dangerTint,
							paddingVertical: 10,
							paddingHorizontal: 12,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
						}}
					>
						{part.fitments[0] ? (
							<BrandLogo brand={part.fitments[0].brand} size={28} />
						) : (
							<View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.border }} />
						)}
						<Text style={{ flex: 1, fontSize: 15.5, fontFamily: fontFamily(400), color: part.fit.fits ? '#14532D' : c.danger }}>
							<Text style={{ fontFamily: fontFamily(700) }}>{part.fit.fits ? t('Подходит') : t('Не подходит')}</Text>{' '}{t('к вашей')}{' '}
							{part.fit.carLabel}
						</Text>
						{part.fit.fits ? <CheckIcon size={18} color={c.success} strokeWidth={3} /> : null}
					</View>
				) : part?.fitments.length ? (
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>
						{t('Подходит: {0}', part.fitments.map((f) => f.label).join(', '))}
					</Text>
				) : null}

				{part && (part.condition || part.stockStatus !== 'IN_STOCK') ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{part.condition ? (
							<View style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: c.card, justifyContent: 'center' }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>{CONDITION[part.condition]}</Text>
							</View>
						) : null}
						{/* Only when it ran out — in stock is the norm, not worth a line. */}
						{part.stockStatus !== 'IN_STOCK' ? (
							<View style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#FDECEC', justifyContent: 'center' }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.danger }}>{t('Нет в наличии')}</Text>
							</View>
						) : null}
					</View>
				) : null}

				{shop ? (
					<Pressable
						onPress={() => router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })}
						style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}
					>
						{shop.avatarUrl ? (
							<Image source={{ uri: resolveUrl(shop.avatarUrl) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
						) : (
							<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
								<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.brandStrong }}>{shop.name.charAt(0).toUpperCase()}</Text>
							</View>
						)}
						<View style={{ flex: 1, gap: 2 }}>
							<Text numberOfLines={1} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>
								{shop.name}
							</Text>
							<Text numberOfLines={1} style={{ fontSize: 14.5, fontFamily: fontFamily(400), color: c.muted }}>
								{shop.reviewsCount ? <Text style={{ color: '#F5A623' }}>★ </Text> : null}
								{shop.reviewsCount ? `${shop.rating.toFixed(1)} · ` : ''}
								{shopPlace(shop)}
							</Text>
						</View>
						<Text style={{ fontSize: 22, color: c.muted }}>›</Text>
					</Pressable>
				) : null}

				{openChat.error ? (
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{openChat.error.message}</Text>
				) : null}

				{part ? <Similar partId={part.id} categoryId={part.category?.id} car={{ carId, brandId, modelId }} /> : null}

				{part ? <ComplainLink onPress={() => setComplaint({ type: 'PART', targetId: part.id })} /> : null}
			</ScrollView>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />

			<View
				style={{
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: insets.bottom + 12,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					backgroundColor: c.card,
					flexDirection: 'row',
					gap: 8,
				}}
			>
				<Pressable
					disabled={!shop}
					onPress={() => shop && openShopRoute(shop)}
					style={{ flex: 1, height: 54, paddingHorizontal: 10, borderRadius: 14, backgroundColor: raw.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
				>
					<MapPinIcon size={20} color={c.ink} />
					<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{shop && !shop.location ? t('2ГИС') : t('Как пройти')}</Text>
				</Pressable>
				<Pressable
					disabled={!shop || openChat.isPending}
					onPress={write}
					style={{
						flex: 1,
						height: 54,
						paddingHorizontal: 10,
						borderRadius: 14,
						backgroundColor: c.success,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
						opacity: openChat.isPending ? 0.6 : 1,
					}}
				>
					<ChatIcon size={20} color="#FFFFFF" />
					<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{t('Написать')}</Text>
				</Pressable>
				{/* WhatsApp at the right edge — «Я из приложения Кудайберген. Меня интересует «…»» (only when the shop's number is visible). */}
				{shop?.phone ? (
					<Pressable
						onPress={() => shop.phone && openWhatsApp(shop.phone, part?.title)}
						style={{ width: 54, height: 54, borderRadius: 14, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' }}
					>
						<WhatsAppIcon size={26} color="#FFFFFF" />
					</Pressable>
				) : null}
			</View>
		</View>
	)
}

/** «Похожие запчасти»: the same category (for the chosen car, if any), otherwise just other parts — two columns. */
function Similar({ partId, categoryId, car }: { partId: number; categoryId?: number; car: Pick<PartFilters, 'carId' | 'brandId' | 'modelId'> }) {
	const c = useColors()
	const search = useSearchParts({ ...car, categoryId })
	const items = flattenPages(search.data)
		.filter((item) => item.id !== partId)
		.slice(0, 6)
	if (!items.length) return null
	return (
		<View style={{ gap: 12, paddingTop: 8 }}>
			<Text style={{ fontSize: 20, fontFamily: fontFamily(800), color: c.ink }}>{t('Похожие запчасти')}</Text>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 18 }}>
				{items.map((item) => (
					<View key={item.id} style={{ width: '47.8%' }}>
						<PartTile part={item} />
					</View>
				))}
			</View>
		</View>
	)
}
