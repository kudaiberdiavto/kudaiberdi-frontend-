import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { BottomSheet, BrandLogo, Button, QueryErrorBanner } from '@/components/ui'
import { BackIcon, BrandTile, Label, PlusIcon, TickIcon } from '@/components/seller-v23'
import { LocateIcon, SearchIcon } from '@/components/icons'
import { addressAt, currentCoords } from '@/lib/locate'
import { fontFamily, raw, useColors } from '@/theme'
import { useRowContainers, useRows } from '@/api/market'
import { useBrands } from '@/api/directory'
import { useMyShop, useRegisterShop, useRelocateShop } from '@/api/shop'
import { useSession } from '@/store/useSession'
import { useClaimContainer } from '@/api/complaints'
import { ApiError } from '@/lib/api'
import type { Brand } from '@/api/types'

/** Rows in the order of the mockup grid [11]; rows the mockup doesn't know go after them. */
const ROW_ORDER = ['18', '16', '14', '12', '10', '8', '6', '4', '1', 'Ц', 'Л', 'Н', 'Я', 'С', 'Ж', 'Д', 'В', 'Ю', 'Х', 'У']
/** Brand tiles before «Другие» — as in the mockup. */
const TILES = 5

/**
 * 11 «Где вы продаёте» — registration in one minute: on the Кудайберген market (row, container number) or a shop /
 * centre elsewhere (name, address, the point by geolocation), then brands → POST /shops.
 * With a shop already — moving to another container (brands are changed in «Мой бокс»).
 */
