import type { InfiniteData } from '@tanstack/react-query'

/** Shape shared by every generated `CursorPage*` / search result: `nextCursor = null` — no more pages. */
interface Paged<T> {
	items: T[]
	nextCursor: string | null
}

/** Shared `useInfiniteQuery` options for `{items, nextCursor}` lists. */
export const cursorPaging = {
	initialPageParam: undefined as string | undefined,
	getNextPageParam: (last: Paged<unknown>) => last.nextCursor ?? undefined,
}

/** All loaded pages as one array. */
export function flattenPages<T>(data: InfiniteData<Paged<T>> | undefined): T[] {
	return data?.pages.flatMap((page) => page.items) ?? []
}
