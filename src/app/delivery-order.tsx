import { useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { BigButton, BubbleIcon, TickIcon, priceDigits } from '@/components/buyer-v23'
import { QueryErrorBanner, ScreenHeader, Skeleton } from '@/components/ui'
import { ClockOutline, routeTitle, toRegion } from '@/components/video-v23'
import { WhatsAppIcon } from '@/components/icons'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { formatDay, formatWhenAt } from '@/lib/format'
import { askForReview } from '@/lib/store-review'
import { useMe } from '@/api/me'
import {
	useDeliveryOrder,
	usePackDeliveryOrder,
	usePickedUpDeliveryOrder,
	useReceiveDeliveryOrder,
} from '@/api/delivery'
import type { DeliveryOrder } from '@/api/types'
import { t } from '@/i18n'

/**
 * One delivery order. The buyer sees «Где посылка» (status card, timeline, track number); the shop — «Заказ с
 * доставкой» (pack, weight, «Хрупкое», «Упаковал — жду курьера», then «Курьер забрал»). `as=shop` — opened by
 * the seller; otherwise the side is the shop's when the order is of the user's shop.
 */
export default function DeliveryOrderScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ id: string; as?: string }>()
	const id = Number(params.id) || 0
	const order = useDeliveryOrder(id)
	const me = useMe().data
	const data = order.data
	const asShop = params.as === 'shop' || (data && me?.shop?.id === data.shop.id)

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={asShop ? t('Заказ с доставкой') : t('Где посылка')} />
			<QueryErrorBanner error={order.error} onRetry={() => order.refetch()} />
			{!data ? (
				order.isLoading ? <OrderSkeleton /> : null
			) : asShop ? (
				<ShopSide order={data} bottom={insets.bottom} />
			) : (
				<BuyerSide order={data} bottom={insets.bottom} />
			)}
		</KeyboardAvoidingView>
	)
}

/** Карточка маршрута и шаги доставки, пока заказ грузится. */
function OrderSkeleton() {
	const c = useColors()
	return (
		<View style={{ paddingHorizontal: 16, gap: 10 }}>
			<Skeleton height={132} radius={20} />
			<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 14, gap: 18 }}>
				{[0.55, 0.45, 0.6, 0.5, 0.4].map((w, i) => (
					<View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<Skeleton width={22} height={22} radius={11} />
						<View style={{ flex: 1, gap: 7 }}>
							<Skeleton width={`${w * 100}%`} height={15} />
							<Skeleton width="35%" height={12} />
						</View>
					</View>
				))}
			</View>
		</View>
	)
}

/** «Сегодня 10:24». */
function dayTime(value: string) {
	const text = formatWhenAt(value)
	return text.charAt(0).toUpperCase() + text.slice(1)
}

/** «Ряд 14 · конт. 12» → «Ряд 14, конт. 12». */
const placeComma = (place: string | null) => (place ?? t('контейнер')).replace(' · ', ', ')

