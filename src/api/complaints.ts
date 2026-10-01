// «Пожаловаться» — on a part, shop, review, chat, message, master or offer; and «Это мой контейнер».
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { CreateComplaintBody } from './types'

/** POST /complaints — a repeat on the same target is not duplicated (404 COMPLAINT_TARGET_NOT_FOUND, 429 COMPLAINTS_RATE_LIMITED). */
export function useComplain() {
	return useMutation({
		mutationFn: (body: CreateComplaintBody) => apiFetch('/complaints', { method: 'POST', body }),
	})
}

/**
 * «Это мой контейнер» [10а]: the dispute goes to the administration, the answer comes as a DISPUTE_RESOLVED push.
 * 409 CONTAINER_FREE — the box is free, just register; 400 OWN_CONTAINER — your shop is already there.
 */
export function useClaimContainer() {
	return useMutation({
		mutationFn: ({ containerId, text }: { containerId: number; text?: string }) =>
			apiFetch(`/market/containers/${containerId}/claim`, { method: 'POST', body: { text } }),
	})
}
