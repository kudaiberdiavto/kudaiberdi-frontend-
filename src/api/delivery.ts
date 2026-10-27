// Delivery by Ылдам Экспресс: tariffs, the buyer's order («Доставка», «Где посылка») and the seller's side
// («Заказ с доставкой»: «Упаковал», «Курьер забрал»). The admin orders the courier — not in the app.
import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, newIdempotencyKey } from '@/lib/api'
import { deliveryKeys } from './keys'
import type { CreateDeliveryOrderBody, DeliveryOrder, DeliveryPackedBody, DeliveryTariffs } from './types'

/** Regions, days and the base price up to 5 kg; the courier counts the surcharge himself. */
export function useDeliveryTariffs() {
	return useQuery({
		queryKey: deliveryKeys.tariffs,
		queryFn: ({ signal }) => apiFetch<DeliveryTariffs>('/delivery/tariffs', { auth: false, signal }),
		staleTime: 60 * 60_000,
	})
}

/** Active orders of one side: the buyer's parcels on the home screen, the shop's on «Запросы». */
export function useDeliveryOrders(side: 'BUYER' | 'SHOP', enabled = true) {
	return useQuery({
		queryKey: deliveryKeys.list(side),
		queryFn: ({ signal }) => apiFetch<DeliveryOrder[]>('/delivery-orders', { query: { side, active: true }, signal }),
		enabled,
	})
}

export function useDeliveryOrder(id: number) {
	return useQuery({
		queryKey: deliveryKeys.detail(id),
		queryFn: ({ signal }) => apiFetch<DeliveryOrder>(`/delivery-orders/${id}`, { signal }),
		enabled: id > 0,
		// Statuses change on the courier's and admin's side — keep «Где посылка» fresh.
		refetchInterval: 30_000,
	})
}

function useOrderMutation<V>(mutationFn: (vars: V) => Promise<DeliveryOrder>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: (order) => {
			queryClient.setQueryData(deliveryKeys.detail(order.id), order)
			queryClient.invalidateQueries({ queryKey: ['delivery', 'orders'] })
		},
	})
}

/** «Заказать доставку». */
export function useCreateDeliveryOrder() {
	// One key per order: a double tap or a retry after a lost response does not create a second order.
	const idempotencyKey = useRef<string | null>(null)
	return useOrderMutation(async (body: CreateDeliveryOrderBody) => {
		idempotencyKey.current ??= newIdempotencyKey()
		const order = await apiFetch<DeliveryOrder>('/delivery-orders', { method: 'POST', body, idempotencyKey: idempotencyKey.current })
		idempotencyKey.current = null
		return order
	})
}

/** «Упаковал — жду курьера»: weight and «Хрупкое» go to the courier's form. */
export function usePackDeliveryOrder(id: number) {
	return useOrderMutation((body: DeliveryPackedBody) => apiFetch<DeliveryOrder>(`/delivery-orders/${id}/packed`, { method: 'POST', body }))
}

/** «Курьер забрал» — the buyer gets a push. */
export function usePickedUpDeliveryOrder(id: number) {
	return useOrderMutation(() => apiFetch<DeliveryOrder>(`/delivery-orders/${id}/picked-up`, { method: 'POST' }))
}

/** «Получил» — the buyer closes the order. */
export function useReceiveDeliveryOrder(id: number) {
	return useOrderMutation(() => apiFetch<DeliveryOrder>(`/delivery-orders/${id}/received`, { method: 'POST' }))
}
