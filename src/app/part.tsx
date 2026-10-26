import { useState } from 'react'
import { Image, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { PhotoPlaceholder, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { ChatIcon, CheckIcon, ChevronLeftIcon, HeartIcon, MapPinIcon, ShareIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatPlace, formatPrice } from '@/lib/format'
import { usePart, usePublicPart, useSignedIn, useTogglePartFavorite } from '@/api/catalog'
import { useOpenChat } from '@/api/chats'
import type { PartCondition } from '@/api/types'
import { toPartFilters, useCatalogFilters } from '@/store/useCatalogFilters'
import { useCars } from '@/api/garage'
import { ComplainLink, ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'

const CONDITION: Record<PartCondition, string> = { NEW: 'Новое', USED: 'Б/У', ON_ORDER: 'Под заказ' }

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
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
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
				<Text style={{ fontSize: 17, fontFamily: fontFamily(400), color: c.inkSecondary }}>{part?.title ?? ' '}</Text>

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
						<Text style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(400), color: part.fit.fits ? '#14532D' : c.danger }}>
							<Text style={{ fontFamily: fontFamily(700) }}>{part.fit.fits ? 'Подходит' : 'Не подходит'}</Text> к вашей{' '}
							{part.fit.carLabel}
						</Text>
						{part.fit.fits ? <CheckIcon size={18} color={c.success} strokeWidth={3} /> : null}
					</View>
				) : part?.fitments.length ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
						Подходит: {part.fitments.map((f) => f.label).join(', ')}
					</Text>
				) : null}

				{part ? (
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<View style={{ flex: 1, borderRadius: 12, backgroundColor: c.card, padding: 10, gap: 3 }}>
							<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>Состояние</Text>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>
								{part.condition ? CONDITION[part.condition] : '—'}
							</Text>
						</View>
						<View style={{ flex: 1, borderRadius: 12, backgroundColor: c.card, padding: 10, gap: 3 }}>
							<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>
								{part.stockStatus === 'IN_STOCK' ? 'В наличии' : 'Наличие'}
							</Text>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: part.stockStatus === 'IN_STOCK' ? c.ink : c.danger }}>
								{part.stockStatus === 'IN_STOCK' ? `${part.quantity} шт` : 'Нет'}
							</Text>
						</View>
					</View>
				) : null}

				{shop ? (
					<Pressable
						onPress={() => router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })}
						style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 12 }}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
							{shop.avatarUrl ? (
								<Image source={{ uri: resolveUrl(shop.avatarUrl) }} style={{ width: 48, height: 48, borderRadius: 24 }} />
							) : (
								<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: raw.fill }} />
							)}
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{shop.name}</Text>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
									{shop.reviewsCount ? `★ ${shop.rating.toFixed(1)} · ` : ''}
									{formatPlace(shop.location)}
								</Text>
							</View>
							<Text style={{ fontSize: 20, color: c.muted }}>›</Text>
						</View>
						{part?.shopPhotos.length ? (
							<View style={{ flexDirection: 'row', gap: 8 }}>
								{part.shopPhotos.slice(0, 3).map((photo) => (
									<Image
										key={photo.id}
										source={{ uri: resolveUrl(photo.thumbUrl ?? photo.url) }}
										style={{ flex: 1, height: 56, borderRadius: 10 }}
										resizeMode="cover"
									/>
								))}
							</View>
						) : null}
					</Pressable>
				) : null}

				{openChat.error ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{openChat.error.message}</Text>
				) : null}

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
					onPress={() => shop && router.push({ pathname: '/route', params: { containerId: String(shop.location.containerId), shopName: shop.name } })}
					style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: raw.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
				>
					<MapPinIcon size={20} color={c.ink} />
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>Как пройти</Text>
				</Pressable>
				<Pressable
					disabled={!shop || openChat.isPending}
					onPress={write}
					style={{
						flex: 1.3,
						height: 54,
						borderRadius: 14,
						backgroundColor: c.brand,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
						opacity: openChat.isPending ? 0.6 : 1,
					}}
				>
					<ChatIcon size={20} color="#FFFFFF" />
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Написать</Text>
				</Pressable>
			</View>
		</View>
	)
}
