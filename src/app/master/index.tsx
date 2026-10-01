import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Redirect, router } from 'expo-router'
import { Button, Chip, QueryErrorBanner, Screen, SectionLabel, ServiceRequestCard } from '@/components/ui'
import { fontFamily, raw, useColors } from '@/theme'
import { formatDistance, formatDuration, formatHours, minutesLeft } from '@/lib/format'
import { markServiceSeen, serviceName, useMasterFeed, useMasterOffer, useMyMaster, useServiceTypes, useSetAccepting } from '@/api/services'
import { flattenPages } from '@/api/pagination'
import type { MasterFeedFilter, MasterFeedItem, MediaItem, ServiceWhen } from '@/api/types'
import { MediaViewer } from '@/components/media-viewer'
import { AccountStatusBanner } from '@/components/account-status-banner'

const WHEN_WORD: Record<ServiceWhen, string> = { NOW: 'сейчас', TODAY: 'сегодня', TOMORROW: 'завтра', AT_TIME: '' }
const FILTERS: { value: MasterFeedFilter; label: string }[] = [
	{ value: 'NEW', label: 'Новые' },
	{ value: 'ANSWERED', label: 'Отвеченные' },
	{ value: 'EXPIRED', label: 'Истёкшие' },
]

/** «Когда могу» → `availableAt`. */
const AVAILABLE: { label: string; at: (now: Date) => Date }[] = [
	{ label: 'через 1 час', at: (now) => new Date(now.getTime() + 60 * 60_000) },
	{ label: 'сегодня 15:00', at: (now) => new Date(new Date(now).setHours(15, 0, 0, 0)) },
	{ label: 'сегодня 18:00', at: (now) => new Date(new Date(now).setHours(18, 0, 0, 0)) },
	{ label: 'завтра 10:00', at: (now) => new Date(new Date(now.getTime() + 86_400_000).setHours(10, 0, 0, 0)) },
]

/** 39 «Заявки» — requests matching the master's services and brands; «Могу помочь» / «Не моё». */
export default function MasterRequestsScreen() {
	const c = useColors()
	const types = useServiceTypes().data
	const profile = useMyMaster()
	const [filter, setFilter] = useState<MasterFeedFilter>('NEW')
	const requests = useMasterFeed(filter)
	const accepting = useSetAccepting()
	const offer = useMasterOffer()
	const [helping, setHelping] = useState<MasterFeedItem | null>(null)
	const [viewing, setViewing] = useState<MediaItem[] | null>(null)
	const items = flattenPages(requests.data)

	// The master saw the card — once per request, for the buyer's «Посмотрели» [37].
	const seen = useRef(new Set<number>())
	useEffect(() => {
		for (const item of items) {
			if (item.seen || seen.current.has(item.id)) continue
			seen.current.add(item.id)
			markServiceSeen(item.id)
		}
	}, [items])
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 30_000)
		return () => clearInterval(timer)
	}, [])

	// First master entry: fill «Мои услуги» [38] before the feed.
	if (profile.isSuccess && !profile.data) return <Redirect href={{ pathname: '/master-profile', params: { first: '1' } }} />

	const isAccepting = profile.data?.accepting ?? true

	const header = (
		<View style={{ gap: 10, paddingBottom: 10 }}>
			<View style={{ height: 52, justifyContent: 'center' }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>Заявки</Text>
			</View>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>По вашим услугам и маркам</Text>
				<Pressable
					disabled={!profile.data || accepting.isPending}
					onPress={() => accepting.mutate(!isAccepting)}
					style={{
						height: 32,
						paddingHorizontal: 12,
						borderRadius: 16,
						backgroundColor: isAccepting ? 'rgba(21,128,61,0.12)' : raw.fill,
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: isAccepting ? c.success : c.muted }}>{isAccepting ? '● Принимаю' : '○ Пауза'}</Text>
				</Pressable>
			</View>
			{/* Requests reach only ACTIVE masters — say why the feed is empty. */}
			<AccountStatusBanner
				status={profile.data?.status}
				reason={profile.data?.blockReason}
				kind="master"
				action={{ label: 'Изменить профиль', onPress: () => router.push('/master-profile') }}
			/>
			{/* Not on the mockup: «Отвеченные» and «Истёкшие» from GET /my/master/requests?filter= */}
			<View style={{ flexDirection: 'row', gap: 8 }}>
				{FILTERS.map((option) => (
					<Chip
						key={option.value}
						label={option.label}
						height={32}
						radius={16}
						fontSize={13}
						paddingHorizontal={12}
						color={c.ink}
						selected={option.value === filter}
						onPress={() => setFilter(option.value)}
					/>
				))}
			</View>
			<QueryErrorBanner error={requests.error ?? offer.error ?? accepting.error} onRetry={() => requests.refetch()} />
			{requests.isSuccess && items.length === 0 ? (
				<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted, paddingTop: 16 }}>
					{filter === 'ANSWERED'
						? 'Здесь будут заявки, на которые вы ответили.'
						: filter === 'EXPIRED'
							? 'Истёкших заявок нет.'
							: isAccepting
								? 'Новых заявок нет. Пришлём пуш, как только клиенту понадобится ваша услуга.'
								: 'Вы на паузе — заявки не приходят.'}
				</Text>
			) : null}
		</View>
	)

	return (
		<Screen>
			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				ListHeaderComponent={header}
				contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => requests.hasNextPage && !requests.isFetchingNextPage && requests.fetchNextPage()}
				onRefresh={() => requests.refetch()}
				refreshing={false}
				renderItem={({ item }) => {
					const left = minutesLeft(item.expiresAt, now)
					const when = item.when === 'AT_TIME' && item.atTime ? formatHours(item.atTime) : WHEN_WORD[item.when]
					return (
						<ServiceRequestCard
							code={item.service.code}
							title={item.urgent ? `Срочно · ${serviceName(types, item.service.code)}` : serviceName(types, item.service.code)}
							carLabel={item.car.label}
							description={item.description}
							media={item.media}
							onOpenMedia={() => setViewing(item.media)}
							distance={
								item.where === 'MASTER_COMES' || item.where === 'PICKUP_POINT'
									? `${formatDistance(item.distanceM)} · к клиенту`
									: formatDistance(item.distanceM)
							}
							when={left > 0 ? `${when} · ещё ${formatDuration(left)}` : `${when} · время вышло`}
							answered={
								item.myOffer?.answer === 'CAN_HELP'
									? 'Вы откликнулись — ждём ответа клиента'
									: item.myOffer?.answer === 'NOT_MINE'
										? 'Вы ответили «Не моё»'
										: left <= 0
											? 'Время на ответ вышло'
											: null
							}
							onHelp={() => setHelping(item)}
							onSkip={() => offer.mutate({ id: item.id, body: { answer: 'NOT_MINE' } })}
						/>
					)
				}}
			/>
			<MediaViewer items={viewing} onClose={() => setViewing(null)} />
			{/* Mounted per request, so the price, time and message start empty each time. */}
			{helping ? (
				<HelpSheet
					key={helping.id}
					request={helping}
					error={offer.error?.message ?? null}
					loading={offer.isPending}
					onClose={() => {
						setHelping(null)
						offer.reset()
					}}
					onSend={(body) =>
						helping &&
						offer.mutate(
							{ id: helping.id, body: { answer: 'CAN_HELP', ...body } },
							{
								onSuccess: (result) => {
									setHelping(null)
									// «Могу помочь» opens the chat with the client — the master writes as SHOP.
									if (result?.chatId) router.push({ pathname: '/seller-chat', params: { chatId: String(result.chatId) } })
								},
							}
						)
					}
				/>
			) : null}
		</Screen>
	)
}