export default function BoxSelectScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const hasShop = useSession((s) => s.hasShop)
	const shop = useMyShop()
	const rows = useRows()
	const brands = useBrands()
	const register = useRegisterShop()
	const relocate = useRelocateShop()

	const current = shop.data?.location
	const [rowId, setRowId] = useState<number | null>(null)
	const [number, setNumber] = useState('')
	const [picked, setPicked] = useState<number[]>([])
	const [othersOpen, setOthersOpen] = useState(false)
	// «Это мой контейнер» — a taken box that is actually yours.
	const [claim, setClaim] = useState<{ id: number; number: number } | null>(null)
	// A seller off the market (a Kia / Toyota centre…): name, address and the point.
	const [onMarket, setOnMarket] = useState(true)
	const store = !hasShop && !onMarket
	const [name, setName] = useState('')
	const [address, setAddress] = useState('')
	const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null)
	const [locating, setLocating] = useState(false)
	const [locateError, setLocateError] = useState<string | null>(null)

	const locate = async () => {
		setLocating(true)
		setLocateError(null)
		try {
			if (!(await Location.requestForegroundPermissionsAsync()).granted) {
				setLocateError('Разрешите доступ к геолокации в настройках')
				return
			}
			const coords = await currentCoords()
			setPoint({ lat: coords.latitude, lng: coords.longitude })
			if (!address.trim()) {
				const address = await addressAt(coords)
				if (address) setAddress(address)
			}
		} catch {
			setLocateError('Не удалось определить место — попробуйте ещё раз')
		} finally {
			setLocating(false)
		}
	}

	const sortedRows = useMemo(() => {
		const rank = (code: string) => (ROW_ORDER.includes(code) ? ROW_ORDER.indexOf(code) : ROW_ORDER.length)
		return [...(rows.data ?? [])].sort((a, b) => rank(a.code) - rank(b.code))
	}, [rows.data])
	const activeRowId = rowId ?? current?.rowId ?? null
	const row = sortedRows.find((r) => r.id === activeRowId)
	const detail = useRowContainers(activeRowId ?? 0)

	// The container by its number in the chosen row.
	const typed = Number(number)
	const slot = number
		? (detail.data?.sides ?? []).flatMap((side) => side.containers).find((item) => item.number === typed)
		: undefined
	const taken = slot ? slot.occupied && slot.id !== current?.containerId : false
	const placeError =
		!row || !number || !detail.isSuccess
			? null
			: !slot
				? `В ряду ${row.code} нет контейнера ${number}`
				: taken
					? `Контейнер ${number} уже занят другим продавцом`
					: null

	const all = brands.data ?? []
	const popular = all.filter((b) => b.popular).slice(0, TILES)
	// Brands picked in «Другие» show up as tiles too.
	const tiles = [...popular, ...all.filter((b) => picked.includes(b.id) && !popular.some((p) => p.id === b.id))]
	const toggle = (id: number) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

	const ready = store
		? Boolean(name.trim() && address.trim() && point && picked.length > 0)
		: Boolean(slot && !taken && (hasShop || picked.length > 0))
	const error = register.error ?? relocate.error
	const field = {
		height: 52,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: c.border,
		backgroundColor: c.card,
		paddingHorizontal: 16,
		fontSize: 17.5,
		fontFamily: fontFamily(500),
		color: c.ink,
	} as const

	const submit = () => {
		if (store) {
			if (!point) return
			register.mutate(
				{ name: name.trim(), address: address.trim(), lat: point.lat, lng: point.lng, brandIds: picked },
				{ onSuccess: () => router.replace('/seller') }
			)
			return
		}
		if (!slot) return
		if (hasShop) relocate.mutate(slot.id, { onSuccess: () => router.back() })
		else register.mutate({ containerId: slot.id, brandIds: picked }, { onSuccess: () => router.replace('/seller') })
	}

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				{router.canGoBack() ? (
					<Pressable onPress={() => router.back()} hitSlop={10}>
						<BackIcon color={c.ink} />
					</Pressable>
				) : null}
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>
					{hasShop ? 'Ваш контейнер' : 'Где вы продаёте'}
				</Text>
			</View>

			<ScrollView
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<QueryErrorBanner error={rows.error ?? detail.error ?? brands.error} onRetry={() => rows.refetch()} />

				{hasShop ? null : (
					<View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: raw.fill, gap: 4 }}>
						{[
							{ value: true, label: 'На рынке Кудайберген' },
							{ value: false, label: 'Магазин или центр' },
						].map((option) => {
							const active = onMarket === option.value
							return (
								<Pressable
									key={option.label}
									onPress={() => setOnMarket(option.value)}
									style={{ flex: 1, height: 40, borderRadius: 11, backgroundColor: active ? c.card : 'transparent', alignItems: 'center', justifyContent: 'center' }}
								>
									<Text style={{ fontSize: 15.5, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.ink : c.muted }}>{option.label}</Text>
								</Pressable>
							)
						})}
					</View>
				)}

				{store ? (
					<>
						<Label>Название</Label>
						<TextInput
							value={name}
							onChangeText={(text) => setName(text.slice(0, 60))}
							placeholder="Например, Kia Центр Бишкек"
							placeholderTextColor={raw.fillInk}
							style={field}
						/>
						<Label>Адрес</Label>
						<TextInput
							value={address}
							onChangeText={(text) => setAddress(text.slice(0, 160))}
							placeholder="ул. Ленина 45"
							placeholderTextColor={raw.fillInk}
							style={field}
						/>
						<Pressable
							onPress={locate}
							disabled={locating}
							style={{ height: 48, borderRadius: 14, backgroundColor: point ? '#E7F6EC' : c.brandTint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<LocateIcon size={20} color={point ? c.success : c.brandStrong} />
							<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: point ? c.success : c.brandStrong }}>
								{locating ? 'Определяем…' : point ? 'Точка определена — обновить' : 'Отметить по геолокации'}
							</Text>
						</Pressable>
						{locateError ? (
							<Text style={{ fontSize: 15, lineHeight: 19, fontFamily: fontFamily(400), color: c.danger }}>{locateError}</Text>
						) : null}
					</>
				) : (
					<>
						<Label>Ряд</Label>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
							{sortedRows.map((item) => {
								const active = item.id === activeRowId
								return (
									<Pressable
										key={item.id}
										onPress={() => setRowId(item.id)}
										style={{
											// Seven in a row: (358 − 6 × 6) / 7.
											width: '12.9%',
											flexGrow: 1,
											height: 40,
											borderRadius: 10,
											borderWidth: 1.5,
											borderColor: active ? c.brand : c.border,
											backgroundColor: active ? c.brand : c.card,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 16.5, fontFamily: fontFamily(active ? 800 : 600), color: active ? '#FFFFFF' : c.ink }}>
											{item.code}
										</Text>
									</Pressable>
								)
							})}
						</View>

						<Label>Номер контейнера</Label>
						<View
							style={{
								height: 56,
								borderRadius: 14,
								backgroundColor: c.card,
								borderWidth: 2,
								borderColor: placeError ? c.danger : c.brand,
								paddingHorizontal: 16,
								justifyContent: 'center',
							}}
						>
							<TextInput
								value={number}
								onChangeText={(text) => setNumber(text.replace(/\D/g, '').slice(0, 4))}
								keyboardType="number-pad"
								placeholder={row ? `Например, 12` : 'Сначала выберите ряд'}
								placeholderTextColor={raw.fillInk}
								style={{ fontSize: 24, fontFamily: fontFamily(800), color: c.ink, padding: 0 }}
							/>
						</View>
						{placeError ? (
							<View style={{ gap: 4 }}>
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{placeError}</Text>
								{taken && slot ? (
									<Text
										onPress={() => setClaim({ id: slot.id, number: slot.number })}
										style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}
									>
										Это мой контейнер
									</Text>
								) : null}
							</View>
						) : null}

					</>
				)}

				{hasShop ? null : (
					<>
						<Label>Какие марки продаёте</Label>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{tiles.map((brand) => (
								<BrandTile key={brand.id} brand={brand} active={picked.includes(brand.id)} onPress={() => toggle(brand.id)} />
							))}
							<Pressable
								onPress={() => setOthersOpen(true)}
								style={{
									flexBasis: '31%',
									flexGrow: 1,
									minHeight: 82,
									borderRadius: 14,
									borderWidth: 2,
									borderStyle: 'dashed',
									borderColor: '#B8C3D3',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 4,
								}}
							>
								<PlusIcon size={20} color={c.brandStrong} />
								<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Другие</Text>
							</Pressable>
						</View>
					</>
				)}

				{error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
			</ScrollView>

			{othersOpen ? (
				<OtherBrands brands={all} picked={picked} onToggle={toggle} onClose={() => setOthersOpen(false)} />
			) : (
				<View
					style={{
						paddingTop: 12,
						paddingHorizontal: 16,
						paddingBottom: Math.max(28, insets.bottom + 12),
						backgroundColor: c.card,
						borderTopWidth: 1,
						borderTopColor: c.hairline,
					}}
				>
					<Button
						label={hasShop ? 'Переехать сюда' : 'Начать получать запросы'}
						disabled={!ready}
						loading={register.isPending || relocate.isPending}
						onPress={submit}
					/>
				</View>
			)}

			<ClaimSheet
				box={claim && row ? { ...claim, place: `${row.label} · конт. ${claim.number}` } : null}
				onClose={() => setClaim(null)}
				onFree={(free) => {
					setClaim(null)
					setNumber(String(free.number))
				}}
			/>
		</View>
	)
}

