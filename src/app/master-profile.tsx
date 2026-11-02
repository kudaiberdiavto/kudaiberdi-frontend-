import { useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import * as Location from 'expo-location'
import { addressAt, currentCoords } from '@/lib/locate'
import { BrandLogo, Button, Chip, QueryErrorBanner, ScreenHeader, SectionLabel, ServiceGrid, Skeleton, toast, Toggle } from '@/components/ui'
import { CloseIcon, LocateIcon, MapPinIcon, PhotoIcon } from '@/components/icons'
import { fixed, fontFamily, fs, raw, useColors } from '@/theme'
import { useBrands } from '@/api/directory'
import { useMe } from '@/api/me'
import { useMyMaster, useSaveMaster, useServiceTypes, useSetMasterAvatar, useSetMasterPhotos } from '@/api/services'
import { usePhotoUploads } from '@/api/media'
import { resolveUrl } from '@/lib/api'
import type { CarOrigin, MyMaster } from '@/api/types'
import { MARKET_POINT } from '@/data/service-types'
import { ORIGINS } from '@/store/useServiceDraft'
import { t } from '@/i18n'

interface Form {
	name: string
	services: string[]
	allBrands: boolean
	brandIds: number[]
	origins: CarOrigin[]
	address: string
	lat: number | null
	lng: number | null
	radiusKm: number
	mobile: boolean
	phone: string
}

const RADII = [3, 5, 10, 20, 30]

/** 38 «Мои услуги» — what the master does, brands, origins, where. The first master entry lands here. */
export default function MasterProfileScreen() {
	const profile = useMyMaster()
	// Wait for the saved profile so the form starts from it.
	if (profile.isPending) return <MasterProfileSkeleton />
	return <MasterProfileForm initial={profile.data ?? null} error={profile.error} />
}

/** Форма «Мои услуги» до прихода сохранённого профиля: заголовок, плитки услуг, марки, адрес. */
function MasterProfileSkeleton() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={t('Мои услуги')} />
			<View style={{ paddingTop: 8, paddingHorizontal: 16, gap: 10 }}>
				<Skeleton width={110} height={14} />
				{[0, 1].map((row) => (
					<View key={row} style={{ flexDirection: 'row', gap: 8 }}>
						{[0, 1, 2].map((i) => (
							<Skeleton key={i} width="auto" height={84} radius={16} style={{ flex: 1 }} />
						))}
					</View>
				))}
				<Skeleton width={70} height={14} style={{ marginTop: 10 }} />
				<View style={{ flexDirection: 'row', gap: 6 }}>
					{[34, 34, 34, 100].map((w, i) => (
						<Skeleton key={i} width={w} height={34} radius={17} />
					))}
				</View>
				<Skeleton width={90} height={14} style={{ marginTop: 10 }} />
				<Skeleton height={48} radius={12} />
				<Skeleton height={48} radius={12} />
			</View>
		</View>
	)
}

