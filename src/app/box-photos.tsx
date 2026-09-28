import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LocationCard, PhotoPlaceholder } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, GalleryIcon } from '@/components/icons'
import { brandBySlug } from '@/data/brands'
import { fontFamily, raw, useColors } from '@/theme'
import { boxOverview } from '@/mocks'

export default function BoxPhotosScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top + 12, paddingHorizontal: 16, gap: 16 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>Мой бокс</Text>
				<Pressable onPress={() => router.back()}>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>Готово</Text>
				</Pressable>
			</View>

			<View style={{ flexDirection: 'row', gap: 12 }}>
				<View style={{ width: 96, height: 96 }}>
					<View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: raw.fill }} />
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
				</View>
				<View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
					<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{boxOverview.name}</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{boxOverview.rating}</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{boxOverview.changeAvatar}</Text>
				</View>
			</View>

			<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 14 }}>
				<LocationCard rowLabel={boxOverview.rowLabel} boxLabel={boxOverview.boxNumber} />
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.inkSecondary }}>{boxOverview.side}</Text>
					<Pressable onPress={() => router.push('/box-select')}>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{boxOverview.change}</Text>
					</Pressable>
				</View>
			</View>

			<View style={{ gap: 8 }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
						{boxOverview.photosLabel}
					</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{boxOverview.photosCount}</Text>
				</View>

				<View style={{ flexDirection: 'row', gap: 8 }}>
					<View style={{ flex: 1 }}>
						<PhotoPlaceholder width={236} height={216} radius={14} style={{ width: '100%' }} />
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
							<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{boxOverview.coverLabel}</Text>
						</View>
					</View>
					<View style={{ gap: 8 }}>
						<PhotoPlaceholder width={114} height={104} radius={14} />
						<PhotoPlaceholder width={114} height={104} radius={14} />
					</View>
				</View>

				<View style={{ flexDirection: 'row', gap: 8 }}>
					<Pressable
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
						onPress={() => router.push('/camera')}
					>
						<CameraIcon size={24} color={c.brandStrong} strokeWidth={2.2} />
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>{boxOverview.photoActions.camera}</Text>
					</Pressable>
					<Pressable
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
						<GalleryIcon size={24} color={c.brandStrong} strokeWidth={2.2} />
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>{boxOverview.photoActions.gallery}</Text>
					</Pressable>
				</View>
			</View>

			<View style={{ borderRadius: 14, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{boxOverview.brandsLabel}</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<View style={{ flexDirection: 'row' }}>
						{boxOverview.brandSlugs.map((slug, i) => (
							<View key={slug} style={{ marginLeft: i === 0 ? 0 : -8 }}>
								<BrandLogo brand={brandBySlug(slug)} size={36} />
							</View>
						))}
						{boxOverview.moreBrands ? (
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
								<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>+{boxOverview.moreBrands}</Text>
							</View>
						) : null}
					</View>
					<Pressable onPress={() => router.push('/seller-brands')}>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{boxOverview.changeBrands}</Text>
					</Pressable>
				</View>
			</View>
		</View>
	)
}
