import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localJsonStorage } from '@/lib/local-json'
import type { Brand, CarOrigin, FuelType, ServiceWhen, ServiceWhere } from '@/api/types'
import { t } from '@/i18n'

type ServiceCode = string

// The service request being composed across 33–36. Kept on the device, so the wizard
// survives leaving the app; reset after sending.

export interface ServiceDraftCar {
	/** From the garage — fills everything in one tap [34]. */
	carId: number | null
	brand: Brand | null
	modelId: number | null
	modelLabel: string | null
	year: number | null
	engineVolume: number | null
	fuel: FuelType | null
	origin: CarOrigin | null
}

interface ServiceDraft extends ServiceDraftCar {
	service: ServiceCode | null
	description: string
	when: ServiceWhen
	atTime: string | null
	where: ServiceWhere
	lat: number | null
	lng: number | null
	address: string | null
	radiusKm: number
	/** The point came from the phone's GPS (not the market fallback). */
	located: boolean
	setService: (service: ServiceCode) => void
	setCar: (car: Partial<ServiceDraftCar>) => void
	set: (patch: Partial<Omit<ServiceDraft, 'set' | 'setService' | 'setCar' | 'reset'>>) => void
	reset: () => void
}

const emptyCar: ServiceDraftCar = {
	carId: null,
	brand: null,
	modelId: null,
	modelLabel: null,
	year: null,
	engineVolume: null,
	fuel: 'PETROL',
	origin: null,
}

const initial = {
	...emptyCar,
	service: null,
	description: '',
	when: 'TODAY' as ServiceWhen,
	atTime: null,
	where: 'I_COME' as ServiceWhere,
	lat: null,
	lng: null,
	address: null,
	radiusKm: 5,
	located: false,
}

export const useServiceDraft = create<ServiceDraft>()(
	persist(
		(set) => ({
			...initial,
			// Tow truck and mobile master come to the client.
			setService: (service) =>
				set({ service, where: service === 'TOW_TRUCK' ? 'PICKUP_POINT' : service === 'MOBILE_MASTER' ? 'MASTER_COMES' : 'I_COME' }),
			setCar: (car) => set(car),
			set: (patch) => set(patch),
			reset: () => set(initial),
		}),
		{ name: 'draft.service', storage: createJSONStorage(() => localJsonStorage) }
	)
)

export const ORIGINS: { value: CarOrigin; label: string; hint: string | null; short: string }[] = [
	{ value: 'JAPAN', label: t('Япония'), hint: t('«японец»'), short: t('Япония') },
	{ value: 'USA', label: t('США'), hint: t('«американец»'), short: t('США') },
	{ value: 'EUROPE', label: t('Европа'), hint: t('«европеец»'), short: t('Европа') },
	{ value: 'KOREA', label: t('Корея'), hint: t('«кореец»'), short: t('Корея') },
	{ value: 'UAE', label: t('ОАЭ'), hint: t('«эмиратец»'), short: t('ОАЭ') },
	{ value: 'UNKNOWN', label: t('Не знаю'), hint: null, short: '' },
]

export const FUELS: { value: FuelType; label: string }[] = [
	{ value: 'PETROL', label: t('Бензин') },
	{ value: 'DIESEL', label: t('Дизель') },
	{ value: 'LPG_PETROL', label: t('Газ/бензин') },
	{ value: 'HYBRID', label: t('Гибрид') },
]

/** «Camry 50 · 2012 · 2.5 · США» — only the parts that are known. */
export function serviceCarLabel(car: Pick<ServiceDraftCar, 'modelLabel' | 'year' | 'engineVolume' | 'origin'>) {
	const origin = ORIGINS.find((o) => o.value === car.origin)?.short
	return [car.modelLabel, car.year, car.engineVolume?.toFixed(1), origin].filter(Boolean).join(' · ')
}

export const WHERE_OPTIONS: { value: ServiceWhere; label: string; hint: string }[] = [
	{ value: 'I_COME', label: t('Поеду сам'), hint: t('Покажем мастеров рядом с вами') },
	{ value: 'MASTER_COMES', label: t('Мастер выезжает'), hint: t('Нужна точка, куда ехать') },
	{ value: 'PICKUP_POINT', label: t('Эвакуатор забирает'), hint: t('Нужна точка, откуда забрать') },
]
