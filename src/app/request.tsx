import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BottomSheet, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import {
	BubbleIcon,
	CallIcon,
	ChevronIcon,
	CrossIcon,
	LoupeIcon,
	RouteIcon,
	TickIcon,
	TopBar,
	priceDigits,
	replyChips,
} from '@/components/buyer-v23'
import { VoicePlayer } from '@/components/voice'
import { MediaStrip, photosAsMedia } from '@/components/media-strip'
import { fontFamily, useColors } from '@/theme'
import { minutesLeft, plural } from '@/lib/format'
import { resolveUrl } from '@/lib/api'
import {
	useCloseRequest,
	useExtendRequest,
	useFalseHave,
	useRequest,
	useRequestReplies,
	useRequestStats,
} from '@/api/requests'
import type { Reply } from '@/api/types'
import { openShopRoute } from '@/lib/shop-place'

type Sort = 'CHEAP' | 'NEAR'

/**
 * 05 «Ответы»: timer and «Ещё 30 мин», sorting, «Есть · N» with the price large and the seller's voice,
 * «Нет · N» — just the places. 08 «Нашли запчасть?» — a sheet: bought from whom, «сказали есть, а не было», still looking.
 */
export default function RequestScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useRequest(id)
	const replies = useRequestReplies(id)
	const stats = useRequestStats(id)
	const extend = useExtendRequest(id)
	const [sort, setSort] = useState<Sort>('CHEAP')
	const [onlyNew, setOnlyNew] = useState(false)
	const [tab, setTab] = useState<'HAVE' | 'NOT_HAVE'>('HAVE')
	const [sheet, setSheet] = useState(false)
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 15_000)
		return () => clearInterval(timer)
	}, [])

	const detail = request.data
	const counts = stats.data?.counts
	const have = replies.data ?? []
	const left = detail ? minutesLeft(detail.expiresAt, now) : 0
	const active = detail?.status === 'ACTIVE' && left > 0
	const closed = detail?.status === 'CLOSED'

	// Time is up with answers — ask right away whether the part was found [08].
	const [dismissed, setDismissed] = useState(false)
	const showSheet = sheet || (!dismissed && detail?.status === 'EXPIRED' && detail.haveCount > 0)

	const shown = have
		.filter((reply) => !onlyNew || reply.condition === 'NEW')
		.sort((a, b) =>
			sort === 'CHEAP'
				? (a.price ?? Infinity) - (b.price ?? Infinity)
				: (a.walkMinutes ?? Infinity) - (b.walkMinutes ?? Infinity)
		)
	const askedCount = counts?.delivered ?? detail?.recipientsCount ?? 0
	const answered = counts ? counts.have + counts.notHave : have.length

	const title = detail?.text ?? ' '

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar
				title={title}
				right={detail ? <BrandLogo brand={detail.car.brand} size={30} /> : null}
			/>

			<ScrollView
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16 + insets.bottom, gap: 10 }}
				showsVerticalScrollIndicator={false}
			>
				<QueryErrorBanner error={request.error ?? replies.error} onRetry={() => {
						request.refetch()
						replies.refetch()
					}}
				/>

				{detail ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
						<View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: active ? '#E7F6EC' : c.surface, alignItems: 'center', justifyContent: 'center' }}>
							<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: active ? c.success : c.border }} />
						</View>
						<View style={{ flex: 1, gap: 2 }}>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>
								{closed
									? 'Запрос закрыт'
									: active
										? `Ищем ещё ${left} ${plural(left, ['минуту', 'минуты', 'минут'])}`
										: 'Время вышло'}
							</Text>
							<Text style={{ fontSize: 13.5, fontFamily: fontFamily(400), color: c.muted }}>
								Спросили {askedCount} {plural(askedCount, ['продавца', 'продавцов', 'продавцов'])} · ответили {answered}
							</Text>
						</View>
						{!closed && detail.canExtend ? (
							<Pressable
								onPress={() => extend.mutate(30)}
								disabled={extend.isPending}
								style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: c.brandTint, justifyContent: 'center' }}
							>
								{extend.isPending ? (
									<ActivityIndicator size="small" color={c.brandStrong} />
								) : (
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>Ещё 30 мин</Text>
								)}
							</Pressable>
						) : null}
					</View>
				) : null}
				{extend.error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{extend.error.message}</Text> : null}

				{/* What the buyer attached — voice and photos — not in the mockup, but they should see what they asked. */}
				{detail?.voice || detail?.photos.length ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 8 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Ваш запрос</Text>
						{detail.voice ? <VoicePlayer voice={detail.voice} /> : null}
						<MediaStrip media={photosAsMedia(detail.photos)} />
					</View>
				) : null}

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
					<SortChip label="Дешевле" active={sort === 'CHEAP'} onPress={() => setSort('CHEAP')} />
					<SortChip label="Ближе ко входу" active={sort === 'NEAR'} onPress={() => setSort('NEAR')} />
					<SortChip label="Только новые" active={onlyNew} onPress={() => setOnlyNew(!onlyNew)} />
				</ScrollView>

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Text
						onPress={() => setTab('HAVE')}
						style={{
							fontSize: 13,
							fontFamily: fontFamily(tab === 'HAVE' ? 700 : 600),
							letterSpacing: tab === 'HAVE' ? 1.04 : 0,
							color: c.muted,
						}}
					>
						{tab === 'HAVE' ? `ЕСТЬ · ${have.length}` : `Есть · ${have.length}`}
					</Text>
					<View style={{ flex: 1 }} />
					<Text
						onPress={() => setTab('NOT_HAVE')}
						style={{
							fontSize: 13,
							fontFamily: fontFamily(tab === 'NOT_HAVE' ? 700 : 600),
							letterSpacing: tab === 'NOT_HAVE' ? 1.04 : 0,
							color: c.muted,
						}}
					>
						{tab === 'NOT_HAVE' ? `НЕТ · ${counts?.notHave ?? 0}` : `Нет · ${counts?.notHave ?? 0}`}
					</Text>
				</View>

				{tab === 'HAVE' ? (
					<>
						{replies.isSuccess && have.length === 0 ? (
							<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
								{active ? 'Ждём ответов — обычно отвечают за 5–10 минут.' : 'Пока никто не ответил «Есть».'}
							</Text>
						) : null}
						{shown.map((reply, index) => (
							<ReplyCard key={reply.id} reply={reply} best={index === 0} />
						))}
						{have.length > 0 && !closed ? (
							<Pressable onPress={() => setSheet(true)} style={{ alignItems: 'center', paddingVertical: 10 }}>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>Нашли запчасть?</Text>
							</Pressable>
						) : null}
					</>
				) : (
					<View style={{ borderRadius: 18, backgroundColor: c.card, paddingHorizontal: 14 }}>
						{(stats.data?.notHave ?? []).map((place, index) => (
							<View
								key={index}
								style={{
									height: 48,
									justifyContent: 'center',
									borderTopWidth: index ? 1 : 0,
									borderTopColor: c.hairline,
								}}
							>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>
									{place.row ? `Ряд ${place.row}` : 'Ряд —'} · конт. {place.container ?? '—'}
								</Text>
							</View>
						))}
						{(stats.data?.notHave ?? []).length === 0 ? (
							<Text style={{ paddingVertical: 14, fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Никто не ответил «Нет»</Text>
						) : null}
					</View>
				)}
			</ScrollView>

			{showSheet ? (
				<FoundSheet
					id={id}
					replies={have}
					onClose={() => {
						setSheet(false)
						setDismissed(true)
					}}
				/>
			) : null}
		</View>
	)
}

function SortChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				height: 36,
				paddingHorizontal: 14,
				borderRadius: 18,
				backgroundColor: active ? c.brand : c.card,
				borderWidth: active ? 0 : 1.5,
				borderColor: c.border,
				justifyContent: 'center',
			}}
		>
			<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}>{label}</Text>
		</Pressable>
	)
}

/** Shop avatar 44px; no photo — the first letter. */
function ShopAvatar({ name, url, size = 44 }: { name: string; url: string | null; size?: number }) {
	const c = useColors()
	const uri = resolveUrl(url)
	return uri ? (
		<Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.surface }} />
	) : (
		<View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
			<Text style={{ fontSize: size * 0.4, fontFamily: fontFamily(700), color: c.brandStrong }}>{name.slice(0, 1).toUpperCase()}</Text>
		</View>
	)
}

/** One «Есть» answer [05]: who and where, the price large, chips, the seller's voice, «Позвонить». */
function ReplyCard({ reply, best }: { reply: Reply; best: boolean }) {
	const c = useColors()
	const shop = reply.shop
	if (!shop) return null
	const place = shop.location
		? `Ряд ${shop.location.rowCode} · конт. ${shop.location.number}${reply.walkMinutes != null ? ` · ${reply.walkMinutes} мин` : ''}`
		: (shop.address ?? '')
	const chips = replyChips(reply)
	return (
		<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10, borderWidth: 2, borderColor: best ? c.success : c.card }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<ShopAvatar name={shop.name} url={shop.avatarUrl} />
				<View style={{ flex: 1, gap: 2 }}>
					<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
						{shop.name}
					</Text>
					<Text style={{ fontSize: 13.5, fontFamily: fontFamily(400), color: c.muted }}>{place}</Text>
				</View>
				{reply.price != null ? (
					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontSize: 22, lineHeight: 28.6, fontFamily: fontFamily(800), letterSpacing: -0.22, color: c.ink }}>
							{priceDigits(reply.price)}
						</Text>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: c.muted }}>сом</Text>
					</View>
				) : null}
			</View>
			{chips.length ? (
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
					{chips.map((chip, index) => {
						const green = index === 0 && reply.condition === 'NEW'
						return (
							<View key={chip} style={{ height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: green ? '#E7F6EC' : c.surface, justifyContent: 'center' }}>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: green ? c.success : c.ink }}>{chip}</Text>
							</View>
						)
					})}
				</View>
			) : null}
			{reply.voice ? <VoicePlayer voice={reply.voice} tone="green" /> : null}
			{reply.message ? <Text style={{ fontSize: 14, lineHeight: 19, fontFamily: fontFamily(400), color: c.inkSecondary }}>{reply.message}</Text> : null}
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<Pressable
					onPress={() => shop.phone && Linking.openURL(`tel:${shop.phone}`)}
					disabled={!shop.phone}
					style={{
						flex: 1,
						height: 48,
						borderRadius: 14,
						backgroundColor: c.success,
						opacity: shop.phone ? 1 : 0.45,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
					}}
				>
					<CallIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Позвонить</Text>
				</Pressable>
				<SquareButton onPress={() => reply.chatId && router.push({ pathname: '/chat', params: { chatId: String(reply.chatId) } })}>
					<BubbleIcon size={22} color={c.brandStrong} />
				</SquareButton>
				<SquareButton
					onPress={() =>
						openShopRoute(shop, { chatId: reply.chatId })
					}
				>
					<RouteIcon size={22} color={c.brandStrong} />
				</SquareButton>
			</View>
		</View>
	)
}

