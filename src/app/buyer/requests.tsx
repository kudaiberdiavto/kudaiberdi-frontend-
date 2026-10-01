import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, Card, QueryErrorBanner, Screen } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { formatHours, formatPlace, formatPrice, plural } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useMyRequests, useRequest, useRequestReplies } from '@/api/requests'
import type { Reply } from '@/api/types'

/** 07 «Кто ответил «есть»». Without `id` (the tab itself) — the latest request. */
export default function BuyerAnswersScreen() {
	const c = useColors()
	const params = useLocalSearchParams<{ id?: string }>()
	const latest = useMyRequests()
	const id = params.id ? Number(params.id) : flattenPages(latest.data)[0]?.id

	if (!id) {
		return (
			<Screen>
				<View style={{ paddingTop: 12, gap: 14 }}>
					<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Запросы</Text>
					<QueryErrorBanner error={latest.error} onRetry={() => latest.refetch()} />
					{latest.isSuccess ? (
						<>
							<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
								Запросов пока нет. Спросите деталь — ответят те, у кого она есть.
							</Text>
							<Button label="Найти запчасть" onPress={() => router.push('/search-part')} />
						</>
					) : null}
				</View>
			</Screen>
		)
	}

	return <Answers id={id} canGoBack={Boolean(params.id)} />
}

function Answers({ id, canGoBack }: { id: number; canGoBack: boolean }) {
	const c = useColors()
	const request = useRequest(id)
	const replies = useRequestReplies(id)
	const data = request.data
	// Only «Есть» answers come here, and they always carry the shop.
	const items = (replies.data ?? []).filter((r): r is Reply & { shop: NonNullable<Reply['shop']> } => r.shop !== null)
	const firstOpen = items.findIndex((r) => r.shop.open.openNow)

	const have = data?.haveCount ?? 0
	const summary = `${have} ${plural(have, ['продавец', 'продавца', 'продавцов'])} ${plural(have, ['ответил', 'ответили', 'ответили'])} «есть»`
	const status =
		data?.status === 'ACTIVE' ? 'ещё ждём' : data?.status === 'CLOSED' ? 'закрыт' : data ? 'время вышло' : ''

	return (
		<Screen padding={0}>
			<View
				style={{
					paddingTop: 4,
					paddingHorizontal: 16,
					paddingBottom: 12,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 12,
				}}
			>
				{canGoBack ? (
					<Pressable onPress={() => router.back()}>
						<ChevronLeftIcon size={24} color={c.ink} />
					</Pressable>
				) : null}
				<View style={{ flex: 1, gap: 2 }}>
					<Text numberOfLines={1} style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>
						{data?.text ?? ' '}
					</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{data?.car.label ?? ' '}</Text>
				</View>
			</View>

			<QueryErrorBanner
				error={request.error ?? replies.error}
				onRetry={() => {
					request.refetch()
					replies.refetch()
				}}
				offlineText="Нет сети. Покажем ответы, когда появится"
				style={{ marginHorizontal: 16, marginBottom: 14 }}
			/>

			{data ? (
				<Pressable
					// Tap — request stats [32]: who got it, saw it, said «нет»; extend.
					onPress={() => router.push({ pathname: '/request-stats', params: { id: String(id) } })}
					style={{
						marginHorizontal: 16,
						marginBottom: 14,
						borderRadius: 14,
						backgroundColor: c.card,
						paddingVertical: 12,
						paddingHorizontal: 14,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: have ? c.success : c.border }} />
					<Text style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>{summary}</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{status}</Text>
				</Pressable>
			) : null}

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
				{items.map((reply, i) => (
					<ReplyCard key={reply.id} reply={reply} primary={i === firstOpen} />
				))}
			</ScrollView>
		</Screen>
	)
}

function ReplyCard({ reply, primary }: { reply: Reply & { shop: NonNullable<Reply['shop']> }; primary: boolean }) {
	const c = useColors()
	const { shop } = reply
	const open = shop.open.openNow
	// Message box shows the seller's text; without it — the price, if given.
	const note = reply.message ?? (reply.price ? formatPrice(reply.price) : null)

	return (
		<Card style={{ gap: 10 }}>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>
					{shop.name}
				</Text>
				{shop.reviewsCount > 0 ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.ink }}>★ {shop.rating.toFixed(1)}</Text>
				) : null}
			</View>

			<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.inkSecondary }}>
				{formatPlace(shop.location)} ·{' '}
				<Text style={{ color: open ? c.success : c.muted }}>
					{open ? `открыт до ${formatHours(shop.open.openTo)}` : 'закрыт'}
				</Text>
			</Text>

			{open && note ? (
				<View style={{ borderRadius: 12, backgroundColor: raw.fill, paddingVertical: 10, paddingHorizontal: 12 }}>
					<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.ink }}>{note}</Text>
				</View>
			) : null}

			{open ? (
				<Button
					label="Написать"
					variant={primary ? 'primary' : 'secondary'}
					height={48}
					radius={12}
					fontSize={16}
					onPress={() => router.push({ pathname: '/chat', params: { chatId: String(reply.chatId) } })}
				/>
			) : null}
		</Card>
	)
}
