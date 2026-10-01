import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MarketMapLive, type MarketMapLiveHandle } from '@/components/market-map-live'
import { LocateIcon, SearchIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { countLabel, formatPlace, plural } from '@/lib/format'
import { useBrands, useCategories } from '@/api/directory'
import { useCars } from '@/api/garage'
import { useMapHighlight, useMarketSearch } from '@/api/market'
import { useSignedIn } from '@/api/catalog'
import { useCatalogFilters } from '@/store/useCatalogFilters'

const MODES = ['Марка', 'Запчасть'] as const
const FILTERS = ['Ряды', 'Магазины', 'Парковка', 'Туалет']

const cardShadow = {
	shadowColor: '#201F1D',
	shadowOpacity: 0.12,
	shadowOffset: { width: 0, height: 2 },
	shadowRadius: 5,
	elevation: 3,
}

export default function BuyerMarketScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [mode, setMode] = useState(0)
	const [brandId, setBrandId] = useState<number | null>(null)
	const [categoryId, setCategoryId] = useState<number | null>(null)
	const [q, setQ] = useState('')
	const [searchOpen, setSearchOpen] = useState(false)
	const mapRef = useRef<MarketMapLiveHandle>(null)

	const signedIn = useSignedIn()
	const brands = useBrands({ popular: true })
	const categories = useCategories()
	const primaryBrand = useCars().data?.find((car) => car.isPrimary)?.brand
	// Default brand: the primary car's brand, else the first popular one.
	const activeBrandId = brandId ?? (signedIn ? primaryBrand?.id : undefined) ?? brands.data?.[0]?.id
	const activeCategoryId = categoryId ?? categories.data?.[0]?.id
	const kind = mode === 0 ? 'BRAND' : 'CATEGORY'
	const highlight = useMapHighlight(kind, mode === 0 ? activeBrandId : activeCategoryId)
	const h = highlight.data
	const search = useMarketSearch(searchOpen ? q : '')

	// The mockup keeps the whole market in view — highlighted rows are visible without flying in;
	// the camera moves only for a search result.

	const legend = [
		{ label: 'Проход', background: '#FFF7E0', border: '#E3C88A', radius: 0, width: 1 },
		{ label: h ? `Есть ${h.name}` : 'Есть', background: '#EDF2FF', border: '#2155E6', radius: 2, width: 1.5 },
		{ label: 'Ряд', background: '#DCE3EE', border: '#BCC6D5', radius: 2, width: 1 },
	]

	const showList = () => {
		const f = useCatalogFilters.getState()
		const brand = brands.data?.find((b) => b.id === activeBrandId)
		if (mode === 0 && brand) f.pickBrand(brand, null)
		if (mode === 1 && activeCategoryId) f.setCategory(activeCategoryId)
		router.push('/catalog')
	}

	return (
		<View style={{ flex: 1, backgroundColor: raw.mapSurface }}>
			<MarketMapLive ref={mapRef} highlightedRowIds={h?.rowIds} />

			<View style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 10 }}>
				<View
					style={[
						{
							height: 48,
							borderRadius: 14,
							backgroundColor: c.card,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
							paddingHorizontal: 14,
						},
						cardShadow,
					]}
				>
					<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
					<TextInput
						value={q}
						onChangeText={(text) => {
							setQ(text)
							setSearchOpen(true)
						}}
						placeholder="Ряд, бокс или магазин"
						placeholderTextColor={c.muted}
						style={{ flex: 1, minWidth: 0, fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>

				{searchOpen && q.trim() && search.data ? (
					<View style={[{ marginTop: 6, borderRadius: 14, backgroundColor: c.card, overflow: 'hidden' }, cardShadow]}>
						{search.data.rows.slice(0, 3).map((row) => (
							<Pressable
								key={`row-${row.id}`}
								onPress={() => {
									setSearchOpen(false)
									mapRef.current?.focusOnRow(row.id, 18)
								}}
								style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: c.hairline }}
							>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>{row.label}</Text>
							</Pressable>
						))}
						{search.data.containers.slice(0, 4).map((box) => (
							<Pressable
								key={`box-${box.containerId}`}
								onPress={() => {
									setSearchOpen(false)
									router.push({ pathname: '/route', params: { containerId: String(box.containerId) } })
								}}
								style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: c.hairline }}
							>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>{formatPlace(box)}</Text>
							</Pressable>
						))}
						{search.data.rows.length + search.data.containers.length === 0 ? (
							<Text style={{ padding: 14, fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Ничего не нашли</Text>
						) : null}
					</View>
				) : null}
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 66 }}
				contentContainerStyle={{ gap: 8, paddingLeft: 16, paddingRight: 16 }}
			>
				{FILTERS.map((label) => (
					<View
						key={label}
						style={[
							{
								height: 36,
								borderRadius: 18,
								paddingHorizontal: 14,
								backgroundColor: c.card,
								alignItems: 'center',
								justifyContent: 'center',
							},
							cardShadow,
						]}
					>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>{label}</Text>
					</View>
				))}
			</ScrollView>

			<View
				style={[
					{
						position: 'absolute',
						left: 16,
						bottom: 196,
						paddingVertical: 8,
						paddingHorizontal: 10,
						borderRadius: 12,
						backgroundColor: 'rgba(255,255,255,0.94)',
						gap: 6,
					},
					cardShadow,
				]}
			>
				{legend.map((item) => (
					<View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<View
							style={{
								width: 16,
								height: 8,
								borderRadius: item.radius,
								backgroundColor: item.background,
								borderWidth: item.width,
								borderColor: item.border,
							}}
						/>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: c.inkSecondary }}>{item.label}</Text>
					</View>
				))}
			</View>

			<View
				style={[
					{
						position: 'absolute',
						right: 16,
						bottom: 252,
						width: 48,
						borderRadius: 14,
						backgroundColor: c.card,
						alignItems: 'center',
					},
					cardShadow,
				]}
			>
				<Pressable onPress={() => mapRef.current?.zoomBy(1)} style={{ height: 46, justifyContent: 'center' }}>
					<Text style={{ fontSize: 24, fontFamily: fontFamily(500), color: c.ink }}>+</Text>
				</Pressable>
				<View style={{ width: 28, height: 1, backgroundColor: c.hairline }} />
				<Pressable onPress={() => mapRef.current?.zoomBy(-1)} style={{ height: 46, justifyContent: 'center' }}>
					<Text style={{ fontSize: 24, fontFamily: fontFamily(500), color: c.ink }}>−</Text>
				</Pressable>
			</View>

			<Pressable
				onPress={() => mapRef.current?.focusOnMe()}
				style={[
					{
						position: 'absolute',
						right: 16,
						bottom: 196,
						width: 48,
						height: 48,
						borderRadius: 14,
						backgroundColor: c.card,
						alignItems: 'center',
						justifyContent: 'center',
					},
					cardShadow,
				]}
			>
				<LocateIcon size={24} color={c.brand} />
			</Pressable>

			<View
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 10,
					paddingHorizontal: 16,
					paddingBottom: 16,
					gap: 12,
					shadowColor: '#201F1D',
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: -4 },
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

				<View style={{ height: 40, borderRadius: 12, backgroundColor: c.surface, padding: 3, flexDirection: 'row' }}>
					{MODES.map((label, i) => {
						const active = mode === i
						return (
							<Pressable
								key={label}
								onPress={() => setMode(i)}
								style={[
									{
										flex: 1,
										borderRadius: 9,
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: active ? c.card : 'transparent',
									},
									active && {
										shadowColor: '#201F1D',
										shadowOpacity: 0.12,
										shadowOffset: { width: 0, height: 1 },
										shadowRadius: 1.5,
										elevation: 1,
									},
								]}
							>
								<Text
									style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? c.ink : c.muted }}
								>
									{label}
								</Text>
							</Pressable>
						)
					})}
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 8, paddingRight: 16 }}
					style={{ marginRight: -16 }}
				>
					{(mode === 0
						? (brands.data ?? []).map((b) => ({ id: b.id, label: b.name }))
						: (categories.data ?? []).map((cat) => ({ id: cat.id, label: cat.name }))
					).map(({ id, label }) => {
						const active = id === (mode === 0 ? activeBrandId : activeCategoryId)
						return (
							<Pressable
								key={id}
								onPress={() => (mode === 0 ? setBrandId(id) : setCategoryId(id))}
								style={{
									height: 36,
									paddingHorizontal: 14,
									borderRadius: 18,
									backgroundColor: active ? c.brand : c.surface,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text
									style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}
								>
									{active ? `✓ ${label}` : label}
								</Text>
							</Pressable>
						)
					})}
				</ScrollView>

				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<View style={{ gap: 2 }}>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
							{h
								? h.rowsCount
									? `${h.name} — в ${h.rowsCount} ${plural(h.rowsCount, ['ряду', 'рядах', 'рядах'])}`
									: `${h.name} — пока нигде`
								: ' '}
						</Text>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
							{h && h.rowsCount
								? `${countLabel(h.shopsCount, ['бокс', 'бокса', 'боксов'])}` +
									(h.nearestRow ? ` · ближайший ряд ${h.nearestRow}${h.nearestDistanceM ? `, ${h.nearestDistanceM} м` : ''}` : '')
								: highlight.isError
									? 'Нет сети'
									: ' '}
						</Text>
					</View>
					<Text onPress={showList} style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>
						Списком
					</Text>
				</View>
			</View>
		</View>
	)
}
