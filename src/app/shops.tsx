import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { BackIcon } from '@/components/buyer-v23'
import { SearchIcon } from '@/components/icons'
import { QueryErrorBanner } from '@/components/ui'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { shopPlace } from '@/lib/shop-place'
import { flattenPages } from '@/api/pagination'
import { useShopList } from '@/api/catalog'
import type { ShopCard } from '@/api/types'

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
			<View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<Pressable onPress={() => router.back()} hitSlop={10}>
					<BackIcon color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 24, fontFamily: fontFamily(700), color: c.ink }}>Магазины</Text>
			</View>

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
								placeholder="Название магазина"
								placeholderTextColor={raw.fillInk}
								style={{ flex: 1, fontSize: 17, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
							/>
						</View>
						<QueryErrorBanner error={shops.error} onRetry={() => shops.refetch()} />
					</View>
				}
				ListEmptyComponent={shops.isPending ? <ActivityIndicator color={c.muted} style={{ paddingTop: 40 }} /> : null}
				renderItem={({ item }) => <ShopRow shop={item} />}
			/>
		</View>
	)
}

function ShopRow({ shop }: { shop: ShopCard }) {
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
					<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.brandStrong }}>{shop.name.charAt(0).toUpperCase()}</Text>
				</View>
			)}
			<View style={{ flex: 1, gap: 3 }}>
				<Text numberOfLines={1} style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>
					{shop.name}
				</Text>
				<Text numberOfLines={1} style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
					{shop.reviewsCount ? <Text style={{ color: '#F5A623' }}>★ </Text> : null}
					{shop.reviewsCount ? `${shop.rating.toFixed(1)} · ` : ''}
					{shopPlace(shop)}
				</Text>
			</View>
			<Text style={{ fontSize: 24, color: c.muted }}>›</Text>
		</Pressable>
	)
}
