import { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { QueryErrorBanner, Screen, SkeletonRequestCard } from '@/components/ui'
import { TopBar } from '@/components/buyer-v23'
import { useIncomingRequest, useMarkSeen } from '@/api/incoming'
import { RequestCard } from './seller/index'
import { t } from '@/i18n'

/** A buyer's request opened from «Запросы»: the same card, photos large, the answer buttons below. */
export default function IncomingRequestScreen() {
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useIncomingRequest(id)
	const markSeen = useMarkSeen()

	useEffect(() => {
		markSeen.mutate(id)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened request
	}, [id])

	return (
		<Screen padding={0}>
			<TopBar title={t('Запрос')} />
			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={request.error} onRetry={() => request.refetch()} />
				{request.data ? <RequestCard request={request.data} full /> : request.isLoading ? <SkeletonRequestCard full /> : null}
				<View style={{ height: 8 }} />
			</ScrollView>
		</Screen>
	)
}