/** «Могу помочь» → price from, when I can, a message [API_NEW.md §12.5]. No mockup; styled like 36. */
function HelpSheet({
	request,
	loading,
	error,
	onClose,
	onSend,
}: {
	request: MasterFeedItem | null
	loading: boolean
	error: string | null
	onClose: () => void
	onSend: (body: { priceFrom?: number; availableAt?: string; message?: string }) => void
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [price, setPrice] = useState('')
	// Only moments still ahead — the server rejects a past `availableAt` (400 BAD_TIME).
	const [openedAt] = useState(() => new Date())
	const options = AVAILABLE.filter((o) => o.at(openedAt).getTime() > openedAt.getTime() + 10 * 60_000)
	const [available, setAvailable] = useState(options[0].label)
	const [message, setMessage] = useState('')

	const input = {
		height: 48,
		borderRadius: 12,
		backgroundColor: c.card,
		borderWidth: 2,
		borderColor: c.border,
		paddingHorizontal: 14,
		fontSize: 15,
		fontFamily: fontFamily(400),
		color: c.ink,
	}

	return (
		<Modal visible={request !== null} transparent animationType="slide" onRequestClose={onClose}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} />
				<View
					style={{ backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 28 + insets.bottom, gap: 12 }}
				>
					<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>Могу помочь</Text>
					<Text numberOfLines={2} style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
						{request?.description} · {request?.car.label}
					</Text>
					<SectionLabel>Цена от, сом</SectionLabel>
					<TextInput
						value={price}
						onChangeText={(v) => setPrice(v.replace(/\D/g, ''))}
						keyboardType="number-pad"
						placeholder="1 500"
						placeholderTextColor={raw.fillInk}
						style={input}
					/>
					<SectionLabel>Когда могу</SectionLabel>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{options.map((option) => (
							<Chip
								key={option.label}
								label={option.label}
								radius={12}
								color={c.ink}
								selected={option.label === available}
								onPress={() => setAvailable(option.label)}
							/>
						))}
					</View>
					<TextInput
						value={message}
						onChangeText={(v) => setMessage(v.slice(0, 300))}
						placeholder="Сообщение клиенту — необязательно"
						placeholderTextColor={raw.fillInk}
						multiline
						style={[input, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]}
					/>
					{error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{error}</Text> : null}
					<Button
						label="Откликнуться"
						loading={loading}
						onPress={() =>
							onSend({
								priceFrom: price ? Number(price) : undefined,
								availableAt: (options.find((o) => o.label === available) ?? options[0]).at(new Date()).toISOString(),
								message: message.trim() || undefined,
							})
						}
					/>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}
