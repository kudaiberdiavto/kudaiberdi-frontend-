import type { StyleSpecification } from '@maplibre/maplibre-react-native'
import { raw } from '@/theme'

/**
 * Стиль реальной карты в палитре схемы рынка.
 * Тайлы — OpenFreeMap (OpenStreetMap, OpenMapTiles): бесплатные, без ключа и лимитов.
 * Атрибуция обязательна: «OpenFreeMap © OpenMapTiles Data from OpenStreetMap».
 */
export const marketMapStyle: StyleSpecification = {
	version: 8,
	name: 'Кудайберген',
	glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
	sources: {
		openmaptiles: {
			type: 'vector',
			url: 'https://tiles.openfreemap.org/planet',
		},
	},
	layers: [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': raw.mapSurface },
		},
		{
			id: 'landcover-green',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			filter: ['in', 'class', 'grass', 'wood', 'scrub'],
			paint: { 'fill-color': raw.mapGreen },
		},
		{
			id: 'landuse-block',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landuse',
			filter: ['in', 'class', 'residential', 'commercial', 'industrial', 'retail'],
			paint: { 'fill-color': raw.mapBlockGrey },
		},
		{
			id: 'park',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'park',
			paint: { 'fill-color': raw.mapGreen },
		},
		{
			id: 'water',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'water',
			paint: { 'fill-color': '#CBD6E4' },
		},
		{
			id: 'building',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'building',
			minzoom: 14,
			paint: {
				'fill-color': raw.mapShop,
				'fill-outline-color': raw.mapShopBorder,
			},
		},
		{
			id: 'road-casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: ['!in', 'class', 'path', 'track', 'ferry'],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': raw.mapStreetStroke,
				'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 14, 19, 34],
			},
		},
		{
			id: 'road',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: ['!in', 'class', 'path', 'track', 'ferry'],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': raw.mapStreet,
				'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 11, 19, 30],
			},
		},
		{
			id: 'road-label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 14,
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name'],
				'text-font': ['Noto Sans Regular'],
				'text-size': 11,
				'text-letter-spacing': 0.15,
			},
			paint: {
				'text-color': raw.mapLabel,
				'text-halo-color': raw.mapStreet,
				'text-halo-width': 1.4,
			},
		},
		{
			id: 'place-label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			filter: ['in', 'class', 'city', 'town', 'village', 'suburb', 'neighbourhood'],
			layout: {
				'text-field': ['get', 'name'],
				'text-font': ['Noto Sans Regular'],
				'text-size': 12,
			},
			paint: {
				'text-color': raw.mapLabel,
				'text-halo-color': raw.mapSurface,
				'text-halo-width': 1.4,
			},
		},
	],
}
