import { create } from 'zustand'
import type { Brand, CarModel } from '@/api/types'

/**
 * «Другая машина» for one request [04]: a master or СТО asks for a part for a client's car — brand, model and year,
 * not saved to the garage. Set by garage-add in `once` mode or by the tech passport, read by search-part.
 * `selected` — which car chip is active there: a garage car id or the client's car.
 */
export interface ClientCar {
	brand: Brand
	model: CarModel
	year: number
}

interface ClientCarState {
	car: ClientCar | null
	selected: number | 'client' | null
	/** A client's car is picked — it becomes the selected one. */
	set: (car: ClientCar) => void
	select: (selected: number | 'client') => void
	clear: () => void
}

export const useClientCar = create<ClientCarState>((set) => ({
	car: null,
	selected: null,
	set: (car) => set({ car, selected: 'client' }),
	select: (selected) => set({ selected }),
	clear: () => set({ car: null, selected: null }),
}))
