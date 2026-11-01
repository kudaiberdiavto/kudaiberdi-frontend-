import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { QueryErrorBanner, Screen } from '@/components/ui'
import { TopBar } from '@/components/buyer-v23'
import { useColors } from '@/theme'
import { minutesLeft } from '@/lib/format'
import { markServiceSeen, serviceName, useMasterOffer, useMasterRequest, useServiceTypes } from '@/api/services'
import { RequestCard } from './master/index'
import { t } from '@/i18n'

/** A client's request opened from «Заявки»: the same card, photos and videos large, the answer buttons below. */
export default function MasterRequestScreen() {
	const c = useColors()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useMasterRequest(id)
	const types = useServiceTypes().data
	const offer = useMasterOffer()
	const [now] = useState(() => new Date())
	const item = request.data

	useEffect(() => {
		if (id > 0) markServiceSeen(id)
	}, [id])

	const answer = (record: boolean) => router.push({ pathname: '/master-answer', params: { id: String(id), ...(record ? { record: '1' } : {}) } })

	return (
		<Screen padding={0}>
			<TopBar title={t('Заявка')} />
			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={request.error ?? offer.error} onRetry={() => request.refetch()} />
				{item ? (
					<RequestCard
						item={item}
						title={serviceName(types, item.service.code)}
						open={minutesLeft(item.expiresAt, now) > 0}
						now={now}
						onVoice={() => answer(true)}
						onHelp={() => answer(false)}
						onSkip={() => offer.mutate({ id, body: { answer: 'NOT_MINE' } }, { onSuccess: () => router.back() })}
						full
					/>
				) : request.isPending ? (
					<ActivityIndicator color={c.muted} style={{ paddingTop: 40 }} />
				) : null}
			</ScrollView>
		</Screen>
	)
}
