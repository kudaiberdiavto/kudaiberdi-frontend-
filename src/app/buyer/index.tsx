import type { ReactNode } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Badge, QueryErrorBanner, Screen, SectionLabel, ServiceIcon } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { formatAgo, plural } from '@/lib/format'
import { useMe } from '@/api/me'
import { useMyRequests } from '@/api/requests'
import { flattenPages } from '@/api/pagination'
import { serviceName, useMyServiceRequests, useServiceTypes } from '@/api/services'
import type { RequestSummary, ServiceRequestSummary } from '@/api/types'
import { useServiceDraft } from '@/store/useServiceDraft'

type Row = { kind: 'part'; request: RequestSummary } | { kind: 'service'; request: ServiceRequestSummary }

export default function BuyerHomeScreen() {
	const c = useColors()
	const me = useMe()
	const requests = useMyRequests()
	const services = useMyServiceRequests()
	// Parts requests and service requests in one list, newest first [05б].
	const items: Row[] = [
		...flattenPages(requests.data).map((request) => ({ kind: 'part' as const, request })),
		...flattenPages(services.data).map((request) => ({ kind: 'service' as const, request })),
	].sort((a, b) => b.request.createdAt.localeCompare(a.request.createdAt))
	const name = me.data?.name

	const header = (
		<View style={{ paddingTop: 12, gap: 12, paddingBottom: 2 }}>
			<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>
				{name ? `Салам, ${name}` : 'Салам!'}
			</Text>

			<Pressable
				onPress={() => router.push('/search-part')}
				style={{
					height: 176,
					marginTop: 6,
					borderRadius: 28,
					backgroundColor: c.brand,
					alignItems: 'center',
					justifyContent: 'center',
					gap: 14,
					overflow: 'hidden',
					shadowColor: c.brand,
					shadowOpacity: 0.35,
					shadowOffset: { width: 0, height: 12 },
					shadowRadius: 14,
					elevation: 12,
				}}
			>
				<View
					style={{
						position: 'absolute',
						width: 240,
						height: 240,
						borderRadius: 120,
						backgroundColor: 'rgba(255,255,255,0.07)',
						right: -80,
						top: -90,
					}}
				/>
				<View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
						<SearchIcon size={34} color={c.brand} strokeWidth={2.6} />
					</View>
				</View>
				<Text style={{ fontSize: 24, fontFamily: fontFamily(800), color: '#FFFFFF' }}>Найти запчасть</Text>
			</Pressable>

			<MastersCard />

			<SectionLabel>Мои запросы и заявки</SectionLabel>

			<QueryErrorBanner
				error={requests.error}
				onRetry={() => requests.refetch()}
				offlineText="Нет сети. Покажем запросы, когда появится"
			/>

			{requests.isSuccess && services.isSuccess && items.length === 0 ? (
				<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
					Здесь появятся ваши запросы и заявки. Нажмите «Найти запчасть» — продавцы, у кого она есть, ответят.
				</Text>
			) : null}
		</View>
	)

	return (
		<Screen>
			<FlatList
				data={items}
				keyExtractor={(item) => `${item.kind}-${item.request.id}`}
				ListHeaderComponent={header}
				contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					if (requests.hasNextPage && !requests.isFetchingNextPage) requests.fetchNextPage()
					if (services.hasNextPage && !services.isFetchingNextPage) services.fetchNextPage()
				}}
				onRefresh={() => {
					requests.refetch()
					services.refetch()
				}}
				refreshing={false}
				renderItem={({ item }) => (item.kind === 'part' ? <RequestRow request={item.request} /> : <ServiceRow request={item.request} />)}
			/>
		</Screen>
	)
}

