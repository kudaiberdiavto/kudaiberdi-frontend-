// Thin fetch wrapper — same shape that worked well in the previous project:
// one place for base URL, JSON handling, auth header injection and typed
// errors, instead of raw `fetch()` scattered across screens.

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export class ApiError extends Error {
	status: number
	constructor(status: number, message: string) {
		super(message)
		this.status = status
	}
}

/** Swap this for SecureStore-backed token storage once auth exists. */
let accessToken: string | null = null
export function setAccessToken(token: string | null) {
	accessToken = token
}

export async function apiFetch<T>(
	path: string,
	options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
	const { method = 'GET', body, auth = true } = options

	const headers: Record<string, string> = { 'Content-Type': 'application/json' }
	if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

	const res = await fetch(`${API_BASE_URL}${path}`, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	})

	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new ApiError(res.status, text || `HTTP ${res.status}`)
	}
	if (res.status === 204) return undefined as T
	return (await res.json()) as T
}