function MasterProfileForm({ initial, error }: { initial: MyMaster | null; error: Error | null }) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ first?: string; section?: 'brands' | 'place' }>()
	const first = params.first === '1' || !initial
	// «Изменить» on a block of «Мой сервис» opens the form at that block
	const scroll = useRef<ScrollViewInstance>(null)
	const scrolled = useRef(false)
	const anchor = (section: 'brands' | 'place', e: { nativeEvent: { layout: { y: number } } }) => {
		if (params.section !== section || scrolled.current) return
		scrolled.current = true
		const y = e.nativeEvent.layout.y - 8
		setTimeout(() => scroll.current?.scrollTo({ y, animated: true }), 50)
	}
	const types = useServiceTypes().data
	const brands = useBrands({ popular: true }).data ?? []
	const me = useMe().data
	const save = useSaveMaster(Boolean(initial))

	const [form, setForm] = useState<Form>(() => ({
		name: initial?.name ?? me?.name ?? '',
		services: initial?.services.map((t) => t.code) ?? [],
		allBrands: initial?.allBrands ?? true,
		brandIds: initial?.brands.map((b) => b.id) ?? [],
		origins: initial?.origins ?? [],
		address: initial?.address ?? '',
		lat: initial?.lat ?? null,
		lng: initial?.lng ?? null,
		radiusKm: initial?.radiusKm ?? 5,
		mobile: initial?.mobile ?? false,
		phone: initial?.phone ?? me?.phone ?? '',
	}))
	const [pickBrands, setPickBrands] = useState(false)
	const [editPlace, setEditPlace] = useState(!initial?.address)
	const [locating, setLocating] = useState(false)
	const patch = (next: Partial<Form>) => setForm((f) => ({ ...f, ...next }))

	const toggleService = (code: string) =>
		patch({ services: form.services.includes(code) ? form.services.filter((s) => s !== code) : [...form.services, code] })
	const toggleOrigin = (origin: CarOrigin) =>
		patch({ origins: form.origins.includes(origin) ? form.origins.filter((o) => o !== origin) : [...form.origins, origin] })
	const toggleBrand = (id: number) =>
		patch({ allBrands: false, brandIds: form.brandIds.includes(id) ? form.brandIds.filter((b) => b !== id) : [...form.brandIds, id] })

	const locate = async () => {
		setLocating(true)
		try {
			if (!(await Location.requestForegroundPermissionsAsync()).granted) return
			const coords = await currentCoords()
			patch({ lat: coords.latitude, lng: coords.longitude })
			if (!form.address) {
				const address = await addressAt(coords)
				if (address) patch({ address })
			}
		} catch {
		} finally {
			setLocating(false)
		}
	}

	const selectedBrands = brands.filter((b) => form.brandIds.includes(b.id))
	const ready = form.services.length > 0 && (form.allBrands || form.brandIds.length > 0) && Boolean(form.address.trim()) && Boolean(form.name.trim())

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={t('Мои услуги')} />

			<ScrollView ref={scroll} contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={error ?? save.error} />

				{/* Not on the mockup: the name buyers see on offers [37] — asked once, on the first entry. */}
				{!initial ? (
					<>
						<SectionLabel>{t('Название')}</SectionLabel>
						<TextInput
							value={form.name}
							onChangeText={(name) => patch({ name: name.slice(0, 60) })}
							placeholder={t('СТО «Ходовик» или Мастер Эрлан')}
							placeholderTextColor={c.fillInk}
							style={{ height: 48, borderRadius: 12, backgroundColor: c.card, borderWidth: 2, borderColor: c.border, paddingHorizontal: 14, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink }}
						/>
					</>
				) : null}

				<SectionLabel>{t('Что делаю')}</SectionLabel>
				<ServiceGrid types={types} isSelected={(code) => form.services.includes(code)} onPress={toggleService} tileHeight={84} />

				<View onLayout={(e) => anchor('brands', e)}>
					<SectionLabel>{t('Марки')}</SectionLabel>
				</View>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
					{!form.allBrands
						? selectedBrands.map((brand) => (
								<Pressable key={brand.id} onPress={() => setPickBrands(true)}>
									<BrandLogo brand={brand} size={34} />
								</Pressable>
							))
						: null}
					<Pressable
						onPress={() => patch({ allBrands: !form.allBrands })}
						style={{
							height: 34,
							paddingHorizontal: 12,
							borderRadius: 17,
							backgroundColor: form.allBrands ? c.brandTint : c.card,
							borderWidth: form.allBrands ? 2 : 0,
							borderColor: c.brand,
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Все марки')}</Text>
					</Pressable>
					{!pickBrands ? (
						<Pressable onPress={() => setPickBrands(true)} style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: c.card, justifyContent: 'center' }}>
							<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Выбрать…')}</Text>
						</Pressable>
					) : null}
				</View>
				{pickBrands ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{brands.map((brand) => (
							<Chip
								key={brand.id}
								label={brand.shortName}
								radius={12}
								color={c.ink}
								selected={!form.allBrands && form.brandIds.includes(brand.id)}
								onPress={() => toggleBrand(brand.id)}
							/>
						))}
					</View>
				) : null}

				<SectionLabel>{t('Откуда машины')}</SectionLabel>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{ORIGINS.filter((o) => o.value !== 'UNKNOWN').map((origin) => (
						<Chip
							key={origin.value}
							label={origin.label}
							radius={12}
							color={c.ink}
							selected={form.origins.includes(origin.value)}
							onPress={() => toggleOrigin(origin.value)}
						/>
					))}
				</View>

				<View onLayout={(e) => anchor('place', e)}>
					<SectionLabel>{t('Где работаю')}</SectionLabel>
				</View>
				{editPlace ? (
					<View style={{ gap: 8 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 12, backgroundColor: c.card, borderWidth: 2, borderColor: c.brand, paddingHorizontal: 14 }}>
							<MapPinIcon size={20} color={c.brandStrong} />
							<TextInput
								value={form.address}
								onChangeText={(address) => patch({ address })}
								placeholder={t('Адрес: улица, дом, контейнер')}
								placeholderTextColor={c.fillInk}
								style={{ flex: 1, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink }}
							/>
						</View>
						<Pressable onPress={locate} disabled={locating} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 36 }}>
							{locating ? <ActivityIndicator color={c.brandStrong} /> : <LocateIcon size={18} color={c.brandStrong} />}
							<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.brandStrong }}>
								{form.lat !== null ? t('Точка определена · обновить') : t('Определить по геолокации')}
							</Text>
						</Pressable>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{RADII.map((km) => (
								<Chip key={km} label={t('{0} км', km)} height={36} radius={12} color={c.ink} selected={km === form.radiusKm} onPress={() => patch({ radiusKm: km })} />
							))}
						</View>
					</View>
				) : (
					<Pressable
						onPress={() => setEditPlace(true)}
						style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, backgroundColor: c.card, borderWidth: 2, borderColor: c.border, paddingVertical: 10, paddingHorizontal: 14 }}
					>
						<MapPinIcon size={20} color={c.brandStrong} />
						<View style={{ flex: 1, gap: 2 }}>
							<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.ink }}>{form.address}</Text>
							<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>{t('Принимаю заявки в радиусе {0} км', form.radiusKm)}</Text>
						</View>
					</Pressable>
				)}

				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14 }}>
					<Text style={{ fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink }}>{t('Выезжаю к клиенту')}</Text>
					<Toggle value={form.mobile} onChange={(mobile) => patch({ mobile })} />
				</View>

				<SectionLabel>{t('Телефон для клиентов')}</SectionLabel>
				<TextInput
					value={form.phone}
					onChangeText={(phone) => patch({ phone: phone.replace(/[^\d+]/g, '').slice(0, 13) })}
					keyboardType="phone-pad"
					placeholder="+996 555 123 456"
					placeholderTextColor={c.fillInk}
					style={{ height: 48, borderRadius: 12, backgroundColor: c.card, borderWidth: 2, borderColor: c.border, paddingHorizontal: 14, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink }}
				/>

				{initial ? <MasterMedia master={initial} /> : null}
			</ScrollView>

			<View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 28 + insets.bottom, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.hairline }}>
				<Button
					label={t('Сохранить')}
					height={56}
					disabled={!ready}
					loading={save.isPending}
					onPress={() =>
						save.mutate(
							{
								...form,
								name: form.name.trim(),
								address: form.address.trim(),
								// TODO(design): no city map to drop a pin — without GPS the point is the market.
								lat: form.lat ?? MARKET_POINT.lat,
								lng: form.lng ?? MARKET_POINT.lng,
								brandIds: form.allBrands ? [] : form.brandIds,
								phone: form.phone || undefined,
							},
							{ onSuccess: () => (toast(t('Профиль сохранён')), first ? router.replace('/master') : router.back()) }
						)
					}
				/>
			</View>
		</View>
	)
}