/** Badge by server `state` — never computed on the client. */
function RequestRow({ request }: { request: RequestSummary }) {
	const c = useColors()

	if (request.state === 'CLOSED') {
		return (
			<View
				style={{
					borderRadius: 16,
					borderWidth: 2,
					borderColor: c.hairline,
					paddingVertical: 14,
					paddingHorizontal: 16,
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
					{request.text} · {request.carLabel}
				</Text>
				<Badge label="Закрыт" tone="muted" />
			</View>
		)
	}

	const badge = {
		HAS_ANSWERS: { label: `${request.haveCount} ${plural(request.haveCount, ['ответил', 'ответили', 'ответили'])}`, tone: 'success' as const },
		EXPIRED: { label: `${request.haveCount} ${plural(request.haveCount, ['ответил', 'ответили', 'ответили'])}`, tone: 'success' as const },
		WAITING: { label: 'Ждём ответов', tone: 'neutral' as const },
		NO_ANSWERS: { label: 'Никто не ответил', tone: 'neutral' as const },
	}[request.state]
	const when = request.state === 'EXPIRED' || request.state === 'NO_ANSWERS' ? 'время вышло' : formatAgo(request.createdAt)

	return (
		<Pressable
			onPress={() => {
				const params = { id: String(request.id) }
				// No answers yet → 20 / stats 32; answers → 07.
				if (request.state === 'NO_ANSWERS') router.push({ pathname: '/empty', params })
				else if (request.state === 'WAITING') router.push({ pathname: '/request-stats', params })
				else router.push({ pathname: '/buyer/requests', params })
			}}
		>
			<ListRow title={request.text} subtitle={`${request.carLabel} · ${when}`} badge={<Badge label={badge.label} tone={badge.tone} />} />
		</Pressable>
	)
}

/** A card of «Мои запросы и заявки» [05б]: title and car · time on the left, the badge on the right. */
function ListRow({ title, subtitle, badge }: { title: string; subtitle: string; badge: ReactNode }) {
	const c = useColors()
	return (
		<View
			style={{
				borderRadius: 16,
				backgroundColor: c.card,
				paddingVertical: 14,
				paddingHorizontal: 16,
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				gap: 12,
			}}
		>
			<View style={{ flex: 1, gap: 3 }}>
				<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
					{title}
				</Text>
				<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
					{subtitle}
				</Text>
			</View>
			{badge}
		</View>
	)
}

/** A service request [05б] → offers 37. Badge by server `state`. */
function ServiceRow({ request }: { request: ServiceRequestSummary }) {
	const types = useServiceTypes().data
	const offers = request.canHelpCount
	const offersLabel = `${offers} ${plural(offers, ['отклик', 'отклика', 'откликов'])}`
	const badge = {
		HAS_OFFERS: { label: offersLabel, tone: 'success' as const },
		EXPIRED: { label: offersLabel, tone: 'success' as const },
		WAITING: { label: 'Ждём мастеров', tone: 'neutral' as const },
		NO_OFFERS: { label: 'Никто не откликнулся', tone: 'neutral' as const },
		CLOSED: { label: 'Закрыта', tone: 'muted' as const },
	}[request.state]
	const when = request.status === 'ACTIVE' ? formatAgo(request.createdAt) : 'время вышло'
	return (
		<Pressable onPress={() => router.push({ pathname: '/service-offers', params: { id: String(request.id) } })}>
			<ListRow
				title={`${serviceName(types, request.service.code, true)} · ${request.description}`}
				subtitle={`${request.carLabel} · ${when}`}
				badge={<Badge label={badge.label} tone={badge.tone} />}
			/>
		</Pressable>
	)
}

/** Popular services on the home screen [05б]. */
const HOME_SERVICES: { code: string; label: string }[] = [
	{ code: 'CAR_REPAIR', label: 'СТО' },
	{ code: 'TIRE_SERVICE', label: 'Шино-\nмонтаж' },
	{ code: 'TOW_TRUCK', label: 'Эвакуатор' },
	{ code: 'CAR_WASH', label: 'Мойка' },
]

/** «Нужен мастер?» — four services and «Все услуги ›», both open the wizard [33]. */
function MastersCard() {
	const c = useColors()
	const setService = useServiceDraft((s) => s.setService)
	return (
		<View style={{ borderRadius: 20, backgroundColor: c.card, padding: 14, gap: 12 }}>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
				<Text style={{ fontSize: 18, fontFamily: fontFamily(800), color: c.ink }}>Нужен мастер?</Text>
				<Pressable onPress={() => router.push('/service-new')} hitSlop={8}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Все услуги ›</Text>
				</Pressable>
			</View>
			<View style={{ flexDirection: 'row', gap: 8 }}>
				{HOME_SERVICES.map((service) => (
					<Pressable
						key={service.code}
						onPress={() => {
							setService(service.code)
							router.push('/service-new')
						}}
						style={{ flex: 1, alignItems: 'center', gap: 6 }}
					>
						<View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<ServiceIcon code={service.code} size={26} color={c.brandStrong} strokeWidth={2.2} />
						</View>
						<Text style={{ fontSize: 12, lineHeight: 13.2, fontFamily: fontFamily(600), color: c.ink, textAlign: 'center' }}>{service.label}</Text>
					</Pressable>
				))}
			</View>
		</View>
	)
}
