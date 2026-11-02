import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { SearchIcon } from '@/components/icons'
import { PlacePlate, QueryErrorBanner, ScreenHeader, Skeleton, SkeletonRepeat } from '@/components/ui'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { shopPlace } from '@/lib/shop-place'
import { flattenPages } from '@/api/pagination'
import { useShopList } from '@/api/catalog'
import type { ShopCard } from '@/api/types'
import { t } from '@/i18n'

/** «Все магазины»: боксы рынка и центры вне рынка — логотип, название, рейтинг, место; поиск по названию. */
export default function ShopsScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [text, setText] = useState('')
	const [q, setQ] = useState('')
	const shops = useShopList(q)
	const items = flattenPages(shops.data)

	// Search 350 ms after the last key.
	useEffect(() => {
		const timer = setTimeout(() => setQ(text), 350)
		return () => clearTimeout(timer)
	}, [text])

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={t('Магазины')} />

			<FlatList
				data={items}
				keyExtractor={(shop) => String(shop.id)}
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 10 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				onEndReached={() => shops.hasNextPage && !shops.isFetchingNextPage && shops.fetchNextPage()}
				ListHeaderComponent={
					<View style={{ gap: 10, paddingBottom: 4 }}>
						<View
							style={{
								height: 52,
								borderRadius: 14,
								backgroundColor: c.card,
								borderWidth: 2,
								borderColor: c.border,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 10,
								paddingHorizontal: 14,
							}}
						>
							<SearchIcon size={22} color={c.muted} strokeWidth={2.4} />
							<TextInput
								value={text}
								onChangeText={setText}
								placeholder={t('Название магазина')}
								placeholderTextColor={c.fillInk}
								style={{ flex: 1, fontSize: fs.lg, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
							/>
						</View>
						<QueryErrorBanner error={shops.error} onRetry={() => shops.refetch()} />
					</View>
				}
				ListEmptyComponent={
					shops.isLoading ? (
						<SkeletonRepeat count={7} gap={10}>
							<ShopRowSkeleton />
						</SkeletonRepeat>
					) : undefined
				}
				ListFooterComponent={shops.isFetchingNextPage ? <ShopRowSkeleton /> : undefined}
				renderItem={({ item }) => <ShopRow shop={item} />}
			/>
		</View>
	)
}

export function ShopRow({ shop }: { shop: ShopCard }) {
	const c = useColors()
	return (
		<Pressable
			onPress={() => router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })}
			style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
		>
			{shop.avatarUrl ? (
				<Image source={{ uri: resolveUrl(shop.avatarUrl) }} style={{ width: 56, height: 56, borderRadius: 28 }} />
			) : (
				<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: fs.h3, fontFamily: fontFamily(700), color: c.brandStrong }}>{shop.name.charAt(0).toUpperCase()}</Text>
				</View>
			)}
			<View style={{ flex: 1, gap: 6 }}>
				<Text numberOfLines={1} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>
					{shop.name}
					{shop.reviewsCount ? (
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted }}>
							{'  '}
							<Text style={{ color: fixed.star }}>★</Text> {shop.rating.toFixed(1)}
						</Text>
					) : null}
				</Text>
				{shop.location ? (
					<PlacePlate row={shop.location.rowCode} box={shop.location.number} />
				) : (
					<Text numberOfLines={1} style={{ fontSize: fs.md, fontFamily: fontFamily(400), color: c.muted }}>{shopPlace(shop)}</Text>
				)}
			</View>
			<Text style={{ fontSize: fs.h2, color: c.muted }}>›</Text>
		</Pressable>
	)
}

export function ShopRowSkeleton() {
	const c = useColors()
	return (
		<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
			<Skeleton width={56} height={56} radius={28} />
			<View style={{ flex: 1, gap: 9 }}>
				<Skeleton width="60%" height={18} />
				<Skeleton width="80%" height={14} />
			</View>
		</View>
	)
}
