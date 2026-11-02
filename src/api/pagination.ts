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

/** The same pages with each page's items passed through `fn` — for optimistic edits of a cached list. */
export function mapPages<T>(data: InfiniteData<Paged<T>> | undefined, fn: (items: T[]) => T[]): InfiniteData<Paged<T>> | undefined {
	return data && { ...data, pages: data.pages.map((page) => ({ ...page, items: fn(page.items) })) }
}