/** When the courier brings the parcel: picked up (or the pick-up day) + the region's days. */
function arrivalText(order: DeliveryOrder, now = new Date()) {
	if (order.status === 'DELIVERED') return t('Доставлено {0}', order.deliveredAt ? formatWhenAt(order.deliveredAt) : '').trim()
	if (order.status === 'CANCELLED') return t('Заказ отменён')
	const base = order.pickedUpAt ? new Date(order.pickedUpAt) : new Date(now.getTime() + (order.pickupToday ? 0 : 86_400_000))
	const arrival = new Date(base.getTime() + order.days * 86_400_000)
	const days = Math.round((new Date(arrival).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000)
	const day = days <= 0 ? t('сегодня') : days === 1 ? t('завтра') : days === 2 ? t('послезавтра') : formatDay(arrival)
	return t('Курьер привезёт домой {0}', day)
}

const CAPTION: Record<DeliveryOrder['status'], string> = {
	NEW: t('Оформлен'),
	PACKED: t('Упакован'),
	COURIER_ORDERED: t('Ждёт курьера'),
	PICKED_UP: t('В пути'),
	DELIVERED: t('Доставлен'),
	CANCELLED: t('Отменён'),
}

// ─── Buyer: «Где посылка» ────────────────────────────────────────────────────

function BuyerSide({ order, bottom }: { order: DeliveryOrder; bottom: number }) {
	const c = useColors()
	const receive = useReceiveDeliveryOrder(order.id)
	const destination = order.districtName ?? order.regionName
	const steps = [
		{ title: t('Заказ оформлен'), at: order.createdAt, note: t('оплату обсудили в чате') },
		{ title: t('Продавец упаковал'), at: order.packedAt },
		{ title: t('Заказали курьера Ылдам'), at: order.courierOrderedAt },
		{ title: t('Курьер забрал с рынка'), at: order.pickedUpAt, note: placeComma(order.shop.place) },
		{ title: order.region === 'BISHKEK' ? t('Едет к вам') : t('Едет в {0}', toRegion(destination)), at: order.status === 'DELIVERED' ? order.deliveredAt : null },
		{ title: t('Курьер привезёт домой'), at: order.deliveredAt, note: t('{0} · позвонит заранее', order.address) },
	]
	// Steps may be skipped (the seller can mark «Курьер забрал» before the admin): everything before the last done is done.
	const lastDone = steps.reduce((last, step, i) => (step.at ? i : last), -1)
	const current = order.status === 'CANCELLED' ? -1 : lastDone + 1
	const filled = Math.min(5, lastDone + 1)

	return (
		<>
			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<LinearGradient
					colors={order.status === 'CANCELLED' ? fixed.cancelledGradient : fixed.brandGradient}
					start={{ x: 0.25, y: 0 }}
					end={{ x: 0.75, y: 1 }}
					style={{ borderRadius: 20, padding: 16, gap: 6 }}
				>
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: 'rgba(255,255,255,0.85)' }}>
						{CAPTION[order.status]}
					</Text>
					<Text style={{ fontSize: fs.h2, fontFamily: fontFamily(800), letterSpacing: -0.4, color: fixed.white }}>{routeTitle(order)}</Text>
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.9)' }}>{arrivalText(order)}</Text>
					<View style={{ flexDirection: 'row', gap: 6, paddingTop: 6 }}>
						{[0, 1, 2, 3, 4].map((i) => (
							<View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < filled ? fixed.white : 'rgba(255,255,255,0.3)' }} />
						))}
					</View>
				</LinearGradient>

				<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 14, paddingHorizontal: 14 }}>
					{steps.map((step, i) => {
						const done = i <= lastDone
						const now = i === current
						const line = done
							? [step.at ? dayTime(step.at) : null, step.note].filter(Boolean).join(' · ')
							: now && i === 4
								? t('Сейчас')
								: (step.note ?? '')
						return (
							<View key={step.title} style={{ flexDirection: 'row', gap: 12 }}>
								<View style={{ alignItems: 'center' }}>
									{done ? (
										<View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}>
											<TickIcon size={13} color={fixed.white} />
										</View>
									) : now ? (
										<View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
											<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.brand }} />
										</View>
									) : (
										<View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border }} />
									)}
									{i < steps.length - 1 ? <View style={{ flex: 1, width: 2, minHeight: 14, backgroundColor: i < lastDone ? c.success : c.border }} /> : null}
								</View>
								<View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? 12 : 0, gap: 1 }}>
									<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: now ? c.brandStrong : done ? c.ink : c.muted }}>{step.title}</Text>
									{line ? <Text style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>{line}</Text> : null}
								</View>
							</View>
						)
					})}
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.muted }}>{t('Трек-номер')}</Text>
						<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(800), color: c.ink }}>{order.number}</Text>
					</View>
					{/* No clipboard module in the app — the share sheet has «Скопировать». */}
					<Pressable
						onPress={() => Share.share({ message: order.number })}
						style={{ height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1.5, borderColor: c.border, justifyContent: 'center' }}
					>
						<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.ink }}>{t('Скопировать')}</Text>
					</Pressable>
				</View>
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: bottom + 12, gap: 10 }}>
				<QueryErrorBanner error={receive.error} />
				{order.status === 'PICKED_UP' || order.status === 'COURIER_ORDERED' ? (
					<BigButton label={t('Получил посылку')} onPress={() => receive.mutate(undefined, { onSuccess: () => askForReview() })} loading={receive.isPending} />
				) : null}
				<View style={{ flexDirection: 'row', gap: 10 }}>
					{order.chatId ? (
						<Pressable
							onPress={() => router.push({ pathname: '/chat', params: { chatId: String(order.chatId) } })}
							style={{ flex: 1, height: 52, paddingHorizontal: 10, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
						>
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{t('Чат с продавцом')}</Text>
						</Pressable>
					) : null}
					{order.courierWhatsappUrl ? (
						<Pressable
							// WhatsApp Ылдам with the form filled: the seller, the box / shop address, phones, the parcel.
							onPress={() => Linking.openURL(order.courierWhatsappUrl)}
							style={{
								flex: 1,
								height: 52,
								paddingHorizontal: 10,
								borderRadius: 14,
								backgroundColor: fixed.whatsapp,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
							}}
						>
							<WhatsAppIcon size={22} color={fixed.white} />
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{t('Курьер Ылдам')}</Text>
						</Pressable>
					) : null}
				</View>
			</View>
		</>
	)
}

