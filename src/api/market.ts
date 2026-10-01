// Market layout: rows and their containers [06б, 10а, 31]. Map and route [15, 18] come later.
import { useMemo } from 'react'
import { Platform } from 'react-native'
import { File, Paths } from 'expo-file-system'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { API_URL, apiFetch } from '@/lib/api'
import { buildMarketGeo, bundledScheme, type MarketScheme } from '@/lib/market-geojson'
import { marketKeys } from './keys'
import type { MapHighlight, MarketRoute, MarketRow, MarketSearch, QrResolve, RowDetail } from './types'

export function useRows() {
	return useQuery({
		queryKey: marketKeys.rows,
		queryFn: ({ signal }) => apiFetch<MarketRow[]>('/market/rows', { auth: false, signal }),
		staleTime: 60 * 60_000,
	})
}

/**
 * Containers of a row by side [31]. With `brandId`: `state` HAS_SELLER / NO_SELLER,
 * `sellsBrand` per box and `brandSellers` — «продают Toyota: 9».
 */
export function useRowContainers(rowId: number, brandId?: number) {
	return useQuery({
		queryKey: marketKeys.rowContainers(rowId, brandId),
		queryFn: ({ signal }) =>
			apiFetch<RowDetail>(`/market/rows/${rowId}/containers`, { query: { brandId }, signal }),
		// 10а asks before the row list has loaded.
		enabled: rowId > 0,
	})
}

// ─── Market scheme for the map [15, 18] ──────────────────────────────────────

const CACHE_NAME = 'market-map.json'

interface CachedScheme {
	etag: string
	scheme: MarketScheme
}

/** The device cache: a file on iOS/Android (the scheme is ~90 KB), localStorage on web. */
async function readCache(): Promise<CachedScheme | null> {
	try {
		if (Platform.OS === 'web') {
			const raw = globalThis.localStorage?.getItem(CACHE_NAME)
			return raw ? (JSON.parse(raw) as CachedScheme) : null
		}
		const file = new File(Paths.document, CACHE_NAME)
		return file.exists ? (JSON.parse(await file.text()) as CachedScheme) : null
	} catch {
		return null
	}
}

function writeCache(value: CachedScheme) {
	try {
		const text = JSON.stringify(value)
		if (Platform.OS === 'web') globalThis.localStorage?.setItem(CACHE_NAME, text)
		else new File(Paths.document, CACHE_NAME).write(text)
	} catch {}
}

/**
 * GET /market/map with `If-None-Match` — 304 keeps the cached scheme. Offline and on the very
 * first start the bundled src/data/market-map.json is used, so the map always renders.
 */
async function fetchScheme(): Promise<MarketScheme> {
	const cached = await readCache()
	try {
		const res = await fetch(`${API_URL}/api/v1/market/map`, {
			headers: cached ? { 'If-None-Match': cached.etag } : undefined,
		})
		if (res.status === 304 && cached) return cached.scheme
		if (!res.ok) throw new Error(`HTTP ${res.status}`)
		const scheme = (await res.json()) as MarketScheme
		writeCache({ etag: res.headers.get('ETag') ?? `"map-v${scheme.version}"`, scheme })
		return scheme
	} catch {
		return cached?.scheme ?? bundledScheme()
	}
}

export function useMarketScheme() {
	return useQuery({
		queryKey: marketKeys.map,
		queryFn: fetchScheme,
		initialData: bundledScheme,
		initialDataUpdatedAt: 0,
		staleTime: 60 * 60_000,
	})
}

/** GeoJSON of the market with highlighted rows — for MarketMapLive. */
export function useMarketGeo(highlightedRowIds: number[] = []) {
	const scheme = useMarketScheme().data
	const key = highlightedRowIds.join(',')
	// eslint-disable-next-line react-hooks/exhaustive-deps -- ids compared by value
	return useMemo(() => buildMarketGeo(scheme, highlightedRowIds), [scheme, key])
}

/**
 * «Mercedes-Benz — в 6 рядах · 21 бокс · ближайший ряд 14, 170 м» [15].
 * Without a point the server counts from the main entrance.
 */
export function useMapHighlight(kind: 'BRAND' | 'CATEGORY', id: number | undefined) {
	return useQuery({
		queryKey: marketKeys.highlight({ kind, id }),
		queryFn: ({ signal }) =>
			apiFetch<MapHighlight>('/market/map/highlight', { query: { kind, id }, auth: false, signal }),
		enabled: Boolean(id),
		placeholderData: keepPreviousData,
	})
}

/** Route to a box [18]: polyline over the passages, minutes, metres and steps. */
export function useRoute(toContainerId: number) {
	return useQuery({
		queryKey: marketKeys.route({ toContainerId }),
		queryFn: ({ signal }) => apiFetch<MarketRoute>('/market/route', { query: { toContainerId }, auth: false, signal }),
		enabled: toContainerId > 0,
	})
}

/** «14», «ряд ю», «14 12» — rows and boxes. */
export function useMarketSearch(q: string) {
	return useQuery({
		queryKey: marketKeys.search(q),
		queryFn: ({ signal }) => apiFetch<MarketSearch>('/market/search', { query: { q }, auth: false, signal }),
		enabled: q.trim().length > 0,
		placeholderData: keepPreviousData,
	})
}

/** A row / container QR sticker → the place on the scheme. */
export function useQrResolve(token: string) {
	return useQuery({
		queryKey: ['market', 'qr', token],
		queryFn: ({ signal }) => apiFetch<QrResolve>(`/market/qr/${encodeURIComponent(token)}`, { auth: false, signal }),
		enabled: Boolean(token),
		retry: false,
	})
}
