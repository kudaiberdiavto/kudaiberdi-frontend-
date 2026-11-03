import { useRef, useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { router, useScrollToTop } from 'expo-router'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { usePullRefresh } from '@/lib/use-pull-refresh'
import { Badge, PhotoPlaceholder, QueryErrorBanner, Screen, Skeleton, SkeletonRepeat } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, PlusIcon, SearchIcon } from '@/components/icons'
import { ReelsIcon } from '@/components/video-v23'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatNumber, formatPrice, plural } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useMyParts, useMyPartsSummary } from '@/api/parts'
import type { MyPartItem, MyPartsFilter } from '@/api/types'
import { usePartDraft } from '@/store/usePartDraft'
import { t } from '@/i18n'
import { PlayIcon } from '@/components/voice'

/** 24 «Мои запчасти» (tab «Товары»). Counters come from GET /my/parts/summary. */
export default function SellerProductsScreen() {
	const c = useColors()
	// Tapping the active tab again scrolls back to the top, as in every app.
	const list = useRef<FlatList<MyPartItem>>(null)
	useScrollToTop(list)
	const [compact, setCompact] = useState(false)
	const lastY = useRef(0)
	const [filter, setFilter] = useState<MyPartsFilter>('ALL')
	const [q, setQ] = useState('')
	const summary = useMyPartsSummary()
	const parts = useMyParts(filter, q.trim())
	const pull = usePullRefresh(() => [parts.refetch(), summary.refetch()])
	const items = flattenPages(parts.data)
	const s = summary.data

	const filters: { value: MyPartsFilter; label: string }[] = [
		{ value: 'ALL', label: t('Все · {0}', s?.all ?? 0) },
		{ value: 'IN_STOCK', label: t('В наличии · {0}', s?.inStock ?? 0) },
		{ value: 'OUT_OF_STOCK', label: t('Нет · {0}', s?.outOfStock ?? 0) },
		...(s?.drafts ? [{ value: 'DRAFT' as const, label: t('Черновики · {0}', s.drafts) }] : []),
	]

	const newPart = (to: '/new-part' | '/camera') => {
		usePartDraft.getState().reset()
		router.push(to)
	}

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<Text style={{ flex: 1, fontSize: fs.h1, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>{t('Мои запчасти')}</Text>
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
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Видео')}</Text>
				</Pressable>
				<Pressable accessibilityRole="button" accessibilityLabel={t('Снять запчасть')}
					onPress={() => newPart('/camera')}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}
				>
					<CameraIcon size={20} color={c.brandStrong} strokeWidth={2.2} />
				</Pressable>
			</View>

			<FlatList
				ref={list}
				data={items}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, paddingBottom: 88 }}
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={100}
				onScroll={(e) => {
					const y = e.nativeEvent.contentOffset.y
					if (y > lastY.current + 8 && y > 40) setCompact(true)
					else if (y < lastY.current - 8 || y <= 0) setCompact(false)
					lastY.current = y
				}}
				onEndReached={() => parts.hasNextPage && !parts.isFetchingNextPage && parts.fetchNextPage()}
				onRefresh={pull.onRefresh}
				refreshing={pull.refreshing}
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
								placeholder={t('Поиск по моим запчастям')}
								placeholderTextColor={c.fillInk}
								style={{ flex: 1, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
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
										<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: active ? fixed.white : c.ink }}>{item.label}</Text>
									</Pressable>
								)
							})}
						</View>

						<QueryErrorBanner error={parts.error ?? summary.error} onRetry={() => parts.refetch()} />

						{s ? (
							<Text style={{ fontSize: fs.md, fontFamily: fontFamily(400), color: c.muted }}>
								{t('Покупатели посмотрели ваши запчасти')}{' '}
								<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>
									{formatNumber(s.viewsWeek)} {plural(s.viewsWeek, [t('раз'), t('раза'), t('раз')])}
								</Text>{' '}
								{t('за неделю')}
							</Text>
						) : null}

						{parts.isSuccess && items.length === 0 ? (
							<Text style={{ fontSize: fs.base, lineHeight: 23, fontFamily: fontFamily(400), color: c.muted }}>
								{q.trim() ? t('Ничего не нашли') : t('Товаров нет')}
							</Text>
						) : null}
					</View>
				}
				renderItem={({ item }) => <PartRow part={item} />}
				ListEmptyComponent={
					parts.isLoading ? (
						<SkeletonRepeat count={6} gap={10}>
							<PartRowSkeleton />
						</SkeletonRepeat>
					) : undefined
				}
				ListFooterComponent={parts.isFetchingNextPage ? <PartRowSkeleton /> : undefined}
			/>

			{/* Scrolling down folds it into «+» in the corner (it stops covering the last rows), scrolling up opens it again. */}
			<Animated.View
				layout={LinearTransition.duration(180)}
				style={{ position: 'absolute', bottom: 16, ...(compact ? { right: 16 } : { alignSelf: 'center' }) }}
			>
				<Pressable
					onPress={() => newPart('/new-part')}
					accessibilityRole="button"
					accessibilityLabel={t('Выложить запчасть')}
					style={{
						height: 56,
						minWidth: 56,
						borderRadius: 28,
						backgroundColor: c.brand,
						paddingHorizontal: compact ? 0 : 22,
						paddingLeft: compact ? 0 : 18,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
						shadowColor: c.brand,
						shadowOpacity: 0.35,
						shadowOffset: { width: 0, height: 8 },
						shadowRadius: 20,
						elevation: 8,
					}}
				>
					<PlusIcon size={22} color={fixed.white} strokeWidth={2.6} />
					{compact ? null : <Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{t('Выложить запчасть')}</Text>}
				</Pressable>
			</Animated.View>
		</Screen>
	)
}

