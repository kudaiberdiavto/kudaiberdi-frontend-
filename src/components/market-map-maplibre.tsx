import { forwardRef, useImperativeHandle, useRef, type Ref } from 'react'
import { StyleSheet, View } from 'react-native'
import {
	Camera,
	GeoJSONSource,
	Layer,
	LocationManager,
	Map,
	UserLocation,
	type CameraRef,
} from '@maplibre/maplibre-react-native'
import { marketMapStyle } from '@/data/map-style'
import { routeToGeoJSON } from '@/lib/market-geojson'
import { useMarketGeo } from '@/api/market'
import { fixed, raw, useColors } from '@/theme'

const MARKET_ZOOM = 16.2

/**
 * Style-spec выражения (case/interpolate/…) типизированы в maplibre как глубокие
 * дискриминированные кортежи — плоский JS-массив им формально не соответствует,
 * хотя рантайму важен только валидный JSON. `any` здесь безопаснее, чем
 * подгонять тип под каждое выражение вручную.
 */
type Expr = any

export interface MarketMapLiveHandle {
	/** Приблизить к точке в координатах карты. */
	focusOn: (coordinate: [number, number], zoom?: number) => void
	/** Приблизить к ряду по его id из схемы рынка. */
	focusOnRow: (rowId: number, zoom?: number) => void
	/** Приблизить к текущей позиции пользователя (запросит разрешение, если нужно). */
	focusOnMe: (zoom?: number) => Promise<void>
	/** Приблизить/отдалить на шаг относительно текущего зума. */
	zoomBy: (delta: number) => void
	/** Вернуть обзор всего рынка. */
	reset: () => void
}

interface MarketMapLiveProps {
	/** id рядов, которые подсвечены фильтром (GET /market/map/highlight → rowIds). */
	highlightedRowIds?: number[]
	/** Маршрут в координатах схемы рынка. */
	route?: number[][]
	/** Показывать точку пользователя по GPS. */
	showUser?: boolean
}

