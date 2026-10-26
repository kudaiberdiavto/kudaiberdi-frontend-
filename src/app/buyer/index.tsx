import { useCallback, useState, type ComponentType, type ReactNode } from 'react'
import { FlatList, Pressable, ScrollView, Text, View, type ViewToken } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useIsFocused } from 'expo-router'
import { BottomSheet, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import {
	BoxOutlineIcon,
	Caps,
	ChevronIcon,
	LiveDot,
	LoupeIcon,
	MetaChip,
	PlusThinIcon,
	TickIcon,
	TowIcon,
	WheelIcon,
	WrenchIcon,
	priceDigits,
} from '@/components/buyer-v23'
import { TruckIcon, VideoTile, deliveryStatusText, useFeedCar } from '@/components/video-v23'
import { fontFamily, useColors } from '@/theme'
import { minutesLeft, plural } from '@/lib/format'
import { useMe } from '@/api/me'
import { useCars, useMakePrimaryCar } from '@/api/garage'
import { useMyRequests } from '@/api/requests'
import { flattenPages } from '@/api/pagination'
import { serviceName, useMyServiceRequests, useServiceTypes } from '@/api/services'
import { useSignedIn, useVideoFeed } from '@/api/catalog'
import { useDeliveryOrders } from '@/api/delivery'
import type { Car, DeliveryOrder, RequestSummary, ServiceRequestSummary, VideoFeedItem } from '@/api/types'
import { useVideoViewer } from '@/store/useVideoViewer'

type Row = { kind: 'part'; request: RequestSummary } | { kind: 'service'; request: ServiceRequestSummary }

/** «Нужен мастер?» [03]: three services → the one-screen request [16], «Все услуги» → choose there. */
const HOME_SERVICES: { code: string; label: string; icon: ComponentType<{ size?: number; color: string; strokeWidth?: number }> }[] = [
	{ code: 'CAR_REPAIR', label: 'Ремонт', icon: WrenchIcon },
	{ code: 'TIRE_SERVICE', label: 'Шиномонтаж', icon: WheelIcon },
	{ code: 'TOW_TRUCK', label: 'Эвакуатор', icon: TowIcon },
]

/** Rows shown before «Все». */
const PREVIEW = 3

/** 03 Главная: the car, «Найти запчасть», «Видео с рынка», parcels on the way, «Мои запросы», masters. */
export default function BuyerHomeScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const me = useMe()
	const cars = useCars()
	const requests = useMyRequests()
	const services = useMyServiceRequests()
	const [all, setAll] = useState(false)
	const [picking, setPicking] = useState(false)
	const parcels = useDeliveryOrders('BUYER', useSignedIn()).data ?? []
	// Parts requests and service requests in one list, newest first.
	const items: Row[] = [
		...flattenPages(requests.data).map((request) => ({ kind: 'part' as const, request })),
		...flattenPages(services.data).map((request) => ({ kind: 'service' as const, request })),
	].sort((a, b) => b.request.createdAt.localeCompare(a.request.createdAt))
	const car = cars.data?.find((item) => item.isPrimary) ?? cars.data?.[0]
	const name = me.data?.name

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<View style={{ flex: 1, gap: 2 }}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.muted }}>{name ? `Салам, ${name}` : 'Салам'}</Text>
					<Text numberOfLines={1} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>
						{car ? `${car.title} · ${car.year}` : 'Машина не выбрана'}
					</Text>
				</View>
				<Pressable
					onPress={() => (cars.data?.length ? setPicking(true) : router.push('/garage-add'))}
					style={{
						height: 36,
						paddingHorizontal: 12,
						borderRadius: 18,
						backgroundColor: c.card,
						borderWidth: 1.5,
						borderColor: c.border,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 6,
					}}
				>
					{car ? <BrandLogo brand={car.brand} size={22} /> : <PlusThinIcon size={16} color={c.ink} />}
					<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>{car ? 'Сменить' : 'Добавить'}</Text>
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				showsVerticalScrollIndicator={false}
			>
				<Pressable onPress={() => router.push('/search-part')}>
					<LinearGradient
						colors={['#2D63F0', '#1D46BF']}
						start={{ x: 0.25, y: 0 }}
						end={{ x: 0.75, y: 1 }}
						style={{
							height: 108,
							borderRadius: 24,
							paddingHorizontal: 18,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 14,
							overflow: 'hidden',
							shadowColor: '#1D46BF',
							shadowOpacity: 0.32,
							shadowOffset: { width: 0, height: 14 },
							shadowRadius: 15,
							elevation: 12,
						}}
					>
						<View
							style={{
								width: 46,
								height: 46,
								borderRadius: 14,
								backgroundColor: 'rgba(255,255,255,0.18)',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<LoupeIcon size={24} color="#FFFFFF" strokeWidth={2.6} />
						</View>
						<View style={{ flex: 1, gap: 3 }}>
							<Text style={{ fontSize: 23, lineHeight: 29, fontFamily: fontFamily(800), letterSpacing: -0.4, color: '#FFFFFF' }}>
								Найти запчасть
							</Text>
							<Text style={{ fontSize: 13.5, lineHeight: 18, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.88)' }}>
								Фото или голосом — продавцы ответят с ценой
							</Text>
						</View>
					</LinearGradient>
				</Pressable>

				<MarketVideos />

				{parcels.map((order) => (
					<ParcelRow key={order.id} order={order} />
				))}

				<View style={{ height: 2 }} />
				<Caps link={items.length > PREVIEW ? (all ? 'Свернуть' : 'Все') : undefined} onLink={() => setAll(!all)}>
					Мои запросы
				</Caps>
				<QueryErrorBanner
					error={requests.error}
					onRetry={() => requests.refetch()}
					offlineText="Нет сети. Покажем запросы, когда появится"
				/>
				{requests.isSuccess && services.isSuccess && items.length === 0 ? (
					<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
						Здесь появятся ваши запросы. Нажмите «Найти запчасть» — продавцы ответят с ценой.
					</Text>
				) : null}
				{(all ? items : items.slice(0, PREVIEW)).map((item) =>
					item.kind === 'part' ? (
						<RequestRow key={`part-${item.request.id}`} request={item.request} />
					) : (
						<ServiceRow key={`service-${item.request.id}`} request={item.request} />
					)
				)}
				{all && (requests.hasNextPage || services.hasNextPage) ? (
					<Text
						onPress={() => {
							if (requests.hasNextPage) requests.fetchNextPage()
							if (services.hasNextPage) services.fetchNextPage()
						}}
						style={{ textAlign: 'center', paddingVertical: 8, fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}
					>
						Показать ещё
					</Text>
				) : null}

				<View style={{ height: 2 }} />
				<Caps>Нужен мастер?</Caps>
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{HOME_SERVICES.map(({ code, label, icon: Icon }) => (
						<ServiceTile
							key={code}
							label={label}
							icon={<Icon size={22} color={c.brandStrong} strokeWidth={2} />}
							onPress={() => router.push({ pathname: '/service-new', params: { service: code } })}
						/>
					))}
					<ServiceTile
						label="Все услуги"
						muted
						icon={<PlusThinIcon size={22} color={c.ink} />}
						onPress={() => router.push('/service-new')}
					/>
				</View>

			</ScrollView>

			{picking && cars.data ? <CarPicker cars={cars.data} onClose={() => setPicking(false)} /> : null}
		</View>
	)
}

/** «Видео с рынка» — tiles play by themselves without sound; a tap opens the feed on that video. */
function MarketVideos() {
	const c = useColors()
	const { car, byCar, params } = useFeedCar()
	const feed = useVideoFeed(params)
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
				{car && byCar ? (
					<View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: c.brandTint, justifyContent: 'center' }}>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: c.brandStrong }}>для {car.model.label}</Text>
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

/** A parcel on the way — «Где посылка». */
function ParcelRow({ order }: { order: DeliveryOrder }) {
	const c = useColors()
	return (
		<RequestCard
			tile={
				<Tile>
					<TruckIcon size={22} color={c.brandStrong} />
				</Tile>
			}
			title={order.part.title}
			status={`${deliveryStatusText(order)} · ${order.number}`}
			live={order.status === 'PICKED_UP'}
			onPress={() => router.push({ pathname: '/delivery-order', params: { id: String(order.id) } })}
		/>
	)
}

function ServiceTile({ label, icon, muted, onPress }: { label: string; icon: ReactNode; muted?: boolean; onPress: () => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				flex: 1,
				height: 84,
				borderRadius: 16,
				backgroundColor: c.card,
				alignItems: 'center',
				justifyContent: 'center',
				gap: 7,
				paddingHorizontal: 4,
			}}
		>
			<View
				style={{
					width: 38,
					height: 38,
					borderRadius: 12,
					backgroundColor: muted ? c.surface : c.brandTint,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{icon}
			</View>
			<Text numberOfLines={1} style={{ fontSize: 12.5, lineHeight: 14.4, fontFamily: fontFamily(600), color: c.ink, textAlign: 'center' }}>
				{label}
			</Text>
		</Pressable>
	)
}

/** A card of «Мои запросы»: tile, title, status line, chevron; optional chip row under it. */
function RequestCard({
	tile,
	title,
	status,
	live,
	chip,
	onPress,
}: {
	tile: ReactNode
	title: string
	status: string
	live?: boolean
	chip?: string
	onPress: () => void
}) {
	const c = useColors()
	return (
		<Pressable onPress={onPress} style={{ borderRadius: 18, backgroundColor: c.card, padding: 12, gap: 10 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				{tile}
				<View style={{ flex: 1, gap: 3 }}>
					<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
						{title}
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
						{live ? <LiveDot /> : null}
						<Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{status}
						</Text>
					</View>
				</View>
				<ChevronIcon size={20} color="#B8B4B4" />
			</View>
			{chip ? (
				<View style={{ flexDirection: 'row' }}>
					<MetaChip label={chip} tone="green" />
				</View>
			) : null}
		</Pressable>
	)
}

function Tile({ children }: { children: ReactNode }) {
	const c = useColors()
	return (
		<View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
			{children}
		</View>
	)
}

/** A parts request: «Ищем ещё 18 мин», «3 есть · от 2 900 с». */
function RequestRow({ request }: { request: RequestSummary }) {
	const c = useColors()
	const left = minutesLeft(request.expiresAt)
	const status =
		request.state === 'CLOSED'
			? 'Закрыт'
			: request.status === 'ACTIVE' && left > 0
				? `Ищем ещё ${left} мин`
				: request.haveCount > 0
					? 'Время вышло'
					: 'Пока никто не ответил'
	const chip =
		request.haveCount > 0
			? `${request.haveCount} есть${request.minPrice != null ? ` · от ${priceDigits(request.minPrice)} с` : ''}`
			: undefined
	return (
		<RequestCard
			tile={
				<Tile>
					<BoxOutlineIcon size={22} color={c.brandStrong} />
				</Tile>
			}
			title={request.text}
			status={status}
			live={request.status === 'ACTIVE' && left > 0}
			chip={request.state === 'CLOSED' ? undefined : chip}
			onPress={() => router.push({ pathname: '/request', params: { id: String(request.id) } })}
		/>
	)
}

/** A service request: «Ремонт · 2 мастера ответили». */
function ServiceRow({ request }: { request: ServiceRequestSummary }) {
	const c = useColors()
	const types = useServiceTypes().data
	const offers = request.canHelpCount
	const service = serviceName(types, request.service.code, true)
	const status =
		request.state === 'CLOSED'
			? `${service} · договорились`
			: offers > 0
				? `${service} · ${offers} ${plural(offers, ['мастер ответил', 'мастера ответили', 'мастеров ответили'])}`
				: request.status === 'ACTIVE'
					? `${service} · ждём мастеров`
					: `${service} · никто не ответил`
	return (
		<RequestCard
			tile={
				<Tile>
					<WrenchIcon size={22} color={c.brandStrong} />
				</Tile>
			}
			title={request.description}
			status={status}
			onPress={() => router.push({ pathname: '/service-offers', params: { id: String(request.id) } })}
		/>
	)
}

/** «Сменить» — another car from the garage becomes the main one, or add a new one. */
function CarPicker({ cars, onClose }: { cars: Car[]; onClose: () => void }) {
	const c = useColors()
	const makePrimary = useMakePrimaryCar()
	return (
		<BottomSheet
			onClose={onClose}
			header={<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>Для какой машины</Text>}
		>
			<View style={{ gap: 8 }}>
				{cars.map((car) => (
					<Pressable
						key={car.id}
						onPress={() => makePrimary.mutate(car.id, { onSuccess: onClose })}
						style={{
							height: 60,
							borderRadius: 14,
							borderWidth: 2,
							borderColor: car.isPrimary ? c.brand : c.hairline,
							backgroundColor: car.isPrimary ? c.brandTint : c.card,
							paddingHorizontal: 12,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
						}}
					>
						<BrandLogo brand={car.brand} size={32} />
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{car.title}</Text>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{car.subtitle}</Text>
						</View>
						{car.isPrimary ? <TickIcon size={18} color={c.brand} /> : null}
					</Pressable>
				))}
				<Pressable
					onPress={() => {
						onClose()
						router.push('/garage-add')
					}}
					style={{
						height: 52,
						borderRadius: 14,
						borderWidth: 2,
						borderStyle: 'dashed',
						borderColor: '#B8C3D3',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
					}}
				>
					<PlusThinIcon size={18} color={c.brandStrong} />
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>Добавить машину</Text>
				</Pressable>
			</View>
		</BottomSheet>
	)
}
