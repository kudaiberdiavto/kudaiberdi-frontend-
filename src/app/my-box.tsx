import { useState } from 'react'
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, Chip, QueryErrorBanner } from '@/components/ui'
import { BrandChip } from '@/components/ui/brand'
import { CameraIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatHours, formatPlace, formatSide } from '@/lib/format'
import { useBrands, useCategories } from '@/api/directory'
import { usePhotoUploads } from '@/api/media'
import {
	useMyShop,
	useRegisterShop,
	useSetShopAvatar,
	useSetShopBrands,
	useSetShopCategories,
	useUpdateShop,
} from '@/api/shop'
import { useSession } from '@/store/useSession'

const DEFAULT_HOURS = { openFrom: '08:00:00', openTo: '17:00:00' }

/**
 * 10 «Мой бокс». Registration step 2 (after 10а, params `containerId` + `place`) — POST /shops;
 * with a shop — editing name, brands and categories.
 */
export default function MyBoxScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ containerId?: string; place?: string }>()
	const hasShop = useSession((s) => s.hasShop)
	const registering = !hasShop && Boolean(params.containerId)

	const shop = useMyShop()
	const brands = useBrands({ popular: true })
	const categories = useCategories()
	const avatar = usePhotoUploads('AVATAR', 1)
	const register = useRegisterShop()
	const update = useUpdateShop()
	const setBrands = useSetShopBrands()
	const setCategories = useSetShopCategories()
	const setAvatar = useSetShopAvatar()

	const current = shop.data
	const [name, setName] = useState<string | null>(null)
	const [brandIds, setBrandIds] = useState<number[] | null>(null)
	const [categoryIds, setCategoryIds] = useState<number[] | null>(null)
	const nameValue = name ?? current?.name ?? ''
	const pickedBrands = brandIds ?? current?.brands.map((b) => b.id) ?? []
	const pickedCategories = categoryIds ?? current?.categories.map((c) => c.id) ?? []

	// Popular brands plus whatever the shop already sells outside them.
	const brandOptions = [...(brands.data ?? []), ...(current?.brands ?? []).filter((b) => !b.popular)]
	const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

	const place = registering
		? (params.place ?? '')
		: current
			? `${formatPlace(current.location)} · ${formatSide(current.location.side)}`
			: ''
	const hours = current ? `${formatHours(current.open.openFrom)}–${formatHours(current.open.openTo)}` : '08:00–17:00'
	const avatarUri = avatar.photos[0]?.uri ?? resolveUrl(current?.avatarUrl)
	const avatarId = avatar.mediaIds[0]

	const saving = register.isPending || update.isPending || setBrands.isPending || setCategories.isPending || setAvatar.isPending
	const error = register.error ?? update.error ?? setBrands.error ?? setCategories.error ?? setAvatar.error
	const valid = nameValue.trim().length > 0 && pickedBrands.length > 0 && pickedCategories.length > 0

	const save = async () => {
		try {
			if (registering) {
				const created = await register.mutateAsync({
					containerId: Number(params.containerId),
					name: nameValue.trim(),
					brandIds: pickedBrands,
					categoryIds: pickedCategories,
					...DEFAULT_HOURS,
				})
				if (avatarId) await setAvatar.mutateAsync(avatarId)
				// The shop is ACTIVE right away while place checks are off on the server;
				// once they are on it stays PENDING_VERIFICATION until the QR scan.
				router.replace(created.status === 'PENDING_VERIFICATION' ? '/verify-box' : '/seller')
				return
			}
			if (name !== null && name.trim() !== current?.name) await update.mutateAsync({ name: name.trim() })
			if (brandIds) await setBrands.mutateAsync(brandIds)
			if (categoryIds) await setCategories.mutateAsync(categoryIds)
			if (avatarId) await setAvatar.mutateAsync(avatarId)
			if (router.canGoBack()) router.back()
			else router.replace('/seller')
		} catch {
			// Shown from the mutation's error state.
		}
	}

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 16,
				paddingHorizontal: 16,
				paddingBottom: 16,
			}}
		>
			<ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
				{registering ? <Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>Шаг 2 из 2</Text> : null}
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Мой бокс</Text>

				<QueryErrorBanner error={shop.error ?? brands.error ?? categories.error} onRetry={() => shop.refetch()} />

				<View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
					<Pressable onPress={() => (avatar.photos[0] ? avatar.remove(avatar.photos[0].key) : avatar.pick('library'))}>
						{avatarUri ? (
							<Image source={{ uri: avatarUri }} style={{ width: 60, height: 60, borderRadius: 30 }} />
						) : (
							<View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: raw.fill }} />
						)}
						<View
							style={{
								position: 'absolute',
								right: -2,
								bottom: -2,
								width: 30,
								height: 30,
								borderRadius: 15,
								backgroundColor: avatar.photos[0]?.status === 'error' ? c.danger : c.brand,
								borderWidth: 2,
								borderColor: c.surface,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<CameraIcon size={14} color="#FFFFFF" strokeWidth={2.4} />
						</View>
					</Pressable>

					<View style={{ flex: 1, gap: 6 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Название</Text>
						<View
							style={{
								height: 52,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								paddingHorizontal: 14,
								justifyContent: 'center',
							}}
						>
							<TextInput
								value={nameValue}
								onChangeText={setName}
								maxLength={60}
								placeholder="Например: Автодеталь Азамат"
								placeholderTextColor={raw.fillInk}
								style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
							/>
						</View>
					</View>
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Где стоит</Text>
					<View
						style={{
							height: 56,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: c.border,
							backgroundColor: c.card,
							paddingHorizontal: 14,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{place || ' '}</Text>
						<Pressable onPress={() => (registering ? router.back() : router.push('/box-select'))}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Изменить</Text>
						</Pressable>
					</View>
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Марки — получаю запросы по ним</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{brandOptions.map((brand) => (
							<BrandChip
								key={brand.id}
								brand={brand}
								label={brand.shortName}
								selected={pickedBrands.includes(brand.id)}
								onPress={() => setBrandIds(toggle(pickedBrands, brand.id))}
							/>
						))}
					</View>
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Что продаю</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{(categories.data ?? []).map((category) => (
							<Chip
								key={category.id}
								label={category.name}
								selected={pickedCategories.includes(category.id)}
								height={44}
								onPress={() => setCategoryIds(toggle(pickedCategories, category.id))}
							/>
						))}
					</View>
				</View>

				<View
					style={{
						borderRadius: 12,
						backgroundColor: c.card,
						padding: 14,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.inkSecondary }}>Часы работы</Text>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{hours}</Text>
				</View>
			</ScrollView>

			{error ? (
				<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger, paddingBottom: 10 }}>{error.message}</Text>
			) : null}

			<Button
				label={registering ? 'Зарегистрировать бокс' : 'Сохранить'}
				disabled={!valid || avatar.uploading}
				loading={saving}
				onPress={save}
			/>
		</View>
	)
}
