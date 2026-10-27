// Веб-версия карты: тот же стиль и тот же GeoJSON, что и в нативной, но на
// maplibre-gl (браузерный движок) вместо @maplibre/maplibre-react-native
// (нативный модуль, в вебе не собирается). Тот же API — переключается сам,
// т.к. Metro резолвит market-map-live.web.tsx на платформе web автоматически.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { marketMapStyle } from '@/data/map-style'
import { type MarketGeo, routeToGeoJSON } from '@/lib/market-geojson'
import { useMarketGeo } from '@/api/market'
import { raw, useColors } from '@/theme'

const MARKET_ZOOM = 16.2

/**
 * Metro (в отличие от Vite/webpack5) не умеет собирать воркер библиотеки по
 * `new Worker(new URL(...), import.meta.url)`, поэтому автоопределение внутри
 * maplibre-gl не срабатывает — «Worker failed to load». Файл лежит в
 * public/maplibre-gl-worker.mjs (копия из node_modules/maplibre-gl/dist/),
 * Metro отдаёt публичную папку как есть по тому же адресу.
 * Версия файла должна совпадать с version в package.json у maplibre-gl.
 */
maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs')

export interface MarketMapLiveHandle {
	focusOn: (coordinate: [number, number], zoom?: number) => void
	focusOnRow: (rowId: number, zoom?: number) => void
	focusOnMe: (zoom?: number) => Promise<void>
	zoomBy: (delta: number) => void
	reset: () => void
}

interface MarketMapLiveProps {
	highlightedRowIds?: number[]
	route?: number[][]
	showUser?: boolean
}

/** `hl` — the row is highlighted, `muted` — another one is (set by useMarketGeo). */
function highlightExpr(active: string, muted: string, fallback: string): maplibregl.ExpressionSpecification {
	return ['case', ['==', ['get', 'hl'], true], active, ['==', ['get', 'muted'], true], muted, fallback]
}

