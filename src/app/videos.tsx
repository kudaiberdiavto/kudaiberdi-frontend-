import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, Share, Text, View, type ListViewToken } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useIsFocused } from 'expo-router'
import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { usePullRefresh } from '@/lib/use-pull-refresh'
import { BackIcon, CONDITION_CHIP, PaperPlaneIcon, priceDigits } from '@/components/buyer-v23'
import { BookmarkIcon, SoundOffIcon, SoundOnIcon, TruckIcon, YellowChip, setPlayerMuted } from '@/components/video-v23'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { flattenPages } from '@/api/pagination'
import { useSignedIn, useToggleVideoFavorite, useSharePart, useVideoFeed } from '@/api/catalog'
import type { VideoFeedItem } from '@/api/types'
import { useOpenChat } from '@/api/chats'
import { CommentsSheet } from '@/components/comments-sheet'
import { Skeleton } from '@/components/ui'
import { ChatIcon } from '@/components/icons'
import { useVideoViewer } from '@/store/useVideoViewer'
import { marketPlace } from '@/lib/shop-place'
import { t } from '@/i18n'

/**
 * Videos from the market, full screen (like reels): a video is a part for sale, swiping shows only videos.
 * Opened from «Видео с рынка» on the home screen and from a part with a video in the catalog.
 */
export default function VideosScreen() {
	const insets = useSafeAreaInsets()
	return <VideoFeed top={insets.top} bottom={insets.bottom} />
}

