import { useState } from 'react'
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Badge, PhotoPlaceholder, QueryErrorBanner, Screen } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, PlusIcon, SearchIcon } from '@/components/icons'
import { ReelsIcon } from '@/components/video-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatNumber, formatPrice, plural } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useMyParts, useMyPartsSummary } from '@/api/parts'
import type { MyPartItem, MyPartsFilter } from '@/api/types'
import { usePartDraft } from '@/store/usePartDraft'

/** 24 «Мои запчасти» (tab «Товары»). Counters come from GET /my/parts/summary. */
export default function SellerProductsScreen() {
	const c = useColors()
	const [filter, setFilter] = useState<MyPartsFilter>('ALL')
	const [q, setQ] = useState('')
	const summary = useMyPartsSummary()
	const parts = useMyParts(filter, q.trim())
	const items = flattenPages(parts.data)
	const s = summary.data

	const filters: { value: MyPartsFilter; label: string }[] = [
		{ value: 'ALL', label: `Все · ${s?.all ?? 0}` },
		{ value: 'IN_STOCK', label: `В наличии · ${s?.inStock ?? 0}` },
		{ value: 'OUT_OF_STOCK', label: `Нет · ${s?.outOfStock ?? 0}` },
		...(s?.drafts ? [{ value: 'DRAFT' as const, label: `Черновики · ${s.drafts}` }] : []),
	]

	const newPart = (to: '/new-part' | '/camera') => {
		usePartDraft.getState().reset()
		router.push(to)
	}

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<Text style={{ flex: 1, fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>
					Мои запчасти
				</Text>
				<Pressable
					onPress={() => router.push('/seller-video')}
					style={{
						height: 40,
						paddingHorizontal: 12,
						borderRadius: 20,
						backgroundColor: c.card,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 6,
					}}
				>
					<ReelsIcon size={20} color={c.brandStrong} strokeWidth={2.2} />
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Видео</Text>
				</Pressable>
				<Pressable
					onPress={() => newPart('/camera')}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}
				>
					<CameraIcon size={20} color={c.brandStrong} strokeWidth={2.2} />
				</Pressable>
			</View>

			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, paddingBottom: 88 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => parts.hasNextPage && !parts.isFetchingNextPage && parts.fetchNextPage()}
				onRefresh={() => {
					parts.refetch()
					summary.refetch()
				}}
				refreshing={false}
				ListHeaderComponent={
					<View style={{ gap: 10 }}>
						<View
							style={{
								height: 44,
								borderRadius: 12,
								backgroundColor: c.card,
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
								placeholder="Поиск по моим запчастям"
								placeholderTextColor="#7D7979"
								style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
							/>
						</View>

						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{filters.map((item) => {
								const active = filter === item.value
								return (
									<Pressable
										key={item.value}
										onPress={() => setFilter(item.value)}
										style={{
											height: 36,
											paddingHorizontal: 14,
											borderRadius: 18,
											backgroundColor: active ? c.brand : c.card,
											borderWidth: active ? 0 : 1.5,
											borderColor: c.border,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}>{item.label}</Text>
									</Pressable>
								)
							})}
						</View>

						<QueryErrorBanner error={parts.error ?? summary.error} onRetry={() => parts.refetch()} />

						{s ? (
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
								Покупатели посмотрели ваши запчасти{' '}
								<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>
									{formatNumber(s.viewsWeek)} {plural(s.viewsWeek, ['раз', 'раза', 'раз'])}
								</Text>{' '}
								за неделю
							</Text>
						) : null}

						{parts.isSuccess && items.length === 0 ? (
							<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
								{q.trim() ? 'Ничего не нашли' : 'Выложите запчасти — покупатели найдут их в поиске и на карте рынка.'}
							</Text>
						) : null}
					</View>
				}
				renderItem={({ item }) => <PartRow part={item} />}
			/>

			<Pressable
				onPress={() => newPart('/new-part')}
				style={{
					position: 'absolute',
					alignSelf: 'center',
					bottom: 16,
					height: 56,
					borderRadius: 28,
					backgroundColor: c.brand,
					paddingHorizontal: 22,
					paddingLeft: 18,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 8,
					shadowColor: c.brand,
					shadowOpacity: 0.35,
					shadowOffset: { width: 0, height: 8 },
					shadowRadius: 20,
					elevation: 8,
				}}
			>
				<PlusIcon size={22} color="#FFFFFF" strokeWidth={2.6} />
				<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Выложить запчасть</Text>
			</Pressable>
		</Screen>
	)
}

function PartRow({ part }: { part: MyPartItem }) {
	const c = useColors()
	const photo = resolveUrl(part.mainPhoto?.thumbUrl ?? part.mainPhoto?.url)
	const badge =
		part.status === 'DRAFT'
			? { label: 'Черновик', tone: 'neutral' as const }
			: part.status === 'ARCHIVED'
				? { label: 'В архиве', tone: 'muted' as const }
				: part.stockStatus === 'IN_STOCK'
					? { label: 'В наличии', tone: 'success' as const }
					: { label: 'Нет', tone: 'muted' as const }

	return (
		<Pressable
			onPress={() => router.push({ pathname: '/new-part', params: { id: String(part.id) } })}
			style={{ flexDirection: 'row', gap: 12, borderRadius: 16, backgroundColor: c.card, padding: 10 }}
		>
			{photo ? (
				<Image source={{ uri: photo }} style={{ width: 80, height: 80, borderRadius: 10 }} />
			) : (
				<PhotoPlaceholder width={80} height={80} radius={10} />
			)}
			<View style={{ flex: 1, gap: 6 }}>
				<Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 18.75, fontFamily: fontFamily(700), color: c.ink }}>
					{part.title || 'Без названия'}
				</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
					<Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 13, fontFamily: fontFamily(400), color: c.inkSecondary }}>
						{part.fitmentLabels.join(', ') || 'Машины не указаны'}
					</Text>
					{part.brands[0] ? <BrandLogo brand={part.brands[0]} size={18} /> : null}
				</View>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(800), color: c.ink }}>{formatPrice(part.price) || '—'}</Text>
					<Badge label={badge.label} tone={badge.tone} />
				</View>
			</View>
		</Pressable>
	)
}
