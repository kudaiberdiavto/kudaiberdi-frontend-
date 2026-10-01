import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LocationCard, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, GalleryIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatPlace, formatSide, plural } from '@/lib/format'
import { usePhotoUploads } from '@/api/media'
import {
	useAddShopPhoto,
	useMakeShopCover,
	useMyShop,
	useRemoveShopPhoto,
	useSetShopAvatar,
	useShopPhotos,
} from '@/api/shop'
import type { ShopPhoto } from '@/api/types'

const MAX_PHOTOS = 8
const VISIBLE_BRANDS = 4

/** 22 «Мой бокс»: avatar, place, photos of the place (up to 8, the first is the cover), brands. */
export default function BoxPhotosScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const shop = useMyShop()
	const photos = useShopPhotos()
	const setAvatar = useSetShopAvatar()
	const addPhoto = useAddShopPhoto()
	const makeCover = useMakeShopCover()
	const removePhoto = useRemoveShopPhoto()

	const avatar = usePhotoUploads('AVATAR', 1, (photo) => setAvatar.mutateAsync(photo.id))
	const list = photos.data ?? []
	const uploads = usePhotoUploads('SHOP', MAX_PHOTOS - list.length, (photo) => addPhoto.mutateAsync(photo.id))

	const data = shop.data
	const pending = uploads.photos
	const total = list.length + pending.length
	const avatarUri = avatar.photos[0]?.uri ?? resolveUrl(data?.avatarUrl)
	const error = shop.error ?? photos.error ?? setAvatar.error ?? addPhoto.error ?? makeCover.error ?? removePhoto.error

	const photoActions = (photo: ShopPhoto) =>
		Alert.alert('Фото места', undefined, [
			...(photo.isCover ? [] : [{ text: 'Сделать обложкой', onPress: () => makeCover.mutate(photo.photo.id) }]),
			{ text: 'Удалить', style: 'destructive' as const, onPress: () => removePhoto.mutate(photo.photo.id) },
			{ text: 'Отмена', style: 'cancel' as const },
		])

	const tile = (photo: ShopPhoto | undefined, width: number | `${number}%`, height: number, key: string) =>
		photo ? (
			<Pressable key={key} onPress={() => photoActions(photo)} style={{ width, height, borderRadius: 14, overflow: 'hidden' }}>
				<Image source={{ uri: resolveUrl(photo.photo.url) }} style={{ flex: 1 }} resizeMode="cover" />
				{photo.isCover ? (
					<View
						style={{
							position: 'absolute',
							left: 8,
							top: 8,
							height: 24,
							paddingHorizontal: 8,
							borderRadius: 12,
							backgroundColor: 'rgba(32,31,29,0.72)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Обложка</Text>
					</View>
				) : null}
			</Pressable>
		) : (
			<View key={key} style={{ width, height, borderRadius: 14, backgroundColor: raw.fill }} />
		)

	const [cover, second, third, ...rest] = list
	const brands = data?.brands ?? []

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top + 12 }}>
			<View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>Мой бокс</Text>
				<Pressable onPress={() => router.back()}>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>Готово</Text>
				</Pressable>
			</View>

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 16 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={error} onRetry={() => shop.refetch()} />

				<View style={{ flexDirection: 'row', gap: 12 }}>
					<Pressable onPress={() => avatar.pick('library')} style={{ width: 96, height: 96 }}>
						{avatarUri ? (
							<Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
						) : (
							<View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: raw.fill }} />
						)}
						<View
							style={{
								position: 'absolute',
								right: -2,
								bottom: -2,
								width: 40,
								height: 40,
								borderRadius: 17,
								backgroundColor: c.brand,
								borderWidth: 3,
								borderColor: c.surface,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<CameraIcon size={18} color="#FFFFFF" strokeWidth={2.4} />
						</View>
					</Pressable>
					<View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{data?.name ?? ' '}</Text>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{data
								? data.reviewsCount
									? `★ ${data.rating.toFixed(1)} · ${data.reviewsCount} ${plural(data.reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}`
									: 'Пока нет отзывов'
								: ' '}
						</Text>
						<Pressable onPress={() => avatar.pick('library')}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Сменить аватар</Text>
						</Pressable>
					</View>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 14 }}>
					<LocationCard rowLabel={data?.location.rowCode ?? ' '} boxLabel={data ? String(data.location.number) : ' '} />
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.inkSecondary }}>
							{data ? `${formatSide(data.location.side)} сторона`.replace(/^./, (ch) => ch.toUpperCase()) : ' '}
						</Text>
						<Pressable onPress={() => router.push('/box-select')}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Изменить</Text>
						</Pressable>
					</View>
					{data?.pendingLocation && data.verification.required ? (
						<Pressable onPress={() => router.push('/verify-box')}>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.danger }}>
								Переезд в {formatPlace(data.pendingLocation)} ждёт проверки ›
							</Text>
						</Pressable>
					) : null}
				</View>

				<View style={{ gap: 8 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ФОТО МЕСТА</Text>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
							{total} из {MAX_PHOTOS}
						</Text>
					</View>

					{list.length ? (
						<View style={{ flexDirection: 'row', gap: 8 }}>
							<View style={{ flex: 1 }}>{tile(cover, '100%', 216, 'cover')}</View>
							<View style={{ gap: 8 }}>
								{tile(second, 114, 104, 'second')}
								{tile(third, 114, 104, 'third')}
							</View>
						</View>
					) : null}
					{rest.length || pending.length ? (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{rest.map((photo) => tile(photo, 84, 84, String(photo.id)))}
							{pending.map((p) => (
								<Pressable
									key={p.key}
									onPress={() => p.status === 'error' && uploads.retry(p.key)}
									style={{
										width: 84,
										height: 84,
										borderRadius: 14,
										overflow: 'hidden',
										borderWidth: p.status === 'error' ? 2 : 0,
										borderColor: c.danger,
									}}
								>
									<Image source={{ uri: p.uri }} style={{ flex: 1, opacity: 0.5 }} />
									<View
										style={{
											position: 'absolute',
											left: 0,
											bottom: 0,
											height: 4,
											width: `${Math.round(p.progress * 100)}%`,
											backgroundColor: c.brand,
										}}
									/>
								</Pressable>
							))}
						</View>
					) : null}

					{total < MAX_PHOTOS ? (
						<View style={{ flexDirection: 'row', gap: 8 }}>
							{[
								{ label: 'Сфотать', Icon: CameraIcon, source: 'camera' as const },
								{ label: 'Из галереи', Icon: GalleryIcon, source: 'library' as const },
							].map(({ label, Icon, source }) => (
								<Pressable
									key={label}
									onPress={() => uploads.pick(source)}
									style={{
										flex: 1,
										height: 69,
										borderRadius: 12,
										backgroundColor: c.card,
										borderWidth: 2,
										borderStyle: 'dashed',
										borderColor: raw.mapRowBorder,
										alignItems: 'center',
										justifyContent: 'center',
										gap: 4,
									}}
								>
									<Icon size={24} color={c.brandStrong} strokeWidth={2.2} />
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>{label}</Text>
								</Pressable>
							))}
						</View>
					) : null}
				</View>

				<View style={{ borderRadius: 14, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Марки, которые продаю</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
										backgroundColor: c.surface,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>
										+{brands.length - VISIBLE_BRANDS}
									</Text>
								</View>
							) : null}
						</View>
						<Pressable onPress={() => router.push('/seller-brands')}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Изменить ›</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</View>
	)
}
