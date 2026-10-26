import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Linking, Pressable, Share, Text, View, type ViewToken } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useIsFocused } from 'expo-router'
import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { MarketMapTab } from '@/components/market-map-tab'
import { CallIcon, CONDITION_CHIP, PaperPlaneIcon, TickIcon, priceDigits } from '@/components/buyer-v23'
import { BookmarkIcon, SoundOffIcon, SoundOnIcon, TruckIcon, YellowChip, setPlayerMuted, useFeedCar } from '@/components/video-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { flattenPages } from '@/api/pagination'
import { useSignedIn, useToggleVideoFavorite, useVideoFeed } from '@/api/catalog'
import type { VideoFeedItem } from '@/api/types'
import { useMarketTab } from '@/store/useMarketTab'

/** «Рынок»: the video feed (like reels) or «Карта рынка» — the switch on top. */
export default function BuyerMarketScreen() {
	const insets = useSafeAreaInsets()
	const mode = useMarketTab((s) => s.mode)
	if (mode === 'map') {
		return (
			<MarketMapTab
				header={
					<View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
						<ModeSwitch dark={false} />
					</View>
				}
			/>
		)
	}
	return <VideoFeed top={insets.top} />
}

/** «Видео | Карта рынка». */
function ModeSwitch({ dark }: { dark: boolean }) {
	const c = useColors()
	const mode = useMarketTab((s) => s.mode)
	const setMode = useMarketTab((s) => s.setMode)
	return (
		<View
			style={{
				height: 40,
				padding: 4,
				borderRadius: 20,
				backgroundColor: dark ? 'rgba(255,255,255,0.16)' : '#E9E7E6',
				flexDirection: 'row',
				gap: 2,
			}}
		>
			{(['video', 'map'] as const).map((value) => {
				const active = mode === value
				return (
					<Pressable
						key={value}
						onPress={() => setMode(value)}
						style={{ height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: active ? '#FFFFFF' : 'transparent', justifyContent: 'center' }}
					>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.ink : dark ? '#FFFFFF' : c.ink }}>
							{value === 'video' ? 'Видео' : 'Карта рынка'}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

function VideoFeed({ top }: { top: number }) {
	const { car, byCar, params } = useFeedCar()
	const setByCar = useMarketTab((s) => s.setByCar)
	const startPartId = useMarketTab((s) => s.startPartId)
	const feed = useVideoFeed(params)
	const items = flattenPages(feed.data)
	const [height, setHeight] = useState(0)
	const [index, setIndex] = useState(0)
	const [muted, setMuted] = useState(true)
	const focused = useIsFocused()
	const listRef = useRef<FlatList<VideoFeedItem>>(null)

	// A tile on the home screen was tapped — open the feed on that video.
	useEffect(() => {
		if (startPartId === null || !height || !items.length) return
		const at = items.findIndex((item) => item.partId === startPartId)
		if (at > 0) listRef.current?.scrollToIndex({ index: at, animated: false })
		useMarketTab.getState().clearStart()
	}, [startPartId, height, items])

	// FlatList wants the same callback for its whole life.
	const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken<VideoFeedItem>[] }) => {
		const first = viewableItems[0]
		if (first?.index != null) setIndex(first.index)
	}, [])

	return (
		<View style={{ flex: 1, backgroundColor: '#000000' }} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
			{height ? (
				<FlatList
					ref={listRef}
					data={items}
					keyExtractor={(item) => String(item.partId)}
					pagingEnabled
					showsVerticalScrollIndicator={false}
					getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
					onViewableItemsChanged={onViewable}
					viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
					windowSize={3}
					initialNumToRender={2}
					maxToRenderPerBatch={2}
					onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
					renderItem={({ item, index: i }) => (
						<FeedPage
							item={item}
							height={height}
							top={top}
							active={focused && i === index}
							near={Math.abs(i - index) <= 1}
							muted={muted}
							onToggleSound={() => setMuted(!muted)}
						/>
					)}
					ListEmptyComponent={
						<View style={{ height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
							{feed.isPending ? (
								<ActivityIndicator color="#FFFFFF" />
							) : (
								<Text style={{ fontSize: 16, lineHeight: 22, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
									{feed.error ? 'Не удалось загрузить видео. Потяните вниз, чтобы повторить' : 'Пока нет видео. Как только продавцы выложат — покажем здесь'}
								</Text>
							)}
						</View>
					}
					onRefresh={() => feed.refetch()}
					refreshing={false}
				/>
			) : null}

			<View style={{ position: 'absolute', top: top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<ModeSwitch dark />
				{car ? (
					<Pressable
						onPress={() => setByCar(!byCar)}
						style={{
							height: 40,
							paddingHorizontal: 14,
							borderRadius: 20,
							backgroundColor: 'rgba(255,255,255,0.16)',
							flexDirection: 'row',
							alignItems: 'center',
							gap: 6,
						}}
					>
						{byCar ? <TickIcon size={16} color="#FFFFFF" /> : null}
						<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{car.model.label}</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	)
}

/** One video of the feed: full screen, plays while active, the seller, the part, «Позвонить» and «Доставка». */
function FeedPage({
	item,
	height,
	top,
	active,
	near,
	muted,
	onToggleSound,
}: {
	item: VideoFeedItem
	height: number
	top: number
	active: boolean
	near: boolean
	muted: boolean
	onToggleSound: () => void
}) {
	const c = useColors()
	const signedIn = useSignedIn()
	const favorite = useToggleVideoFavorite()
	const poster = resolveUrl(item.video.posterUrl)
	const shop = item.shop
	const meta = [shop.place, shop.replyMinutes != null ? `отвечает за ${shop.replyMinutes} мин` : null].filter(Boolean).join(' · ')
	const condition = CONDITION_CHIP[item.condition]
	const description = [condition, item.fitsLabel].filter(Boolean).join('. ')

	const rail = [
		{
			label: 'Сохр.',
			icon: <BookmarkIcon size={22} color="#FFFFFF" filled={item.isFavorite} />,
			onPress: () => (signedIn ? favorite.mutate({ partId: item.partId, favorite: !item.isFavorite }) : router.push('/')),
		},
		{
			label: 'Отправ.',
			icon: <PaperPlaneIcon size={22} color="#FFFFFF" />,
			onPress: () => Share.share({ message: `${item.title}\nhttps://kudaibergen.kg/p/${item.publicId}` }),
		},
		{
			label: 'Звук',
			icon: muted ? <SoundOffIcon size={22} color="#FFFFFF" /> : <SoundOnIcon size={22} color="#FFFFFF" />,
			onPress: onToggleSound,
		},
	]

	return (
		<View style={{ height, backgroundColor: '#000000' }}>
			{poster ? <Image source={{ uri: poster }} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
			{near ? <FeedVideo url={item.video.url} active={active} muted={muted} durationSec={item.video.durationSec} /> : null}
			<LinearGradient
				colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
				locations={[0, 0.18, 0.45, 1]}
				style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
				pointerEvents="none"
			/>
			<View style={{ height: top }} />

			<View style={{ position: 'absolute', right: 12, bottom: 250, gap: 14, alignItems: 'center' }}>
				{rail.map((button) => (
					<Pressable key={button.label} onPress={button.onPress} style={{ alignItems: 'center', gap: 4 }}>
						<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
							{button.icon}
						</View>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: '#FFFFFF' }}>{button.label}</Text>
					</Pressable>
				))}
			</View>

			<View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 8 }}>
				<Pressable
					onPress={() => router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })}
					style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 64 }}
				>
					{shop.avatarUrl ? (
						<Image source={{ uri: resolveUrl(shop.avatarUrl) }} style={{ width: 32, height: 32, borderRadius: 16 }} />
					) : (
						<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{shop.name.slice(0, 1).toUpperCase()}</Text>
						</View>
					)}
					<View style={{ flex: 1 }}>
						<Text numberOfLines={1} style={{ fontSize: 15, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
							{shop.name}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: fontFamily(400), color: 'rgba(255,255,255,0.75)' }}>
							{meta}
						</Text>
					</View>
				</Pressable>
				<Text style={{ fontSize: 20, lineHeight: 25, fontFamily: fontFamily(800), color: '#FFFFFF', paddingRight: 64 }}>{item.title}</Text>
				{description ? (
					<Text numberOfLines={2} style={{ fontSize: 14.5, lineHeight: 19.5, fontFamily: fontFamily(400), color: 'rgba(255,255,255,0.88)', paddingRight: 64 }}>
						{description}
					</Text>
				) : null}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<Text style={{ fontSize: 30, fontFamily: fontFamily(800), letterSpacing: -0.6, color: '#FFFFFF' }}>{priceDigits(item.price)} сом</Text>
					{condition ? (
						<View style={{ height: 24, paddingHorizontal: 8, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' }}>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{condition}</Text>
						</View>
					) : null}
				</View>
				{item.shipsToRegions ? <YellowChip label="Доставка по КР" icon /> : null}
				<View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
					<Pressable
						onPress={() => shop.phone && Linking.openURL(`tel:${shop.phone.replace(/[^\d+]/g, '')}`)}
						disabled={!shop.phone}
						style={{
							flex: 1,
							height: 52,
							borderRadius: 14,
							backgroundColor: c.success,
							opacity: shop.phone ? 1 : 0.5,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
						}}
					>
						<CallIcon size={20} color="#FFFFFF" />
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Позвонить</Text>
					</Pressable>
					{item.shipsToRegions ? (
						<Pressable
							onPress={() => (signedIn ? router.push({ pathname: '/delivery', params: { partId: String(item.partId) } }) : router.push('/'))}
							style={{
								flex: 1,
								height: 52,
								borderRadius: 14,
								backgroundColor: '#FFFFFF',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
							}}
						>
							<TruckIcon size={20} color={c.ink} />
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>Доставка</Text>
						</Pressable>
					) : null}
				</View>
			</View>
		</View>
	)
}

/** The video itself and the thin progress line under the buttons. */
function FeedVideo({ url, active, muted, durationSec }: { url: string; active: boolean; muted: boolean; durationSec: number }) {
	const player = useVideoPlayer(resolveUrl(url), (p) => {
		p.loop = true
		p.muted = true
		p.timeUpdateEventInterval = 0.25
	})
	const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 })
	useEffect(() => setPlayerMuted(player, muted), [player, muted])
	useEffect(() => {
		if (active) player.play()
		else player.pause()
	}, [player, active])
	const duration = player.duration || durationSec || 1
	return (
		<>
			<VideoView player={player} nativeControls={false} contentFit="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} />
			<View style={{ position: 'absolute', left: 16, right: 16, bottom: 6, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }}>
				<View style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%`, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
			</View>
		</>
	)
}
