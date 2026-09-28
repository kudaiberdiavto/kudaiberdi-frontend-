// Привязка схемы рынка к реальным координатам: по двум опорным точкам считаем
// поворот, масштаб и сдвиг (преобразование подобия). Плоскости рынка этого
// достаточно — высот и искажений тут нет.

import anchors from '@/data/market-anchors.json'

const EARTH_RADIUS = 6_371_000
const RAD = Math.PI / 180

const [origin, second] = anchors.points

/** Метры относительно первой опорной точки, ось Y вниз — как в координатах схемы. */
function toMeters(latitude: number, longitude: number) {
	return {
		x: (longitude - origin.longitude) * Math.cos(origin.latitude * RAD) * EARTH_RADIUS * RAD,
		y: -(latitude - origin.latitude) * EARTH_RADIUS * RAD,
	}
}

const secondInMeters = toMeters(second.latitude, second.longitude)
const metersLength = Math.hypot(secondInMeters.x, secondInMeters.y)
const schemaDelta = { x: second.x - origin.x, y: second.y - origin.y }
const schemaLength = Math.hypot(schemaDelta.x, schemaDelta.y)

/** Сколько единиц схемы приходится на метр. */
const unitsPerMeter = metersLength > 0 ? schemaLength / metersLength : 1

const rotation = Math.atan2(schemaDelta.y, schemaDelta.x) - Math.atan2(secondInMeters.y, secondInMeters.x)
const cos = Math.cos(rotation)
const sin = Math.sin(rotation)

/** Координаты схемы рынка → [долгота, широта] для карты. */
export function schemaToGeo(x: number, y: number): [number, number] {
	const dx = x - origin.x
	const dy = y - origin.y
	const metersX = (dx * cos + dy * sin) / unitsPerMeter
	const metersY = (-dx * sin + dy * cos) / unitsPerMeter
	return [
		origin.longitude + metersX / (Math.cos(origin.latitude * RAD) * EARTH_RADIUS * RAD),
		origin.latitude - metersY / (EARTH_RADIUS * RAD),
	]
}
