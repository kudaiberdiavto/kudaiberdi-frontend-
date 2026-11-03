import { useState } from 'react'

/**
 * Pull-to-refresh for a list: `refreshing` is true from the user's pull until every refetch settles.
 * Background refetches (realtime, focus) don't spin the indicator — only the gesture does.
 */
export function usePullRefresh(refetch: () => Promise<unknown> | (Promise<unknown> | unknown)[]) {
	const [refreshing, setRefreshing] = useState(false)
	const onRefresh = () => {
		setRefreshing(true)
		const pending = refetch()
		Promise.allSettled(Array.isArray(pending) ? pending : [pending]).finally(() => setRefreshing(false))
	}
	return { refreshing, onRefresh }
}