/** Avatar and work photos (up to 8, the first is the cover) — saved right away, like the box photos [22]. */
function MasterMedia({ master: initial }: { master: MyMaster }) {
	const c = useColors()
	const master = useMyMaster().data ?? initial
	const setAvatar = useSetMasterAvatar()
	const setPhotos = useSetMasterPhotos()
	const ids = master.photos.map((p) => p.id)
	const avatar = usePhotoUploads('MASTER', 1, (photo) => setAvatar.mutateAsync(photo.id))
	const photos = usePhotoUploads('MASTER', Math.max(0, 8 - ids.length), (photo) => setPhotos.mutateAsync([...ids, photo.id]))
	const error = setAvatar.error ?? setPhotos.error

	return (
		<>
			<SectionLabel>{t('Фото')}</SectionLabel>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<Pressable onPress={() => avatar.pick('library')}>
					{avatar.photos[0] || master.avatarUrl ? (
						<Image source={{ uri: avatar.photos[0]?.uri ?? resolveUrl(master.avatarUrl) }} style={{ width: 64, height: 64, borderRadius: 32, opacity: avatar.uploading ? 0.5 : 1 }} />
					) : (
						<View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<PhotoIcon size={22} color={c.brandStrong} />
						</View>
					)}
				</Pressable>
			</View>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{master.photos.map((photo) => {
					// Removing goes straight to the server — ask first; ✕ is visible, long press does the same.
					const remove = () =>
						Alert.alert(t('Удалить фото?'), t('Клиенты больше не увидят его в вашем профиле.'), [
							{ text: t('Отмена'), style: 'cancel' },
							{ text: t('Удалить'), style: 'destructive', onPress: () => setPhotos.mutate(ids.filter((id) => id !== photo.id)) },
						])
					return (
						<Pressable key={photo.id} onLongPress={remove}>
							<Image source={{ uri: resolveUrl(photo.thumbUrl) }} style={{ width: 76, height: 76, borderRadius: 12, backgroundColor: c.fill }} />
							<Pressable
								onPress={remove}
								hitSlop={8}
								accessibilityRole="button"
								accessibilityLabel={t('Удалить фото')}
								style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(32,31,29,0.72)', alignItems: 'center', justifyContent: 'center' }}
							>
								<CloseIcon size={12} color={fixed.white} strokeWidth={2.6} />
							</Pressable>
						</Pressable>
					)
				})}
				{photos.photos.map((photo) => (
					<Image key={photo.key} source={{ uri: photo.uri }} style={{ width: 76, height: 76, borderRadius: 12, opacity: 0.5 }} />
				))}
				{ids.length + photos.photos.length < 8 ? (
					<Pressable
						onPress={() => photos.pick('library')}
						style={{ width: 76, height: 76, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: raw.mapRowBorder, alignItems: 'center', justifyContent: 'center', gap: 4 }}
					>
						<PhotoIcon size={20} color={c.brandStrong} />
						<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Фото')}</Text>
					</Pressable>
				) : null}
			</View>
			{master.photos.length ? <Text style={{ fontSize: fs.xs, fontFamily: fontFamily(400), color: c.muted }}>{t('Удержите фото, чтобы удалить')}</Text> : null}
			{error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
		</>
	)
}
