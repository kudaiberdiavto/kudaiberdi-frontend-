import type { ServiceType } from '@/api/types'
import { t } from '@/i18n'

// Bundled copy of GET /service-types — the tiles render instantly and offline.
// The server list replaces it once loaded.
export const BUNDLED_SERVICE_TYPES: ServiceType[] = [
	{ code: 'CAR_REPAIR', name: t('СТО и ремонт'), icon: 'car_repair', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'TIRE_SERVICE', name: t('Шиномонтаж'), icon: 'tire_service', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'LPG', name: t('ГБО'), icon: 'lpg', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'TOW_TRUCK', name: t('Эвакуатор'), icon: 'tow_truck', needsLocation: true, urgent: true, defaultDuration: 'MIN_15' },
	{ code: 'CAR_WASH', name: t('Автомойка'), icon: 'car_wash', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'AUTO_ELECTRIC', name: t('Автоэлектрик'), icon: 'auto_electric', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'BODY_PAINT', name: t('Кузов и покраска'), icon: 'body_paint', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'DIAGNOSTICS', name: t('Диагностика'), icon: 'diagnostics', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'OIL_CHANGE', name: t('Замена масла'), icon: 'oil_change', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'WHEEL_ALIGNMENT', name: t('Развал-схождение'), icon: 'wheel_alignment', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'TINTING', name: t('Тонировка'), icon: 'tinting', needsLocation: false, urgent: false, defaultDuration: 'MIN_30' },
	{ code: 'MOBILE_MASTER', name: t('Выездной мастер'), icon: 'mobile_master', needsLocation: true, urgent: false, defaultDuration: 'MIN_30' },
]

/** Short names for chips and the 05б tiles: «СТО», «Мойка». */
export const SERVICE_SHORT: Record<string, string> = {
	CAR_REPAIR: t('СТО'),
	CAR_WASH: t('Мойка'),
	BODY_PAINT: t('Кузов'),
	OIL_CHANGE: t('Масло'),
	WHEEL_ALIGNMENT: t('Развал'),
	MOBILE_MASTER: t('Выезд'),
}

/** The market «Кудайберген» — the fallback point when the phone gives no location. */
export const MARKET_POINT = { lat: 42.847, lng: 74.62 }