function VideoFeed({ top, bottom }: { top: number; bottom: number }) {
	const startPartId = useVideoViewer((s) => s.startPartId)
	// Ads from the market — the same for everyone, not tied to a car.
	const feed = useVideoFeed()
	const pull = usePullRefresh(() => feed.refetch())
	const items = flattenPages(feed.data)
	const [height, setHeight] = useState(0)
	const [index, setIndex] = useState(0)
	const [muted, setMuted] = useState(true)
	const focused = useIsFocused()
	const listRef = useRef<FlatList<VideoFeedItem>>(null)

	// A video was tapped (home, catalog) — open the feed on it. Not on the loaded pages — load more; not in this
	// feed at all (another car, a search result) — open the part itself instead of an unrelated video.
	useEffect(() => {
		if (startPartId === null || !height || feed.isPending || feed.isFetchingNextPage) return
		const at = items.findIndex((item) => item.partId === startPartId)
		if (at < 0 && feed.hasNextPage) {
			feed.fetchNextPage()
			return
		}
		useVideoViewer.getState().clearStart()
		if (at > 0) listRef.current?.scrollToIndex({ index: at, animated: false })
		else if (at < 0) router.replace({ pathname: '/part', params: { id: String(startPartId) } })
	}, [startPartId, height, items, feed])

	// FlatList wants the same callback for its whole life.
	const onViewable = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
		const first = viewableItems[0]
		if (first?.index != null) setIndex(first.index)
	}, [])

	return (
		<View style={{ flex: 1, backgroundColor: fixed.black }} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
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
							bottom={bottom}
							active={focused && i === index}
							near={Math.abs(i - index) <= 1}
							muted={muted}
							onToggleSound={() => setMuted(!muted)}
						/>
					)}
					ListEmptyComponent={
						feed.isLoading ? (
							<VideoPageSkeleton height={height} bottom={bottom} />
						) : (
						<View style={{ height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
							{(
								<Text style={{ fontSize: fs.lg, lineHeight: 24, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
									{feed.error ? t('Не удалось загрузить видео') : t('Видео нет')}
								</Text>
							)}
						</View>
						)
					}
					onRefresh={pull.onRefresh}
					refreshing={pull.refreshing}
				/>
			) : null}

			<View style={{ position: 'absolute', top: top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Pressable accessibilityRole="button" accessibilityLabel={t('Назад')}
					onPress={() => router.back()}
					hitSlop={10}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}
				>
					<BackIcon color={fixed.white} />
				</Pressable>
			</View>
		</View>
	)
}

/** One video of the feed: full screen, plays while active, the seller, the part, «Заказать» and «Доставка». */
function FeedPage({
	item,
	height,
	top,
	bottom,
	active,
	near,
	muted,
	onToggleSound,
}: {
	item: VideoFeedItem
	height: number
	top: number
	bottom: number
	active: boolean
	near: boolean
	muted: boolean
	onToggleSound: () => void
}) {
	const c = useColors()
	const signedIn = useSignedIn()
	const favorite = useToggleVideoFavorite()
	const shared = useSharePart()
	const poster = resolveUrl(item.video.posterUrl)
	const shop = item.shop
	const openChat = useOpenChat()
	// «Заказать» — the chat with the box about this part, «Хочу заказать …» already typed (a guest signs in first).
	const order = () =>
		signedIn
			? openChat.mutate(
					{ shopId: shop.id, partId: item.partId },
					{
						onSuccess: (chat) =>
							router.push({
								pathname: '/chat',
								params: { chatId: String(chat.id), draft: t('Здравствуйте! Хочу заказать «{0}» за {1} сом.', item.title, priceDigits(item.price)) },
							}),
					}
				)
			: router.push('/')
	const meta = [marketPlace(shop.place), shop.replyMinutes != null ? t('отвечает за {0} мин', shop.replyMinutes) : null].filter(Boolean).join(' · ')
	const [commenting, setCommenting] = useState(false)
	const condition = CONDITION_CHIP[item.condition]
	const description = [condition, item.fitsLabel].filter(Boolean).join('. ')

	const rail = [
		{
			key: 'save',
			label: item.favoritesCount ? String(item.favoritesCount) : null,
			icon: <BookmarkIcon size={22} color={fixed.white} filled={item.isFavorite} />,
			onPress: () => (signedIn ? favorite.mutate({ partId: item.partId, favorite: !item.isFavorite }) : router.push('/')),
		},
		{
			key: 'comments',
			label: item.commentsCount ? String(item.commentsCount) : null,
			icon: <ChatIcon size={22} color={fixed.white} strokeWidth={2.1} />,
			onPress: () => setCommenting(true),
		},
		{
			key: 'share',
			label: item.sharesCount ? String(item.sharesCount) : null,
			icon: <PaperPlaneIcon size={22} color={fixed.white} />,
			onPress: () =>
				Share.share({ message: `${item.title}\nhttps://kudaibergen.kg/p/${item.publicId}` }).then((result) => {
					if (result.action === Share.sharedAction) shared.mutate(item.partId)
				}),
		},
		{
			key: 'sound',
			label: null,
			icon: muted ? <SoundOffIcon size={22} color={fixed.white} /> : <SoundOnIcon size={22} color={fixed.white} />,
			onPress: onToggleSound,
		},
	]

	return (
		<View style={{ height, backgroundColor: fixed.black }}>
			{poster ? <Image source={{ uri: poster }} contentFit="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
			{near ? <FeedVideo url={item.video.url} active={active} muted={muted} durationSec={item.video.durationSec} bottom={bottom} /> : null}
			<LinearGradient
				colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
				locations={[0, 0.18, 0.45, 1]}
				style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
				pointerEvents="none"
			/>
			<View style={{ height: top }} />

			<View style={{ position: 'absolute', right: 12, bottom: bottom + 250, gap: 14, alignItems: 'center' }}>
				{rail.map((button) => (
					<Pressable key={button.key} onPress={button.onPress} hitSlop={6} style={{ alignItems: 'center', gap: 4 }}>
						<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
							{button.icon}
						</View>
						{button.label ? <Text style={{ fontSize: fs.sm, fontFamily: fontFamily(700), color: fixed.white }}>{button.label}</Text> : null}
					</Pressable>
				))}
			</View>

			<View style={{ position: 'absolute', left: 16, right: 16, bottom: bottom + 16, gap: 8 }}>
				<Pressable
					onPress={() => router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })}
					style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 64 }}
				>
					{shop.avatarUrl ? (
						<Image source={{ uri: resolveUrl(shop.avatarUrl) }} style={{ width: 32, height: 32, borderRadius: 16 }} />
					) : (
						<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: fixed.white }}>{shop.name.slice(0, 1).toUpperCase()}</Text>
						</View>
					)}
					<View style={{ flex: 1 }}>
						<Text numberOfLines={1} style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: fixed.white }}>
							{shop.name}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: 'rgba(255,255,255,0.75)' }}>
							{meta}
						</Text>
					</View>
				</Pressable>
				<Text style={{ fontSize: fs.xxl, lineHeight: 27.5, fontFamily: fontFamily(800), color: fixed.white, paddingRight: 64 }}>{item.title}</Text>
				{description ? (
					<Text numberOfLines={2} style={{ fontSize: fs.base, lineHeight: 21.5, fontFamily: fontFamily(400), color: 'rgba(255,255,255,0.88)', paddingRight: 64 }}>
						{description}
					</Text>
				) : null}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<Text style={{ fontSize: fs.hero, fontFamily: fontFamily(800), letterSpacing: -0.6, color: fixed.white }}>{t('{0} сом', priceDigits(item.price))}</Text>
					{condition ? (
						<View style={{ height: 24, paddingHorizontal: 8, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' }}>
							<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(700), color: fixed.white }}>{condition}</Text>
						</View>
					) : null}
				</View>
				{item.shipsToRegions ? <YellowChip label={t('Доставка по КР')} icon /> : null}
				<View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
					<Pressable
						onPress={order}
						disabled={openChat.isPending}
						style={{
							flex: 1,
							height: 52,
							borderRadius: 14,
							backgroundColor: c.brand,
							opacity: openChat.isPending ? 0.7 : 1,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
						}}
					>
						<ChatIcon size={20} color={fixed.white} strokeWidth={2.2} />
						<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{t('Заказать')}</Text>
					</Pressable>
					{item.shipsToRegions ? (
						<Pressable
							onPress={() => (signedIn ? router.push({ pathname: '/delivery', params: { partId: String(item.partId) } }) : router.push('/'))}
							style={{
								flex: 1,
								height: 52,
								borderRadius: 14,
								backgroundColor: fixed.white,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
							}}
						>
							<TruckIcon size={20} color={c.ink} />
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>{t('Доставка')}</Text>
						</Pressable>
					) : null}
				</View>
			</View>
			{commenting ? <CommentsSheet partId={item.partId} onClose={() => setCommenting(false)} /> : null}
		</View>
	)
}

