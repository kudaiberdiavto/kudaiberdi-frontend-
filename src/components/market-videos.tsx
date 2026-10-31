import { useCallback, useState } from 'react'
import { FlatList, Text, View, type ViewToken } from 'react-native'
import { router, useIsFocused } from 'expo-router'
import { VideoTile } from '@/components/video-v23'
import { fontFamily, useColors } from '@/theme'
import { flattenPages } from '@/api/pagination'
import { useVideoFeed } from '@/api/catalog'
import type { VideoFeedItem } from '@/api/types'
import { useVideoViewer } from '@/store/useVideoViewer'
import { marketPlace } from '@/lib/shop-place'

/**
 * Videos from the market — ads, the same for everyone (not tied to a car): tiles play by themselves without sound,
 * a tap opens the feed on that video.
 */
export function MarketVideos() {
	const c = useColors()
	const feed = useVideoFeed()
	const items = flattenPages(feed.data)
	const focused = useIsFocused()
	const [visible, setVisible] = useState<number[]>([0, 1, 2])
	// FlatList wants the same callback for its whole life.
	const onViewable = useCallback(
		({ viewableItems }: { viewableItems: ViewToken<VideoFeedItem>[] }) =>
			setVisible(viewableItems.flatMap((token) => (token.index == null ? [] : [token.index]))),
		[]
	)

	if (!items.length) return null

	const openFeed = (partId?: number) => {
		if (partId) useVideoViewer.getState().openVideo(partId)
		router.push('/videos')
	}

	return (
		<View style={{ gap: 10, paddingTop: 2 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<View style={{ flex: 1 }} />
				<Text onPress={() => openFeed()} style={{ flexShrink: 0, fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>
					Смотреть все
				</Text>
			</View>
			<FlatList
				horizontal
				data={items}
				keyExtractor={(item) => String(item.partId)}
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ gap: 8 }}
				style={{ marginHorizontal: -16 }}
				ListHeaderComponent={<View style={{ width: 8 }} />}
				ListFooterComponent={<View style={{ width: 8 }} />}
				onViewableItemsChanged={onViewable}
				viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
				renderItem={({ item, index }) => (
					<VideoTile
						video={item.video}
						title={item.title}
						price={item.price}
						place={marketPlace(item.shop.place)}
						playing={focused && visible.includes(index)}
						onPress={() => openFeed(item.partId)}
					/>
				)}
			/>
		</View>
	)
}
