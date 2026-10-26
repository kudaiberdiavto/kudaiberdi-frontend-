import { useEffect, useState } from 'react'
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ProductCard, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { SearchIcon } from '@/components/icons'
import { BackIcon } from '@/components/buyer-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { countLabel, formatPlace, formatPrice, plural } from '@/lib/format'
import { useSearchParts, useSignedIn } from '@/api/catalog'
import { useCategories } from '@/api/directory'
import { useCars } from '@/api/garage'
import type { PartCard } from '@/api/types'
import { type CatalogSort, toPartFilters, useCatalogFilters } from '@/store/useCatalogFilters'
import { useSession } from '@/store/useSession'

const SORTS: { value: CatalogSort; label: string }[] = [
	{ value: 'PRICE_ASC', label: 'Дешевле' },
	{ value: 'PRICE_DESC', label: 'Дороже' },
	{ value: 'NEWEST', label: 'Новые' },
]

/**
 * 27 «Поиск запчастей» — the «Запчасти» tab of the buyer and the master: garage car or any brand, categories,
 * infinite grid. With a car — fitting parts first; without one — all parts. A master has no car of their own:
 * «Выберите марку» (the client's), until then all parts are shown.
 */
export function CatalogScreen({ onBack }: { onBack?: () => void } = {}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const signedIn = useSignedIn()
	const f = useCatalogFilters()
	const cars = useCars()
	const categories = useCategories()
	const [text, setText] = useState(f.q)

	// Debounce typing — the search runs 350 ms after the last key.
	useEffect(() => {
		const timer = setTimeout(() => useCatalogFilters.getState().setQ(text), 350)
		return () => clearTimeout(timer)
	}, [text])

	const carList = signedIn ? (cars.data ?? []) : []
	// A master or СТО has no car of their own — they pick the client's: brand → model.
	const isMaster = useSession((s) => s.role) === 'MASTER'
	const carId = f.carId === undefined ? carList.find((car) => car.isPrimary)?.id ?? null : f.carId
	const search = useSearchParts(toPartFilters({ ...f, carId }))
	const pages = search.data?.pages
	const items = pages?.flatMap((page) => page.items) ?? []
	const total = pages?.[0]?.total
	const fitsTotal = pages?.[0]?.fitsTotal
	const appliedCar = pages?.[0]?.appliedCar
	// Grid rows of two; with a car — fitting parts first, then «Остальные запчасти» (the server sorts them so).
	const rows: Row[] = []
	let pending: PartCard[] = []
	const flush = () => {
		if (pending.length) rows.push({ kind: 'parts', parts: pending })
		pending = []
	}
	for (const part of items) {
		if (appliedCar && part.fits === false && !rows.some((row) => row.kind === 'others')) {
			flush()
			rows.push({ kind: 'others' })
		}
		pending.push(part)
		if (pending.length === 2) flush()
	}
	flush()
	const sort = SORTS.find((s) => s.value === f.sort) ?? SORTS[0]
	const nextSort = SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]

	const header = (
		<View style={{ gap: 14, paddingBottom: 14 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				{onBack ? (
					<Pressable onPress={onBack} hitSlop={10}>
						<BackIcon color={c.ink} />
					</Pressable>
				) : null}
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>Поиск запчастей</Text>
			</View>

			<View
				style={{
					height: 52,
					borderRadius: 14,
					backgroundColor: c.card,
					borderWidth: 2,
					borderColor: c.brand,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
					paddingHorizontal: 12,
				}}
			>
				<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
				<TextInput
					value={text}
					onChangeText={setText}
					placeholder="Стойки, колодки, номер детали…"
					placeholderTextColor="#7D7979"
					returnKeyType="search"
					style={{ flex: 1, minWidth: 0, fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
				/>
			</View>

			<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ИЩУ ДЛЯ МАШИНЫ</Text>

			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
				{carList.map((car) => {
					const active = carId === car.id
					return (
						<Pressable
							key={car.id}
							onPress={() => f.pickCar(car.id)}
							style={{
								height: 44,
								borderRadius: 20,
								paddingLeft: 6,
								paddingRight: 14,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
								backgroundColor: active ? c.brandTint : c.card,
								borderWidth: 2,
								borderColor: active ? c.brand : c.border,
							}}
						>
							<BrandLogo brand={car.brand} size={28} />
							<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.inkSecondary }}>
								{car.label}
							</Text>
						</Pressable>
					)
				})}
				<Pressable
					onPress={() => router.push('/pick-brand')}
					style={{
						height: 44,
						borderRadius: 20,
						paddingLeft: f.brand ? 6 : 14,
						paddingRight: 14,
						backgroundColor: carId === null && f.brand ? c.brandTint : c.card,
						borderWidth: 2,
						borderColor: carId === null && f.brand ? c.brand : c.border,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 8,
					}}
				>
					{carId === null && f.brand ? <BrandLogo brand={f.brand} size={28} /> : null}
					<Text
						style={{
							fontSize: 14,
							fontFamily: fontFamily(carId === null && f.brand ? 700 : 600),
							color: carId === null && f.brand ? c.brandStrong : c.ink,
						}}
					>
						{carId === null && f.brand ? `${f.modelLabel ?? f.brand.shortName} ›` : isMaster ? 'Выберите марку ›' : 'Любая марка ›'}
					</Text>
				</Pressable>
			</ScrollView>

			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
				{[{ id: null, name: 'Все' }, ...(categories.data ?? [])].map((category) => {
					const active = f.categoryId === category.id
					return (
						<Pressable
							key={category.id ?? 'all'}
							onPress={() => f.setCategory(category.id)}
							style={{
								height: 38,
								paddingHorizontal: 14,
								borderRadius: 18,
								backgroundColor: active ? c.brand : c.card,
								borderWidth: active ? 0 : 1,
								borderColor: c.border,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}>{category.name}</Text>
						</Pressable>
					)
				})}
			</ScrollView>

			<QueryErrorBanner error={search.error} onRetry={() => search.refetch()} offlineText="Нет сети. Покажем запчасти, когда появится" />

			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
					{total === undefined ? (
						' '
					) : (
						<>
							{appliedCar && fitsTotal != null ? (
								<>
									<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>
										{fitsTotal} {plural(fitsTotal, ['подходит', 'подходят', 'подходят'])}
									</Text>
									{` к ${appliedCar.displayName}`}
								</>
							) : (
								<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>
									{countLabel(total, ['запчасть', 'запчасти', 'запчастей'])}
								</Text>
							)}
						</>
					)}
				</Text>
				<Pressable onPress={() => f.setSort(nextSort.value)}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{sort.label} ▾</Text>
				</Pressable>
			</View>
		</View>
	)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<FlatList
				data={rows}
				keyExtractor={(row) => (row.kind === 'others' ? 'others' : row.parts.map((part) => part.id).join('-'))}
				ListHeaderComponent={header}
				contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 90, gap: 10 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => search.hasNextPage && !search.isFetchingNextPage && search.fetchNextPage()}
				renderItem={({ item: row }) =>
					row.kind === 'others' ? (
						<Text style={{ paddingTop: 8, fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
							ОСТАЛЬНЫЕ ЗАПЧАСТИ
						</Text>
					) : (
						<View style={{ flexDirection: 'row', gap: 10 }}>
							{row.parts.map((part) => (
								<View key={part.id} style={{ flex: 1 }}>
									<PartTile part={part} />
								</View>
							))}
							{row.parts.length === 1 ? <View style={{ flex: 1 }} /> : null}
						</View>
					)
				}
				ListEmptyComponent={
					search.isSuccess ? (
						<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
							Ничего не нашли. Спросите весь рынок — ответят те, у кого есть.
						</Text>
					) : null
				}
			/>

			<Pressable
				onPress={() =>
					router.push({
						pathname: '/search-part',
						params: { text: f.q.trim() || undefined, carId: carId ? String(carId) : undefined },
					})
				}
				style={{
					position: 'absolute',
					left: 16,
					right: 16,
					bottom: onBack ? insets.bottom + 12 : 12,
					height: 52,
					borderRadius: 14,
					backgroundColor: c.ink,
					paddingHorizontal: 16,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					shadowColor: '#201F1D',
					shadowOpacity: 0.25,
					shadowOffset: { width: 0, height: 8 },
					shadowRadius: 20,
					elevation: 8,
				}}
			>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: '#FFFFFF' }}>Не нашли? Спросите весь рынок</Text>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: '#8FB0FF' }}>Спросить →</Text>
			</Pressable>
		</View>
	)
}

type Row = { kind: 'parts'; parts: PartCard[] } | { kind: 'others' }

function PartTile({ part }: { part: PartCard }) {
	return (
		<ProductCard
			price={formatPrice(part.price)}
			title={part.title}
			fits={part.fits === true}
			location={formatPlace(part.shop)}
			photoUrl={resolveUrl(part.mainPhoto?.thumbUrl ?? part.mainPhoto?.url)}
			shopAvatarUrl={resolveUrl(part.shop.avatarUrl)}
			dimmed={part.stockStatus === 'OUT_OF_STOCK'}
			favorite={part.isFavorite}
			onPress={() => router.push({ pathname: '/part', params: { id: String(part.id) } })}
		/>
	)
}
