import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson'
import { schemaToGeo } from '@/lib/geo'
import bundled from '@/data/market-map.json'

// The market scheme (GET /market/map, or the bundled copy offline) → GeoJSON for MapLibre.
// Coordinates are scheme pixels (Y down) and go through the GPS calibration in lib/geo.

interface Rect {
	x: number
	y: number
	w: number
	h: number
}

/** The part of MapDto the map needs; the bundled file is converted to the same shape. */
export interface MarketScheme {
	version: number
	boundary: number[][]
	/** Non-row blocks: shops, admin, parking. */
	blocks: { kind: string; rect?: Rect; polygon?: number[][] }[]
	rows: { id: number; code: string; label: string; type: string; geometry: { rect?: Rect; polygon?: number[][] } }[]
	passages: { points: number[][]; width: number }[]
	entrances: { x: number; y: number; label: string }[]
}

/** Offline fallback: the bundled market-map.json in the server's shape (rows without server ids). */
export function bundledScheme(): MarketScheme {
	const rows: MarketScheme['rows'] = []
	const blocks: MarketScheme['blocks'] = []
	bundled.blocks.forEach((b, i) => {
		const rect = { x: b.x, y: b.y, w: b.w, h: b.h }
		if (b.kind === 'row' || b.kind === 'stall') {
			rows.push({ id: -(i + 1), code: b.label, label: b.label, type: b.kind === 'row' ? 'ROW' : 'STALL', geometry: { rect } })
		} else {
			blocks.push({ kind: b.kind, rect })
		}
	})
	rows.push({ id: -1001, code: 'З', label: 'З', type: 'VROW', geometry: { polygon: bundled.zone_Z_polygon } })
	rows.push({ id: -1002, code: 'А', label: 'А', type: 'VROW', geometry: { polygon: bundled.row_A_polygon } })
	return { version: 0, boundary: bundled.boundary, blocks, rows, passages: bundled.passages, entrances: bundled.entrances }
}

const toGeo = ([x, y]: number[]) => schemaToGeo(x, y)

function ring(geometry: { rect?: Rect; polygon?: number[][] }): number[][] {
	if (geometry.polygon) return geometry.polygon
	const r = geometry.rect!
	return [
		[r.x, r.y],
		[r.x + r.w, r.y],
		[r.x + r.w, r.y + r.h],
		[r.x, r.y + r.h],
	]
}

function centerOf(points: number[][]): [number, number] {
	const xs = points.map(([x]) => x)
	const ys = points.map(([, y]) => y)
	return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

function polygon(points: number[][], properties: Record<string, unknown>): Feature<Polygon> {
	return { type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [[...points, points[0]].map(toGeo)] } }
}

/** Row label on the map: «Ряд 14», «Жайма 1»; vertical rows by their letter. */
const mapLabel = (row: MarketScheme['rows'][number]) => (row.type === 'VROW' ? row.code : row.label)

export interface MarketGeo {
	boundary: FeatureCollection<Polygon>
	passages: FeatureCollection<LineString>
	/** Rows and other blocks; rows carry `rowId`, `hl` (highlighted) and `muted` (another row is). */
	blocks: FeatureCollection<Polygon>
	labels: FeatureCollection<Point>
	entrances: FeatureCollection<Point>
	center: [number, number]
	/** [lon, lat] of a row's centre — to fly the camera there. */
	rowCenter: (rowId: number) => [number, number] | null
}

export function buildMarketGeo(scheme: MarketScheme, highlightedRowIds: number[] = []): MarketGeo {
	const highlighted = new Set(highlightedRowIds)
	const active = highlighted.size > 0
	const kindOf = (type: string) => (type === 'VROW' ? 'vrow' : type === 'STALL' ? 'stall' : 'row')

	const rowFeatures = scheme.rows.map((row) =>
		polygon(ring(row.geometry), {
			rowId: row.id,
			label: mapLabel(row),
			kind: kindOf(row.type),
			hl: highlighted.has(row.id),
			muted: active && !highlighted.has(row.id),
		})
	)
	const otherFeatures = scheme.blocks.map((block) => polygon(ring(block), { kind: block.kind, hl: false, muted: false }))

	const centers = new Map(scheme.rows.map((row) => [row.id, centerOf(ring(row.geometry))]))

	return {
		boundary: { type: 'FeatureCollection', features: [polygon(scheme.boundary, { kind: 'boundary' })] },
		passages: {
			type: 'FeatureCollection',
			features: scheme.passages.map((passage, index) => ({
				type: 'Feature',
				properties: { index, width: passage.width },
				geometry: { type: 'LineString', coordinates: passage.points.map(toGeo) },
			})),
		},
		blocks: { type: 'FeatureCollection', features: [...otherFeatures, ...rowFeatures] },
		labels: {
			type: 'FeatureCollection',
			features: scheme.rows.map((row) => ({
				type: 'Feature',
				properties: { label: mapLabel(row), hl: highlighted.has(row.id) },
				geometry: { type: 'Point', coordinates: toGeo(centers.get(row.id)!) },
			})),
		},
		entrances: {
			type: 'FeatureCollection',
			features: scheme.entrances.map((entrance) => ({
				type: 'Feature',
				properties: { label: entrance.label },
				geometry: { type: 'Point', coordinates: schemaToGeo(entrance.x, entrance.y) },
			})),
		},
		center: toGeo(centerOf(scheme.boundary)),
		rowCenter: (rowId) => {
			const center = centers.get(rowId)
			return center ? toGeo(center) : null
		},
	}
}

/** A route polyline (scheme pixels) → GeoJSON line. */
export function routeToGeoJSON(points: number[][]): FeatureCollection<LineString> {
	return {
		type: 'FeatureCollection',
		features: points.length
			? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: points.map(toGeo) } }]
			: [],
	}
}
