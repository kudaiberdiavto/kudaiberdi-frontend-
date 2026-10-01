import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, QueryErrorBanner } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { useCloseRequest, useExtendRequest, useRequest, useWidenRequest } from '@/api/requests'

/** 20 «Пока никто не ответил» — push NO_REPLY or a NO_ANSWERS card on 05. */
export default function EmptyAnswersScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useRequest(id)
	const widen = useWidenRequest(id)
	const extend = useExtendRequest(id)
	const close = useCloseRequest(id)
	const data = request.data

	// Sent to the whole market already — widening adds nobody, offer more time instead.
	const wholeMarket = data?.target === 'MARKET'
	const seen = data?.seenCount ?? 0
	const hint = data
		? `Запрос видели ${seen} ${plural(seen, ['продавец', 'продавца', 'продавцов'])}. ` +
			(wholeMarket ? 'Продлите время — может, ответят позже.' : 'Отправьте всему рынку — деталь редкая.')
		: ' '
	const openAnswers = () => router.replace({ pathname: '/buyer/requests', params: { id: String(id) } })
	const actionError = widen.error ?? extend.error ?? close.error

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<QueryErrorBanner
				error={request.error}
				onRetry={() => request.refetch()}
				offlineText="Нет сети. Покажем ответы, когда появится"
				style={{ marginTop: 4, marginHorizontal: 16 }}
			/>

			<View style={{ paddingTop: 14, paddingHorizontal: 16, gap: 2 }}>
				<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>{data?.text ?? ' '}</Text>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{data?.car.label ?? ' '}</Text>
			</View>

			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
				<View
					style={{
						width: 92,
						height: 92,
						borderRadius: 46,
						borderWidth: 2,
						borderColor: c.border,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<SearchIcon size={40} color="#9B9797" strokeWidth={1.8} />
				</View>
				<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink, textAlign: 'center' }}>
					Пока никто не ответил
				</Text>
				<Text
					style={{
						fontSize: 16,
						lineHeight: 24,
						fontFamily: fontFamily(400),
						color: c.muted,
						textAlign: 'center',
					}}
				>
					{hint}
				</Text>
			</View>

			<View style={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom, gap: 10 }}>
				{actionError ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{actionError.message}</Text>
				) : null}
				{wholeMarket ? (
					<Button
						label="Продлить на 30 мин"
						disabled={!data?.canExtend}
						loading={extend.isPending}
						onPress={() => extend.mutate(30, { onSuccess: openAnswers })}
					/>
				) : (
					<Button
						label="Отправить всему рынку"
						disabled={!data}
						loading={widen.isPending}
						onPress={() => widen.mutate('MARKET', { onSuccess: openAnswers })}
					/>
				)}
				<Button
					label="Закрыть запрос"
					variant="outline"
					height={52}
					fontSize={16}
					disabled={!data}
					loading={close.isPending}
					onPress={() => close.mutate({}, { onSuccess: () => router.replace('/buyer') })}
				/>
			</View>
		</View>
	)
}
