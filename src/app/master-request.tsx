import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { haptic } from '@/lib/haptics'
import { QueryErrorBanner, Screen, ScreenHeader, SkeletonRequestCard } from '@/components/ui'

import { minutesLeft } from '@/lib/format'
import { markServiceSeen, serviceName, useMasterOffer, useMasterRequest, useServiceTypes } from '@/api/services'
import { RequestCard } from './master/index'
import { t } from '@/i18n'

/** A client's request opened from «Заявки»: the same card, photos and videos large, the answer buttons below. */
export default function MasterRequestScreen() {
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
			<ScreenHeader title={t('Заявка')} />
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
						onSkip={() => (haptic.tap(), offer.mutate({ id, body: { answer: 'NOT_MINE' } }, { onSuccess: () => router.back() }))}
						full
					/>
				) : request.isLoading ? (
					<SkeletonRequestCard full actions={2} />
				) : null}
			</ScrollView>
		</Screen>
	)
}
