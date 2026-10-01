import type { ServiceType } from '@/api/types'

// Bundled copy of GET /service-types — the tiles render instantly and offline.
// The server list replaces it once loaded.
export const BUNDLED_SERVICE_TYPES: ServiceType[] = [
	{ code: 'CAR_REPAIR', name: 'СТО и ремонт', icon: 'car_repair', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'TIRE_SERVICE', name: 'Шиномонтаж', icon: 'tire_service', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'LPG', name: 'ГБО', icon: 'lpg', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'TOW_TRUCK', name: 'Эвакуатор', icon: 'tow_truck', needsLocation: true, urgent: true, defaultDuration: 'MIN_15' },
	{ code: 'CAR_WASH', name: 'Автомойка', icon: 'car_wash', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'AUTO_ELECTRIC', name: 'Автоэлектрик', icon: 'auto_electric', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'BODY_PAINT', name: 'Кузов и покраска', icon: 'body_paint', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'DIAGNOSTICS', name: 'Диагностика', icon: 'diagnostics', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'OIL_CHANGE', name: 'Замена масла', icon: 'oil_change', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'WHEEL_ALIGNMENT', name: 'Развал-схождение', icon: 'wheel_alignment', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'TINTING', name: 'Тонировка', icon: 'tinting', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'MOBILE_MASTER', name: 'Выездной мастер', icon: 'mobile_master', needsLocation: true, urgent: false, defaultDuration: 'MIN_30' },
]

/** Short names for chips and the 05б tiles: «СТО», «Мойка». */
export const SERVICE_SHORT: Record<string, string> = {
	CAR_REPAIR: 'СТО',
	CAR_WASH: 'Мойка',
	BODY_PAINT: 'Кузов',
	OIL_CHANGE: 'Масло',
	WHEEL_ALIGNMENT: 'Развал',
	MOBILE_MASTER: 'Выезд',
}

/** The market «Кудайберген» — the fallback point when the phone gives no location. */
export const MARKET_POINT = { lat: 42.847, lng: 74.62 }
