import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { CloseIcon } from '@/components/icons'
import { fixed, fontFamily, fs } from '@/theme'
import { resolveUrl } from '@/lib/api'
import type { MediaItem } from '@/api/types'
import { t } from '@/i18n'

/** Full-screen photos and videos of a service request [39] — swipe between them, video with native controls. */
export function MediaViewer({ items, onClose }: { items: MediaItem[] | null; onClose: () => void }) {
	const insets = useSafeAreaInsets()
	const { width, height } = useWindowDimensions()
	const [index, setIndex] = useState(0)

	return (
		<Modal visible={items !== null} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait']}>
			<View style={{ flex: 1, backgroundColor: fixed.black }}>
				<ScrollView
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					// onScroll, not onMomentumScrollEnd — react-native-web has no momentum events.
					scrollEventThrottle={100}
					onScroll={(e) => {
						const next = Math.round(e.nativeEvent.contentOffset.x / width)
						if (next !== index) setIndex(next)
					}}
				>
					{(items ?? []).map((item, i) => (
						<View key={item.id} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
							{item.kind === 'VIDEO' ? (
								// Only the visible one is mounted, so a swiped-away video stops.
								i === index ? <VideoSlide url={item.url} width={width} /> : null
							) : (
								<Image source={{ uri: resolveUrl(item.url) }} contentFit="contain" style={{ width, height: height * 0.8 }} />
							)}
						</View>
					))}
				</ScrollView>
				<View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
					<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: fixed.white }}>{items && items.length > 1 ? `${index + 1} / ${items.length}` : ' '}</Text>
					<Pressable accessibilityRole="button" accessibilityLabel={t('Закрыть')} onPress={onClose} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
						<CloseIcon size={18} color={fixed.white} />
					</Pressable>
				</View>
			</View>
		</Modal>
	)
}

function VideoSlide({ url, width }: { url: string; width: number }) {
	const player = useVideoPlayer(resolveUrl(url), (p) => p.play())
	return <VideoView player={player} nativeControls contentFit="contain" style={{ width, height: width * 1.6 }} />
}
