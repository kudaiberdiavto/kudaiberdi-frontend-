import { QueryClient, defaultShouldDehydrateQuery, type Query } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { ApiError } from '@/lib/api'

// 4xx are answers, not glitches — retry only network errors and 5xx.
const shouldRetry = (failureCount: number, error: unknown) =>
	failureCount < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500)

/** How long a saved answer may be shown at start — also how long it stays in memory unused. */
const DAY = 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: shouldRetry,
			staleTime: 30_000,
			gcTime: DAY,
		},
		mutations: {
			retry: false,
		},
	},
})

// The market map and its rows are large and change rarely mid-day — not worth the disk.
// Chat history holds optimistic messages (negative ids) that would come back as «отправляется» forever.
const skip = (key: readonly unknown[]) => key[0] === 'market' || (key[0] === 'chats' && key[key.length - 1] === 'messages')

/**
 * The last answers are saved on the device: the app opens with the chats, requests and catalog it showed last time
 * and refreshes them in the background (they're older than staleTime). Cleared on sign-out.
 */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
	persister: createAsyncStoragePersister({ storage: AsyncStorage, key: 'query-cache', throttleTime: 2000 }),
	maxAge: DAY,
	// Bump when a response shape changes, so an old cache isn't fed to new code.
	buster: '1',
	dehydrateOptions: {
		shouldDehydrateQuery: (query: Query) => defaultShouldDehydrateQuery(query) && !skip(query.queryKey),
	},
}

/** Sign-out: the next person on this phone must not see the previous one's chats. */
export async function clearQueryCache() {
	queryClient.clear()
	await persistOptions.persister.removeClient()
}
