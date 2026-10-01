// Sign-in [01, 02]: POST /auth/otp/send → POST /auth/otp/verify.
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { toLang, useSession } from '@/store/useSession'
import type { SendOtpResponse, TokenResponse } from './types'

/** Phone in E.164, only +996. In dev the response carries `debugCode`. */
export function useSendOtp() {
	return useMutation({
		mutationFn: (phone: string) =>
			apiFetch<SendOtpResponse>('/auth/otp/send', {
				method: 'POST',
				auth: false,
				body: { phone, lang: toLang(useSession.getState().lang) },
			}),
	})
}

/** `isNewUser` — role not chosen yet, go to screen 03. */
export function useVerifyOtp() {
	return useMutation({
		mutationFn: (body: { phone: string; code: string }) =>
			apiFetch<TokenResponse>('/auth/otp/verify', {
				method: 'POST',
				auth: false,
				body: { ...body, lang: toLang(useSession.getState().lang) },
			}),
		onSuccess: (response) => useSession.getState().signIn(response),
	})
}
