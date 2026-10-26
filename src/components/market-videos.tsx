import { useCallback, useState } from 'react'
import { FlatList, Text, View, type ViewToken } from 'react-native'
import { router, useIsFocused } from 'expo-router'
import { VideoTile, useFeedCar } from '@/components/video-v23'
import { fontFamily, useColors } from '@/theme'
import { flattenPages } from '@/api/pagination'
import { useVideoFeed } from '@/api/catalog'
import type { VideoFeedItem } from '@/api/types'
import { useVideoViewer } from '@/store/useVideoViewer'

export type VideoFeedCar = Parameters<typeof useVideoFeed>[0]

/**
 * «Видео с рынка» — tiles play by themselves without sound; a tap opens the feed on that video. On the home screen —
 * for the main car; in «Запчасти» — for the car picked there (`car`: filters + «для Camry 50»).
 */
export function MarketVideos({ car: picked }: { car?: { filters: VideoFeedCar; label: string | null } } = {}) {
	const c = useColors()
	const main = useFeedCar()
	const feed = useVideoFeed(picked ? picked.filters : main.params)
	const carLabel = picked ? picked.label : main.car && main.byCar ? main.car.model.label : null
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
				<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ВИДЕО С РЫНКА</Text>
				{carLabel ? (
					<View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: c.brandTint, justifyContent: 'center' }}>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: c.brandStrong }}>для {carLabel}</Text>
					</View>
				) : null}
				<View style={{ flex: 1 }} />
				<Text onPress={() => openFeed()} style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>
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
						place={item.shop.place}
						playing={focused && visible.includes(index)}
						onPress={() => openFeed(item.partId)}
					/>
				)}
			/>
			<Text style={{ fontSize: 12.5, lineHeight: 16, fontFamily: fontFamily(400), color: c.muted }}>
				Играют сами без звука — нажмите, чтобы открыть на весь экран
			</Text>
		</View>
	)
}
