import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MarketMapLive, type MarketMapLiveHandle } from '@/components/market-map-live'
import { BrandLogo } from '@/components/ui/brand'
import { QueryErrorBanner } from '@/components/ui'
import { Caps, ChevronIcon, CrossIcon, LoupeIcon, TopBar } from '@/components/buyer-v23'
import { fontFamily, raw, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { useBrands, useCategories } from '@/api/directory'
import { useCars } from '@/api/garage'
import { useMapHighlight } from '@/api/market'
import { useSignedIn } from '@/api/catalog'
import type { Brand } from '@/api/types'
import { useCatalogFilters } from '@/store/useCatalogFilters'

type Filter = { kind: 'BRAND'; brand: Brand } | { kind: 'CATEGORY'; id: number; name: string }

/** Rows shown before «Все». */
const PREVIEW = 4

/** 09 «Рынок»: where your brand (or a part) is sold — rows on the scheme and the list of rows. */
export default function BuyerMarketScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [picked, setPicked] = useState<Filter | null>(null)
	const [q, setQ] = useState('')
	const [all, setAll] = useState(false)
	const mapRef = useRef<MarketMapLiveHandle>(null)

	const signedIn = useSignedIn()
	const popular = useBrands({ popular: true })
	const found = useBrands(q.trim() ? { q: q.trim() } : {})
	const categories = useCategories()
	const primaryBrand = useCars().data?.find((car) => car.isPrimary)?.brand
	// Default — the primary car's brand, else the first popular one.
	const defaultBrand = (signedIn ? primaryBrand : undefined) ?? popular.data?.[0]
	const filter: Filter | null = picked ?? (defaultBrand ? { kind: 'BRAND', brand: defaultBrand } : null)
	const highlight = useMapHighlight(filter?.kind ?? 'BRAND', filter ? (filter.kind === 'BRAND' ? filter.brand.id : filter.id) : undefined)
	const h = highlight.data
	const rows = h?.rows ?? []
	const name = filter ? (filter.kind === 'BRAND' ? filter.brand.name : filter.name) : ''

	// Chips: the selected brand first, then the other popular ones.
	const chips = [
		...(filter?.kind === 'BRAND' ? [filter.brand] : []),
		...(popular.data ?? []).filter((brand) => filter?.kind !== 'BRAND' || brand.id !== filter.brand.id),
	].slice(0, 8)
	const query = q.trim().toLowerCase()
	const brandHits = query ? (found.data ?? []).slice(0, 4) : []
	const categoryHits = query ? (categories.data ?? []).filter((category) => category.name.toLowerCase().includes(query)).slice(0, 3) : []

	/** Parts for sale with the same brand or category — the catalog (selling parts stays as it was). */
	const openCatalog = () => {
		const f = useCatalogFilters.getState()
		if (filter?.kind === 'BRAND') f.pickBrand(filter.brand, null)
		if (filter?.kind === 'CATEGORY') f.setCategory(filter.id)
		router.push('/catalog')
	}

	const choose = (next: Filter) => {
		setPicked(next)
		setQ('')
		setAll(false)
	}

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar title="Рынок" big onBack={false} />

			<ScrollView
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View
					style={{
						height: 48,
						borderRadius: 14,
						borderWidth: 2,
						borderColor: c.border,
						backgroundColor: c.card,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
						paddingHorizontal: 14,
					}}
				>
					<LoupeIcon size={20} color={c.muted} />
					<TextInput
						value={q}
						onChangeText={setQ}
						placeholder="Марка или запчасть"
						placeholderTextColor="#8C8888"
						style={{ flex: 1, minWidth: 0, fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>

				{query ? (
					<View style={{ borderRadius: 14, backgroundColor: c.card, overflow: 'hidden' }}>
						{brandHits.map((brand) => (
							<Pressable
								key={`brand-${brand.id}`}
								onPress={() => choose({ kind: 'BRAND', brand })}
								style={{ paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: c.hairline }}
							>
								<BrandLogo brand={brand} size={28} />
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>{brand.name}</Text>
							</Pressable>
						))}
						{categoryHits.map((category) => (
							<Pressable
								key={`category-${category.id}`}
								onPress={() => choose({ kind: 'CATEGORY', id: category.id, name: category.name })}
								style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: c.hairline }}
							>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>{category.name}</Text>
							</Pressable>
						))}
						{brandHits.length + categoryHits.length === 0 ? (
							<Text style={{ padding: 14, fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Ничего не нашли</Text>
						) : null}
					</View>
				) : null}

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
					{filter?.kind === 'CATEGORY' ? (
						<SelectedChip label={filter.name} onClear={() => setPicked(null)} />
					) : null}
					{chips.map((brand) => {
						const active = filter?.kind === 'BRAND' && filter.brand.id === brand.id
						return (
							<Pressable
								key={brand.id}
								onPress={() => (active ? setPicked(null) : choose({ kind: 'BRAND', brand }))}
								style={{
									height: 40,
									paddingLeft: 6,
									paddingRight: active ? 12 : 14,
									borderRadius: 20,
									backgroundColor: active ? c.brandTint : c.card,
									borderWidth: 2,
									borderColor: active ? c.brand : c.border,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<BrandLogo brand={brand} size={28} />
								<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.inkSecondary }}>
									{brand.shortName ?? brand.name}
								</Text>
								{active ? <CrossIcon size={16} color={c.brandStrong} strokeWidth={2.6} /> : null}
							</Pressable>
						)
					})}
				</ScrollView>

				<View style={{ height: 330, borderRadius: 18, overflow: 'hidden', backgroundColor: raw.mapSurface }}>
					<MarketMapLive ref={mapRef} highlightedRowIds={h?.rowIds} />
				</View>

				<QueryErrorBanner error={highlight.error} onRetry={() => highlight.refetch()} />

				{h ? (
					<>
						<Caps link={rows.length > PREVIEW ? (all ? 'Свернуть' : 'Все') : undefined} onLink={() => setAll(!all)}>
							{`${name} — ${rows.length} ${plural(rows.length, ['ряд', 'ряда', 'рядов'])}`}
						</Caps>
						{rows.length ? (
							<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 8 }}>
								{(all ? rows : rows.slice(0, PREVIEW)).map((row) => (
									<Pressable
										key={row.rowId}
										onPress={() => mapRef.current?.focusOnRow(row.rowId, 18)}
										style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
									>
										<View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
											<Text style={{ fontSize: 15, fontFamily: fontFamily(800), color: c.brandStrong }}>{row.rowCode}</Text>
										</View>
										<View style={{ flex: 1, gap: 1 }}>
											<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{row.rowLabel}</Text>
											<Text style={{ fontSize: 13.5, fontFamily: fontFamily(400), color: c.muted }}>
												{row.containers} {plural(row.containers, ['контейнер', 'контейнера', 'контейнеров'])} с {name}
											</Text>
										</View>
										<ChevronIcon size={20} color="#B8B4B4" />
									</Pressable>
								))}
							</View>
						) : (
							<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Пока никто не продаёт {name} на рынке</Text>
						)}
						<Pressable
							onPress={openCatalog}
							style={{ height: 52, borderRadius: 14, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
						>
							<LoupeIcon size={20} color={c.brand} />
							<Text style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>Запчасти {name} в продаже</Text>
							<ChevronIcon size={20} color="#B8B4B4" />
						</Pressable>
					</>
				) : null}
			</ScrollView>
		</View>
	)
}

function SelectedChip({ label, onClear }: { label: string; onClear: () => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onClear}
			style={{
				height: 40,
				paddingLeft: 14,
				paddingRight: 12,
				borderRadius: 20,
				backgroundColor: c.brandTint,
				borderWidth: 2,
				borderColor: c.brand,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 8,
			}}
		>
			<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{label}</Text>
			<CrossIcon size={16} color={c.brandStrong} strokeWidth={2.6} />
		</Pressable>
	)
}