/** Push fresh GeoJSON into the sources — the map itself is created once. */
function setSources(map: maplibregl.Map, geo: MarketGeo) {
	const set = (id: string, data: GeoJSON.FeatureCollection) => (map.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(data)
	set('market-boundary', geo.boundary)
	set('market-passages', geo.passages)
	set('market-blocks', geo.blocks)
	set('market-labels', geo.labels)
	set('market-entrances', geo.entrances)
}

export const MarketMapLive = forwardRef(function MarketMapLive(
	{ highlightedRowIds = [], route, showUser = true }: MarketMapLiveProps,
	ref: Ref<MarketMapLiveHandle>,
) {
	const c = useColors()
	const geo = useMarketGeo(highlightedRowIds)
	const marketCenter = geo.center
	const geoRef = useRef(geo)
	const routeRef = useRef(route)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const mapRef = useRef<maplibregl.Map | null>(null)
	const userMarkerRef = useRef<maplibregl.Marker | null>(null)
	const geoWatchId = useRef<number | null>(null)
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
	const [errorText, setErrorText] = useState('')

	useImperativeHandle(ref, () => ({
		focusOn(coordinate, zoom = 18) {
			mapRef.current?.flyTo({ center: coordinate, zoom, duration: 600 })
		},
		focusOnRow(rowId, zoom = 17.5) {
			const center = geo.rowCenter(rowId)
			if (center) mapRef.current?.flyTo({ center, zoom, duration: 600 })
		},
		async focusOnMe(zoom = 18) {
			if (!('geolocation' in navigator)) return
			navigator.geolocation.getCurrentPosition(({ coords }) => {
				mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom, duration: 600 })
			})
		},
		zoomBy(delta) {
			mapRef.current?.easeTo({ zoom: (mapRef.current.getZoom() ?? MARKET_ZOOM) + delta, duration: 250 })
		},
		reset() {
			mapRef.current?.flyTo({ center: marketCenter, zoom: MARKET_ZOOM, duration: 600 })
		},
	}))

	useEffect(() => {
		if (!containerRef.current) return

		let map: maplibregl.Map
		try {
			map = new maplibregl.Map({
				container: containerRef.current,
				style: marketMapStyle as maplibregl.StyleSpecification,
				center: marketCenter,
				zoom: MARKET_ZOOM,
				attributionControl: { compact: true },
			})
		} catch (err) {
			setStatus('error')
			setErrorText(err instanceof Error ? err.message : String(err))
			return
		}
		mapRef.current = map

		map.on('error', (event) => {
			setStatus('error')
			setErrorText(event.error?.message ?? 'Неизвестная ошибка карты')
			console.error('[market-map] ', event.error ?? event)
		})

		map.on('load', () => {
			setStatus('ready')
			map.addSource('market-boundary', { type: 'geojson', data: geoRef.current.boundary })
			map.addLayer({ id: 'market-boundary-fill', type: 'fill', source: 'market-boundary', paint: { 'fill-color': raw.mapBoundary } })
			map.addLayer({
				id: 'market-boundary-line',
				type: 'line',
				source: 'market-boundary',
				paint: { 'line-color': raw.mapBoundaryStroke, 'line-opacity': 0.55, 'line-width': 2 },
			})

			map.addSource('market-passages', { type: 'geojson', data: geoRef.current.passages })
			map.addLayer({
				id: 'market-passage-casing',
				type: 'line',
				source: 'market-passages',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': raw.mapPassageEdge, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 4, 18, 14, 20, 34] },
			})
			map.addLayer({
				id: 'market-passage-fill',
				type: 'line',
				source: 'market-passages',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': raw.mapPassage, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2.5, 18, 11, 20, 29] },
			})

			map.addSource('market-blocks', { type: 'geojson', data: geoRef.current.blocks })
			map.addLayer({
				id: 'market-block-fill',
				type: 'fill',
				source: 'market-blocks',
				paint: {
					'fill-color': [
						'case',
						['in', ['get', 'kind'], ['literal', ['shop', 'anon']]],
						raw.mapShop,
						['==', ['get', 'kind'], 'admin'],
						raw.mapAdmin,
						['==', ['get', 'kind'], 'stall'],
						'rgba(255,255,255,0.6)',
						highlightExpr(c.brandTint, raw.mapRowMuted, raw.mapRow),
					] as maplibregl.ExpressionSpecification,
				},
			})
			map.addLayer({
				id: 'market-block-line',
				type: 'line',
				source: 'market-blocks',
				paint: {
					'line-color': [
						'case',
						['in', ['get', 'kind'], ['literal', ['shop', 'anon']]],
						raw.mapShopBorder,
						['==', ['get', 'kind'], 'admin'],
						raw.mapAdminBorder,
						highlightExpr(c.brand, raw.mapRowMutedBorder, raw.mapRowBorder),
					] as maplibregl.ExpressionSpecification,
					'line-width': ['case', ['==', ['get', 'hl'], true], 2, 1],
				},
			})

			map.addSource('market-labels', { type: 'geojson', data: geoRef.current.labels })
			map.addLayer({
				id: 'market-label',
				type: 'symbol',
				source: 'market-labels',
				minzoom: 15.5,
				layout: {
					'text-field': ['get', 'label'],
					'text-font': ['Noto Sans Regular'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 16, 10, 19, 15],
					'text-allow-overlap': false,
				},
				paint: {
					'text-color': ['case', ['==', ['get', 'hl'], true], c.brandStrong, c.ink],
					'text-halo-color': '#FFFFFF',
					'text-halo-width': 1.2,
				},
			})

			map.addSource('market-entrances', { type: 'geojson', data: geoRef.current.entrances })
			map.addLayer({
				id: 'market-entrance-dot',
				type: 'circle',
				source: 'market-entrances',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 4, 19, 9],
					'circle-color': c.brand,
					'circle-stroke-color': '#FFFFFF',
					'circle-stroke-width': 2,
				},
			})
			map.addLayer({
				id: 'market-entrance-label',
				type: 'symbol',
				source: 'market-entrances',
				minzoom: 16.5,
				layout: {
					'text-field': ['get', 'label'],
					'text-font': ['Noto Sans Regular'],
					'text-size': 11,
					'text-offset': [0, 1.2],
				},
				paint: { 'text-color': c.brandStrong, 'text-halo-color': '#FFFFFF', 'text-halo-width': 1.4 },
			})

			{
				map.addSource('market-route', { type: 'geojson', data: routeToGeoJSON(routeRef.current ?? []) })
				map.addLayer({
					id: 'market-route-halo',
					type: 'line',
					source: 'market-route',
					layout: { 'line-cap': 'round', 'line-join': 'round' },
					paint: { 'line-color': c.brand, 'line-opacity': 0.2, 'line-width': 12 },
				})
				map.addLayer({
					id: 'market-route-line',
					type: 'line',
					source: 'market-route',
					layout: { 'line-cap': 'round', 'line-join': 'round' },
					paint: { 'line-color': c.brand, 'line-width': 4, 'line-dasharray': [0.1, 2] },
				})
			}

			if (showUser && 'geolocation' in navigator) {
				const marker = new maplibregl.Marker({ color: c.brand })
				userMarkerRef.current = marker
				geoWatchId.current = navigator.geolocation.watchPosition(
					({ coords }) => marker.setLngLat([coords.longitude, coords.latitude]).addTo(map),
					undefined,
					{ enableHighAccuracy: true },
				)
			}
		})

		return () => {
			if (geoWatchId.current !== null) navigator.geolocation.clearWatch(geoWatchId.current)
			userMarkerRef.current?.remove()
			map?.remove()
			mapRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- карта пересоздаётся только при монтировании компонента
	}, [])

	// Highlight / scheme changed — update the sources in place.
	useEffect(() => {
		geoRef.current = geo
		if (status === 'ready' && mapRef.current) setSources(mapRef.current, geo)
	}, [geo, status])

	useEffect(() => {
		routeRef.current = route
		const source = mapRef.current?.getSource('market-route') as maplibregl.GeoJSONSource | undefined
		if (status === 'ready') source?.setData(routeToGeoJSON(route ?? []))
	}, [route, status])

	return (
		<View style={StyleSheet.absoluteFill}>
			<div ref={containerRef} style={{ width: '100%', height: '100%' }} />

			{status !== 'ready' ? (
				<View
					style={[
						StyleSheet.absoluteFill,
						{
							backgroundColor: raw.mapSurface,
							alignItems: 'center',
							justifyContent: 'center',
							padding: 24,
							gap: 8,
						},
					]}
				>
					<Text style={{ fontSize: 16.5, color: c.ink, textAlign: 'center' }}>
						{status === 'loading' ? 'Загружаю карту…' : 'Карта не загрузилась'}
					</Text>
					{status === 'error' ? (
						<Text selectable style={{ fontSize: 14.5, color: c.danger, textAlign: 'center' }}>
							{errorText}
						</Text>
					) : null}
				</View>
			) : null}
		</View>
	)
})