/** The video itself and the thin progress line under the buttons. */
/** Страница ленты, пока видео грузятся: кнопки справа, магазин, название и цена внизу — как у настоящей. */
function VideoPageSkeleton({ height, bottom }: { height: number; bottom: number }) {
	return (
		<View style={{ height }}>
			<View style={{ position: 'absolute', right: 12, bottom: bottom + 250, gap: 18, alignItems: 'center' }}>
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} onDark width={44} height={44} radius={22} />
				))}
			</View>
			<View style={{ position: 'absolute', left: 16, right: 16, bottom: bottom + 16, gap: 10 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Skeleton onDark width={36} height={36} radius={18} />
					<Skeleton onDark width={140} height={16} />
				</View>
				<Skeleton onDark width="80%" height={18} />
				<Skeleton onDark width={110} height={24} />
				<Skeleton onDark height={52} radius={14} style={{ marginTop: 6 }} />
			</View>
		</View>
	)
}

function FeedVideo({ url, active, muted, durationSec, bottom }: { url: string; active: boolean; muted: boolean; durationSec: number; bottom: number }) {
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
			{/* The native video view takes touches — without this the feed can't be swiped over it. */}
			<View pointerEvents="none" style={{ position: 'absolute', width: '100%', height: '100%' }}>
				<VideoView player={player} nativeControls={false} contentFit="cover" style={{ width: '100%', height: '100%' }} />
			</View>
			<View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: bottom + 6, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }}>
				<View style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%`, height: 3, borderRadius: 2, backgroundColor: fixed.white }} />
			</View>
		</>
	)
}
