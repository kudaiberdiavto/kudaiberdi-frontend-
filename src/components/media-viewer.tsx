import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ZoomableImage } from '@/components/zoomable-image'
import { CloseIcon } from '@/components/icons'
import { fixed, fontFamily, fs } from '@/theme'
import { resolveUrl } from '@/lib/api'
import type { MediaItem } from '@/api/types'
import { t } from '@/i18n'

/**
 * Full-screen photos and videos — swipe between them, pinch / double tap to zoom a photo, swipe down to close;
 * video with native controls. `initialIndex` — the one tapped.
 */
export function MediaViewer({ items, initialIndex = 0, onClose }: { items: MediaItem[] | null; initialIndex?: number; onClose: () => void }) {
	return (
		<Modal visible={items !== null} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait']}>
			{/* Mounted per opening — starts on the tapped item, unzoomed, whatever was left last time. */}
			{items ? <Viewer items={items} initialIndex={initialIndex} onClose={onClose} /> : null}
		</Modal>
	)
}

function Viewer({ items, initialIndex, onClose }: { items: MediaItem[]; initialIndex: number; onClose: () => void }) {
	const insets = useSafeAreaInsets()
	const { width, height } = useWindowDimensions()
	const [index, setIndex] = useState(initialIndex)
	const [zoomed, setZoomed] = useState(false)

	return (
		// A Modal renders outside the app's root view — gestures need their own root here (Android).
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: fixed.black }}>
			<ScrollView
				horizontal
				pagingEnabled
				scrollEnabled={!zoomed}
				contentOffset={{ x: initialIndex * width, y: 0 }}
				showsHorizontalScrollIndicator={false}
				// onScroll, not onMomentumScrollEnd — react-native-web has no momentum events.
				scrollEventThrottle={100}
				onScroll={(e) => {
					const next = Math.round(e.nativeEvent.contentOffset.x / width)
					if (next !== index) setIndex(next)
				}}
			>
				{items.map((item, i) => (
					<View key={item.id} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
						{item.kind === 'VIDEO' ? (
							// Only the visible one is mounted, so a swiped-away video stops.
							i === index ? <VideoSlide url={item.url} width={width} /> : null
						) : (
							<ZoomableImage uri={resolveUrl(item.url)} width={width} height={height * 0.8} onZoomChange={setZoomed} onClose={onClose} />
						)}
					</View>
				))}
			</ScrollView>
			<View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
				<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: fixed.white }}>{items.length > 1 ? `${index + 1} / ${items.length}` : ' '}</Text>
				<Pressable accessibilityRole="button" accessibilityLabel={t('Закрыть')} onPress={onClose} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
					<CloseIcon size={18} color={fixed.white} />
				</Pressable>
			</View>
		</GestureHandlerRootView>
	)
}

function VideoSlide({ url, width }: { url: string; width: number }) {
	const player = useVideoPlayer(resolveUrl(url), (p) => p.play())
	return <VideoView player={player} nativeControls contentFit="contain" style={{ width, height: width * 1.6 }} />
}
