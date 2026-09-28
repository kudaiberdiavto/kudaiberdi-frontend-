// Схема рынка → GeoJSON в реальных координатах: ряды, боксы и проходы рисуются
// поверх карты, потому что ни в OSM, ни у других провайдеров их нет.

import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson'
import { schemaToGeo } from '@/lib/geo'
import map from '@/data/market-map.json'

type Block = (typeof map.blocks)[number]

function rectangle(block: Block): Feature<Polygon> {
	const corners: [number, number][] = [
		[block.x, block.y],
		[block.x + block.w, block.y],
		[block.x + block.w, block.y + block.h],
		[block.x, block.y + block.h],
		[block.x, block.y],
	]
	return {
		type: 'Feature',
		properties: { label: block.label, kind: block.kind },
		geometry: { type: 'Polygon', coordinates: [corners.map(([x, y]) => schemaToGeo(x, y))] },
	}
}

function polygon(points: number[][], properties: Record<string, unknown>): Feature<Polygon> {
	const ring = [...points, points[0]].map(([x, y]) => schemaToGeo(x, y))
	return { type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [ring] } }
}

/** Ряды, жаймы, СТО и администрация. */
export const marketBlocks: FeatureCollection<Polygon> = {
	type: 'FeatureCollection',
	features: [
		...map.blocks.map(rectangle),
		polygon(map.zone_Z_polygon, { label: 'З', kind: 'vrow' }),
		polygon(map.row_A_polygon, { label: 'А', kind: 'vrow' }),
	],
}

/** Проходы между рядами — линии с шириной из схемы. */
export const marketPassages: FeatureCollection<LineString> = {
	type: 'FeatureCollection',
	features: map.passages.map((passage, index) => ({
		type: 'Feature',
		properties: { index, width: passage.width },
		geometry: {
			type: 'LineString',
			coordinates: passage.points.map(([x, y]) => schemaToGeo(x, y)),
		},
	})),
}

/** Граница территории рынка. */
export const marketBoundary: FeatureCollection<Polygon> = {
	type: 'FeatureCollection',
	features: [polygon(map.boundary, { kind: 'boundary' })],
}

/** Входы на рынок. */
export const marketEntrances: FeatureCollection<Point> = {
	type: 'FeatureCollection',
	features: map.entrances.map((entrance) => ({
		type: 'Feature',
		properties: { label: entrance.label },
		geometry: { type: 'Point', coordinates: schemaToGeo(entrance.x, entrance.y) },
	})),
}

/** Подписи рядов — точки в центре блока. */
export const marketLabels: FeatureCollection<Point> = {
	type: 'FeatureCollection',
	features: map.blocks
		.filter((block) => block.label)
		.map((block) => ({
			type: 'Feature',
			properties: { label: block.label, kind: block.kind },
			geometry: { type: 'Point', coordinates: schemaToGeo(block.x + block.w / 2, block.y + block.h / 2) },
		})),
}

/** Координаты центра блока по его подписи — чтобы наводить камеру на конкретный ряд. */
export function blockCenterGeo(label: string): [number, number] | null {
	const block = map.blocks.find((b) => b.label === label)
	if (!block) return null
	return schemaToGeo(block.x + block.w / 2, block.y + block.h / 2)
}

/** Центр рынка — стартовая точка камеры. */
export const marketCenter = schemaToGeo(
	map.boundary.reduce((sum, [x]) => sum + x, 0) / map.boundary.length,
	map.boundary.reduce((sum, [, y]) => sum + y, 0) / map.boundary.length,
)

/** Маршрут по проходам в реальных координатах. */
export function routeToGeoJSON(points: [number, number][]): FeatureCollection<LineString> {
	return {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {},
				geometry: { type: 'LineString', coordinates: points.map(([x, y]) => schemaToGeo(x, y)) },
			},
		],
	}
}