function PartRow({ part }: { part: MyPartItem }) {
	const c = useColors()
	// a video part has no photo — its poster is the thumbnail
	const photo = resolveUrl(part.mainPhoto?.thumbUrl ?? part.mainPhoto?.url ?? part.videoPosterUrl)
	const badge =
		part.status === 'DRAFT'
			? { label: t('Черновик'), tone: 'neutral' as const }
			: part.status === 'ARCHIVED'
				? { label: t('В архиве'), tone: 'muted' as const }
				: part.stockStatus === 'IN_STOCK'
					? { label: t('В наличии'), tone: 'success' as const }
					: { label: t('Нет'), tone: 'muted' as const }

	return (
		<Pressable
			onPress={() => router.push({ pathname: '/new-part', params: { id: String(part.id) } })}
			style={{ flexDirection: 'row', gap: 12, borderRadius: 16, backgroundColor: c.card, padding: 10 }}
		>
			<View>
				{photo ? (
					<Image source={{ uri: photo }} style={{ width: 80, height: 80, borderRadius: 10 }} />
				) : (
					<PhotoPlaceholder width={80} height={80} radius={10} />
				)}
				{part.videoPosterUrl ? (
					<View style={{ position: 'absolute', right: 5, bottom: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 }}>
						<PlayIcon size={10} />
					</View>
				) : null}
			</View>
			<View style={{ flex: 1, gap: 6 }}>
				<Text numberOfLines={2} style={{ fontSize: fs.base, lineHeight: 20.5, fontFamily: fontFamily(700), color: c.ink }}>
					{part.title || t('Без названия')}
				</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
					<Text numberOfLines={1} style={{ flexShrink: 1, fontSize: fs.sm, fontFamily: fontFamily(400), color: c.inkSecondary }}>
						{part.fitmentLabels.join(', ') || t('Машины не указаны')}
					</Text>
					{part.brands[0] ? <BrandLogo brand={part.brands[0]} size={18} /> : null}
				</View>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(800), color: c.ink }}>{formatPrice(part.price) || '—'}</Text>
					<Badge label={badge.label} tone={badge.tone} />
				</View>
			</View>
		</Pressable>
	)
}

function PartRowSkeleton() {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', gap: 12, borderRadius: 16, backgroundColor: c.card, padding: 10 }}>
			<Skeleton width={80} height={80} radius={10} />
			<View style={{ flex: 1, gap: 8, paddingVertical: 2 }}>
				<Skeleton width="80%" height={16} />
				<Skeleton width="55%" height={13} />
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
					<Skeleton width={90} height={19} />
					<Skeleton width={72} height={22} radius={11} />
				</View>
			</View>
		</View>
	)
}
