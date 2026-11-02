import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { MediaViewer } from '@/components/media-viewer'
import { PlayIcon } from '@/components/voice'
import { resolveUrl } from '@/lib/api'
import type { MediaItem, Photo } from '@/api/types'

/** A request's photos (PhotoDto) as media items — the same strip and viewer as for photos and videos. */
export const photosAsMedia = (photos: Photo[]): MediaItem[] =>
	photos.map((photo) => ({ id: photo.id, kind: 'PHOTO', url: photo.url, thumbUrl: photo.thumbUrl, width: photo.width, height: photo.height, durationSec: null }))

/** Attached photos and videos of a request: 64 px thumbnails (▶ on videos), a tap opens them full screen. */
export function MediaStrip({ media }: { media: MediaItem[] }) {
	const [viewing, setViewing] = useState<MediaItem[] | null>(null)
	const items = media.filter((item) => item.kind !== 'AUDIO')
	if (!items.length) return null
	return (
		<>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
				{items.map((item) => (
					<Pressable key={item.id} onPress={() => setViewing(items)}>
						<Image
							source={{ uri: resolveUrl(item.thumbUrl ?? (item.kind === 'PHOTO' ? item.url : null)) ?? undefined }}
							style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#1F2329' }}
						/>
						{item.kind === 'VIDEO' ? (
							<View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
								<View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
									<PlayIcon size={12} />
								</View>
							</View>
						) : null}
					</Pressable>
				))}
			</View>
			<MediaViewer items={viewing} onClose={() => setViewing(null)} />
		</>
	)
}

/** The same media large — one under another across the width (▶ on videos), a tap opens them full screen. */
export function MediaGallery({ media }: { media: MediaItem[] }) {
	const [viewing, setViewing] = useState<MediaItem[] | null>(null)
	const items = media.filter((item) => item.kind !== 'AUDIO')
	if (!items.length) return null
	return (
		<>
			<View style={{ gap: 8 }}>
				{items.map((item) => (
					<Pressable key={item.id} onPress={() => setViewing(items)}>
						<Image
							source={{ uri: resolveUrl(item.kind === 'PHOTO' ? item.url : item.thumbUrl) ?? undefined }}
							contentFit="cover"
							style={{ width: '100%', aspectRatio: item.width && item.height ? Math.max(0.75, Math.min(1.6, item.width / item.height)) : 4 / 3, borderRadius: 16, backgroundColor: '#1F2329' }}
						/>
						{item.kind === 'VIDEO' ? (
							<View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
								<View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
									<PlayIcon size={24} />
								</View>
							</View>
						) : null}
					</Pressable>
				))}
			</View>
			<MediaViewer items={viewing} onClose={() => setViewing(null)} />
		</>
	)
}