export const MarketMapLive = forwardRef(function MarketMapLive(
	{ highlightedRowIds = [], route, showUser = true }: MarketMapLiveProps,
	ref: Ref<MarketMapLiveHandle>,
) {
	const c = useColors()
	const geo = useMarketGeo(highlightedRowIds)
	const marketCenter = geo.center
	const camera = useRef<CameraRef>(null)
	const currentZoom = useRef(MARKET_ZOOM)

	useImperativeHandle(ref, () => ({
		focusOn(coordinate, zoom = 18) {
			currentZoom.current = zoom
			camera.current?.flyTo({ center: coordinate, zoom, duration: 600 })
		},
		focusOnRow(rowId, zoom = 17.5) {
			const center = geo.rowCenter(rowId)
			if (!center) return
			currentZoom.current = zoom
			camera.current?.flyTo({ center, zoom, duration: 600 })
		},
		async focusOnMe(zoom = 18) {
			const granted = await LocationManager.requestPermissions()
			if (!granted) return
			const position = await LocationManager.getCurrentPosition()
			if (!position) return
			currentZoom.current = zoom
			camera.current?.flyTo({
				center: [position.coords.longitude, position.coords.latitude],
				zoom,
				duration: 600,
			})
		},
		zoomBy(delta) {
			currentZoom.current = Math.min(Math.max(currentZoom.current + delta, 12), 20)
			camera.current?.zoomTo(currentZoom.current, { duration: 250 })
		},
		reset() {
			currentZoom.current = MARKET_ZOOM
			camera.current?.flyTo({ center: marketCenter, zoom: MARKET_ZOOM, duration: 600 })
		},
	}))

	/** Подсветка ряда фильтром: `hl` — подсвечен, `muted` — подсвечен другой ряд (из useMarketGeo). */
	const highlightColor = (active: string, muted: string, fallback: string): Expr => [
		'case',
		['==', ['get', 'hl'], true],
		active,
		['==', ['get', 'muted'], true],
		muted,
		fallback,
	]

	return (
		<View style={StyleSheet.absoluteFill}>
			<Map
				style={StyleSheet.absoluteFill}
				mapStyle={marketMapStyle}
				attribution
				logo={false}
				onRegionDidChange={(event) => {
					currentZoom.current = event.nativeEvent.zoom
				}}
			>
				<Camera ref={camera} initialViewState={{ center: marketCenter, zoom: MARKET_ZOOM }} />

				<GeoJSONSource id="market-boundary" data={geo.boundary}>
					<Layer id="market-boundary-fill" type="fill" paint={{ 'fill-color': raw.mapBoundary }} />
					<Layer
						id="market-boundary-line"
						type="line"
						paint={{
							'line-color': raw.mapBoundaryStroke,
							'line-opacity': 0.55,
							'line-width': 2,
						}}
					/>
				</GeoJSONSource>

				<GeoJSONSource id="market-passages" data={geo.passages}>
					<Layer
						id="market-passage-casing"
						type="line"
						layout={{ 'line-cap': 'round', 'line-join': 'round' }}
						paint={{
							'line-color': raw.mapPassageEdge,
							'line-width': ['interpolate', ['linear'], ['zoom'], 15, 4, 18, 14, 20, 34] as Expr,
						}}
					/>
					<Layer
						id="market-passage-fill"
						type="line"
						layout={{ 'line-cap': 'round', 'line-join': 'round' }}
						paint={{
							'line-color': raw.mapPassage,
							'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2.5, 18, 11, 20, 29] as Expr,
						}}
					/>
				</GeoJSONSource>

				<GeoJSONSource id="market-blocks" data={geo.blocks}>
					<Layer
						id="market-block-fill"
						type="fill"
						paint={{
							'fill-color': [
								'case',
								['in', ['get', 'kind'], ['literal', ['shop', 'anon']]],
								raw.mapShop,
								['==', ['get', 'kind'], 'admin'],
								raw.mapAdmin,
								['==', ['get', 'kind'], 'stall'],
								'rgba(255,255,255,0.6)',
								highlightColor(c.brandTint, raw.mapRowMuted, raw.mapRow),
							] as Expr,
						}}
					/>
					<Layer
						id="market-block-line"
						type="line"
						paint={{
							'line-color': [
								'case',
								['in', ['get', 'kind'], ['literal', ['shop', 'anon']]],
								raw.mapShopBorder,
								['==', ['get', 'kind'], 'admin'],
								raw.mapAdminBorder,
								highlightColor(c.brand, raw.mapRowMutedBorder, raw.mapRowBorder),
							] as Expr,
							'line-width': ['case', ['==', ['get', 'hl'], true], 2, 1] as Expr,
						}}
					/>
				</GeoJSONSource>

				<GeoJSONSource id="market-labels" data={geo.labels}>
					<Layer
						id="market-label"
						type="symbol"
						minzoom={15.5}
						layout={{
							'text-field': ['get', 'label'] as Expr,
							'text-font': ['Noto Sans Regular'],
							'text-size': ['interpolate', ['linear'], ['zoom'], 16, 10, 19, 15] as Expr,
							'text-allow-overlap': false,
						}}
						paint={{
							'text-color': ['case', ['==', ['get', 'hl'], true], c.brandStrong, c.ink] as Expr,
							'text-halo-color': fixed.white,
							'text-halo-width': 1.2,
						}}
					/>
				</GeoJSONSource>

				<GeoJSONSource id="market-entrances" data={geo.entrances}>
					<Layer
						id="market-entrance-dot"
						type="circle"
						paint={{
							'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 4, 19, 9] as Expr,
							'circle-color': c.brand,
							'circle-stroke-color': fixed.white,
							'circle-stroke-width': 2,
						}}
					/>
					<Layer
						id="market-entrance-label"
						type="symbol"
						minzoom={16.5}
						layout={{
							'text-field': ['get', 'label'] as Expr,
							'text-font': ['Noto Sans Regular'],
							'text-size': 11,
							'text-offset': [0, 1.2],
						}}
						paint={{
							'text-color': c.brandStrong,
							'text-halo-color': fixed.white,
							'text-halo-width': 1.4,
						}}
					/>
				</GeoJSONSource>

				{route?.length ? (
					<GeoJSONSource id="market-route" data={routeToGeoJSON(route)}>
						<Layer
							id="market-route-halo"
							type="line"
							layout={{ 'line-cap': 'round', 'line-join': 'round' }}
							paint={{ 'line-color': c.brand, 'line-opacity': 0.2, 'line-width': 12 }}
						/>
						<Layer
							id="market-route-line"
							type="line"
							layout={{ 'line-cap': 'round', 'line-join': 'round' }}
							paint={{ 'line-color': c.brand, 'line-width': 4, 'line-dasharray': [0.1, 2] }}
						/>
					</GeoJSONSource>
				) : null}

				{showUser ? <UserLocation animated accuracy heading /> : null}
			</Map>
		</View>
	)
})