// ─── Shop: «Заказ с доставкой» ───────────────────────────────────────────────

function ShopSide({ order, bottom }: { order: DeliveryOrder; bottom: number }) {
	const c = useColors()
	const pack = usePackDeliveryOrder(order.id)
	const pickedUp = usePickedUpDeliveryOrder(order.id)
	const [weight, setWeight] = useState(order.weightKg != null ? String(order.weightKg) : '')
	const [fragile, setFragile] = useState(order.fragile)
	const destination = order.districtName ?? order.regionName
	const packed = order.status !== 'NEW'
	const handed = order.status === 'PICKED_UP' || order.status === 'DELIVERED'
	const weightKg = Number(weight.replace(',', '.'))
	const weightOk = weightKg >= 0.1 && weightKg <= 100
	const when = order.pickupToday ? t('сегодня') : t('завтра')
	const caption =
		order.status === 'NEW'
			? t('Новый заказ')
			: order.status === 'CANCELLED'
				? t('Отменён')
				: order.status === 'DELIVERED'
					? t('Доставлен')
					: handed
						? t('Отдан курьеру')
						: t('Упакован')
	const buyerName = order.buyer?.name ?? order.recipientName

	const step = (n: number, done: boolean, title: string, body: string, extra?: React.ReactNode) => (
		<View style={{ flexDirection: 'row', gap: 12 }}>
			<View
				style={{
					width: 26,
					height: 26,
					borderRadius: 13,
					backgroundColor: done ? c.success : c.brand,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{done ? <TickIcon size={14} color={fixed.white} /> : <Text style={{ fontSize: fs.md, fontFamily: fontFamily(800), color: fixed.white }}>{n}</Text>}
			</View>
			<View style={{ flex: 1, gap: 3 }}>
				<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>{title}</Text>
				<Text style={{ fontSize: fs.sm, lineHeight: 18.5, fontFamily: fontFamily(400), color: c.muted }}>{body}</Text>
				{extra}
			</View>
		</View>
	)

	return (
		<>
			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				<View style={{ borderRadius: 18, backgroundColor: c.warningSoft, padding: 16, gap: 4 }}>
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.warningInk }}>
						{t('{0} · в {1}', caption, toRegion(destination))}
					</Text>
					<Text style={{ fontSize: fs.xxl, lineHeight: 25.5, fontFamily: fontFamily(800), color: c.ink }}>{order.part.title}</Text>
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: c.inkSecondary }}>
						{t('{0} сом · покупатель {1}', priceDigits(order.part.price), buyerName)}
					</Text>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 14, gap: 16 }}>
					{step(
						1,
						packed,
						t('Упакуйте посылку'),
						t('Подпишите: «{0} · {1}»', destination, order.recipientName),
						<View style={{ flexDirection: 'row', gap: 8, paddingTop: 6 }}>
							<View
								style={{
									height: 40,
									borderRadius: 10,
									borderWidth: 1.5,
									borderColor: c.border,
									paddingHorizontal: 10,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.muted }}>{t('Вес, кг')}</Text>
								<TextInput
									value={weight}
									onChangeText={setWeight}
									editable={!packed}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={c.fillInk}
									style={{ width: 44, fontSize: fs.base, fontFamily: fontFamily(700), color: c.ink, padding: 0, textAlign: 'center' }}
								/>
							</View>
							<Pressable
								onPress={() => !packed && setFragile(!fragile)}
								style={{
									height: 40,
									borderRadius: 10,
									borderWidth: 1.5,
									borderColor: c.border,
									paddingHorizontal: 10,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<View
									style={{
										width: 18,
										height: 18,
										borderRadius: 4,
										borderWidth: 1.5,
										borderColor: fragile ? c.success : c.chevron,
										backgroundColor: fragile ? c.success : 'transparent',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									{fragile ? <TickIcon size={11} color={fixed.white} /> : null}
								</View>
								<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: c.ink }}>{t('Хрупкое')}</Text>
							</Pressable>
						</View>
					)}
					{step(2, packed, t('Нажмите «Упаковал»'), t('До 17:30 — курьер заберёт сегодня, позже — завтра. Курьера закажем мы сами'))}
					{step(3, handed, t('Отдайте курьеру'), t('Он сам придёт в {0} — потом нажмите «Курьер забрал»', placeComma(order.shop.place)))}
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
					<View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
						<ClockOutline size={20} color={c.brandStrong} />
					</View>
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.muted }}>{t('Курьер')}</Text>
						<Text style={{ fontSize: fs.lg, lineHeight: 23, fontFamily: fontFamily(700), color: c.ink }}>
							{order.status === 'DELIVERED'
								? t('Покупатель получил посылку')
								: handed
									? t('Забрал посылку') + (order.pickedUpAt ? ` ${formatWhenAt(order.pickedUpAt)}` : '')
									: t('Приедет {0} — будьте в контейнере', when)}
						</Text>
					</View>
				</View>

				{order.chatId ? (
					<Pressable
						onPress={() => router.push({ pathname: '/seller-chat', params: { chatId: String(order.chatId) } })}
						style={{ borderRadius: 12, backgroundColor: c.brandTint, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
					>
						<BubbleIcon size={18} color={c.brandStrong} />
						<Text style={{ flex: 1, fontSize: fs.md, fontFamily: fontFamily(600), color: c.brandStrong }}>{t('Оплату договоритесь с покупателем в чате')}</Text>
						<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Чат')}</Text>
					</Pressable>
				) : null}

				<QueryErrorBanner error={pack.error ?? pickedUp.error} />
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: bottom + 12 }}>
				{order.status === 'NEW' ? (
					<BigButton
						label={t('Упаковал — жду курьера')}
						disabled={!weightOk}
						loading={pack.isPending}
						onPress={() => pack.mutate({ weightKg: Math.round(weightKg * 10) / 10, fragile })}
					/>
				) : order.status === 'PACKED' || order.status === 'COURIER_ORDERED' ? (
					<BigButton label={t('Курьер забрал')} loading={pickedUp.isPending} onPress={() => pickedUp.mutate()} />
				) : (
					<BigButton
						label={order.status === 'DELIVERED' ? t('Покупатель получил') : order.status === 'CANCELLED' ? t('Заказ отменён') : t('Отдали курьеру')}
						tone="grey"
						disabled
					/>
				)}
			</View>
		</>
	)
}