function SquareButton({ children, onPress }: { children: ReactNode; onPress: () => void }) {
	const c = useColors()
	return (
		<Pressable onPress={onPress} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
			{children}
		</Pressable>
	)
}

/** 08 «Нашли запчасть?». */
function FoundSheet({ id, replies, onClose }: { id: number; replies: Reply[]; onClose: () => void }) {
	const c = useColors()
	const close = useCloseRequest(id)
	const falseHave = useFalseHave(id)
	const extend = useExtendRequest(id)
	const [step, setStep] = useState<'MAIN' | 'FALSE'>('MAIN')
	const [marked, setMarked] = useState<number[]>([])
	const shops = replies.flatMap((reply) => (reply.shop ? [reply.shop] : []))
	const error = close.error ?? falseHave.error ?? extend.error

	const shopCard = (shop: (typeof shops)[number], selected: boolean, onPress: () => void, done = false) => (
		<Pressable
			key={shop.id}
			onPress={onPress}
			disabled={done}
			style={{
				width: 104,
				borderRadius: 14,
				borderWidth: 2,
				borderColor: selected ? c.brand : c.border,
				backgroundColor: selected ? c.brandTint : c.card,
				paddingVertical: 10,
				paddingHorizontal: 6,
				alignItems: 'center',
				gap: 6,
				opacity: done ? 0.5 : 1,
			}}
		>
			<ShopAvatar name={shop.name} url={shop.avatarUrl} size={40} />
			<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(700), color: selected ? c.brandStrong : c.ink, textAlign: 'center' }}>
				{shop.name}
			</Text>
			<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>
				{done ? 'отмечен' : shop.location ? `${shop.location.rowCode} · ${shop.location.number}` : 'магазин'}
			</Text>
		</Pressable>
	)

	return (
		<BottomSheet
			onClose={onClose}
			maxHeight={0.8}
			header={
				<Text style={{ fontSize: 24, lineHeight: 31.2, fontFamily: fontFamily(800), letterSpacing: -0.24, color: c.ink }}>
					{step === 'MAIN' ? 'Нашли запчасть?' : 'Кто сказал «есть»?'}
				</Text>
			}
		>
			<View style={{ gap: 12 }}>
				{step === 'MAIN' ? (
					<>
						<View style={{ borderRadius: 16, borderWidth: 2, borderColor: c.success, backgroundColor: '#E7F6EC', padding: 14, gap: 12 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
								<View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}>
									<TickIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
								</View>
								<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>Да, купил — у кого?</Text>
							</View>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
								{shops.map((shop) =>
									shopCard(shop, close.variables?.shopId === shop.id, () =>
										close.mutate({ shopId: shop.id }, {
											onSuccess: () => {
												onClose()
												router.back()
											},
										})
									)
								)}
							</ScrollView>
						</View>
						<SheetRow
							tone="red"
							icon={<CrossIcon size={22} color={c.danger} strokeWidth={2.2} />}
							title="Сказали «есть», а не было"
							subtitle="Продавец получит отметку"
							onPress={() => setStep('FALSE')}
						/>
						<SheetRow
							icon={<LoupeIcon size={22} color={c.brandStrong} />}
							title="Ещё ищу"
							subtitle="Продлим запрос на 30 минут"
							onPress={() => extend.mutate(30, { onSuccess: onClose })}
						/>
					</>
				) : (
					<>
						<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
							Выберите продавца. Если так отметят три покупателя — запросы ему не будут приходить 7 дней.
						</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
							{shops.map((shop) =>
								shopCard(
									shop,
									false,
									() => falseHave.mutate(shop.id, { onSuccess: () => setMarked((list) => [...list, shop.id]) }),
									marked.includes(shop.id)
								)
							)}
						</ScrollView>
						<SheetRow icon={<LoupeIcon size={22} color={c.brandStrong} />} title="Готово" subtitle="Вернуться к ответам" onPress={onClose} />
					</>
				)}
				{error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
			</View>
		</BottomSheet>
	)
}

function SheetRow({
	icon,
	title,
	subtitle,
	tone = 'blue',
	onPress,
}: {
	icon: ReactNode
	title: string
	subtitle: string
	tone?: 'blue' | 'red'
	onPress: () => void
}) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{ borderRadius: 16, borderWidth: 2, borderColor: c.border, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
		>
			<View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tone === 'red' ? '#FDECEC' : c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
				{icon}
			</View>
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{title}</Text>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{subtitle}</Text>
			</View>
			<ChevronIcon size={20} color="#B8B4B4" />
		</Pressable>
	)
}