/** «Другие» — all brands A–Я with search. */
function OtherBrands({
	brands,
	picked,
	onToggle,
	onClose,
}: {
	brands: Brand[]
	picked: number[]
	onToggle: (id: number) => void
	onClose: () => void
}) {
	const c = useColors()
	const [q, setQ] = useState('')
	const query = q.trim().toLowerCase()
	const list = query
		? brands.filter((b) => b.name.toLowerCase().includes(query) || b.shortName.toLowerCase().includes(query))
		: brands

	return (
		<BottomSheet
			onClose={onClose}
			maxHeight={0.8}
			header={
				<View style={{ gap: 12 }}>
					<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>Все марки</Text>
					<View
						style={{
							height: 48,
							borderRadius: 12,
							backgroundColor: c.surface,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
							paddingHorizontal: 12,
						}}
					>
						<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
						<TextInput
							value={q}
							onChangeText={setQ}
							placeholder="Найти марку"
							placeholderTextColor={raw.fillInk}
							style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
						/>
					</View>
				</View>
			}
			footer={<Button label={picked.length ? `Готово · ${picked.length}` : 'Готово'} onPress={onClose} />}
		>
			{list.map((brand) => {
				const active = picked.includes(brand.id)
				return (
					<Pressable key={brand.id} onPress={() => onToggle(brand.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<BrandLogo brand={brand} size={34} />
						<Text style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(400), color: c.ink }}>{brand.name}</Text>
						<View
							style={{
								width: 24,
								height: 24,
								borderRadius: 7,
								borderWidth: 2,
								borderColor: active ? c.brand : c.border,
								backgroundColor: active ? c.brand : 'transparent',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{active ? <TickIcon size={14} color="#FFFFFF" strokeWidth={3} /> : null}
						</View>
					</Pressable>
				)
			})}
		</BottomSheet>
	)
}

/**
 * «Это мой контейнер» — no mockup; a sheet in the style of 09. POST /market/containers/{id}/claim → the dispute goes
 * to the administration, the answer comes as a DISPUTE_RESOLVED push. 409 CONTAINER_FREE — the box is free after all.
 */
function ClaimSheet({
	box,
	onClose,
	onFree,
}: {
	box: { id: number; number: number; place: string } | null
	onClose: () => void
	onFree: (box: { id: number; number: number }) => void
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const claim = useClaimContainer()
	const [text, setText] = useState('')
	const code = claim.error instanceof ApiError ? claim.error.code : null

	const close = () => {
		claim.reset()
		setText('')
		onClose()
	}

	return (
		<Modal visible={box !== null} transparent animationType="slide" onRequestClose={close}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={close} />
				<View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 + insets.bottom, gap: 14 }}>
					{claim.isSuccess ? (
						<>
							<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>Заявка на спор отправлена</Text>
							<Text style={{ fontSize: 16.5, lineHeight: 23, fontFamily: fontFamily(400), color: c.muted }}>
								Администрация рынка проверит, чей это контейнер, и пришлёт пуш с решением.
							</Text>
							<Button label="Понятно" onPress={close} />
						</>
					) : (
						<>
							<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{box?.place ?? ' '} занят</Text>
							<Text style={{ fontSize: 16.5, lineHeight: 23, fontFamily: fontFamily(400), color: c.muted }}>
								Если это ваш контейнер, а в приложении его занял другой продавец, — откройте спор. Администрация рынка разберётся.
							</Text>
							<TextInput
								value={text}
								onChangeText={(v) => setText(v.slice(0, 500))}
								placeholder="Комментарий — необязательно: с какого года аренда, договор…"
								placeholderTextColor={raw.fillInk}
								multiline
								style={{ minHeight: 72, borderRadius: 12, borderWidth: 2, borderColor: c.border, paddingVertical: 10, paddingHorizontal: 14, fontSize: 16.5, fontFamily: fontFamily(400), color: c.ink, textAlignVertical: 'top' }}
							/>
							{claim.error ? (
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{claim.error.message}</Text>
							) : null}
							{code === 'CONTAINER_FREE' && box ? (
								<Button label="Занять этот контейнер" variant="secondary" onPress={() => onFree({ id: box.id, number: box.number })} />
							) : (
								<Button
									label="Это мой контейнер"
									loading={claim.isPending}
									disabled={code === 'OWN_CONTAINER'}
									onPress={() => box && claim.mutate({ containerId: box.id, text: text.trim() || undefined })}
								/>
							)}
						</>
					)}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}
