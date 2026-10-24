// Thin fetch wrapper — one place for base URL, JSON handling, auth header
// injection, token refresh and typed errors. Screens never call it directly:
// they go through the hooks in src/api/<domain>.ts.

import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { API_URL } from '@/lib/env'
import { getItem, setItem } from '@/lib/secure-storage'
import type { MediaItem, MediaPurpose, Photo, VoiceUpload } from '@/api/types'

export { API_URL }
const API_BASE = `${API_URL}/api/v1`

/** Server file URLs may be relative (`/assets/brands/toyota.png`, `/media/…` with local storage). */
export function resolveUrl(url: string): string
export function resolveUrl(url: string | null | undefined): string | null
export function resolveUrl(url: string | null | undefined) {
	if (!url) return null
	return url.startsWith('/') ? `${API_URL}${url}` : url
}

// ─── Errors ──────────────────────────────────────────────────────────────────

/** status 0 — no network / server unreachable (screen 20 «Нет сети»). */
export class ApiError extends Error {
	status: number
	/** Stable machine code (`REQUEST_EXPIRED`, `EXTEND_LIMIT`…) — branch on this, never on `message`. */
	code: string
	/** Validation errors by field name. */
	fields?: Record<string, string>
	/** Seconds until retry is allowed (429). */
	retryAfter?: number
	/** The rest of the error body: `attemptsLeft`, `missing[]`… */
	extra: Record<string, unknown>

	constructor(init: {
		status: number
		code: string
		message: string
		fields?: Record<string, string>
		retryAfter?: number
		extra?: Record<string, unknown>
	}) {
		super(init.message)
		this.name = 'ApiError'
		this.status = init.status
		this.code = init.code
		this.fields = init.fields
		this.retryAfter = init.retryAfter
		this.extra = init.extra ?? {}
	}
}

export function isNetworkError(error: unknown) {
	return error instanceof ApiError && error.status === 0
}

const networkError = () =>
	new ApiError({ status: 0, code: 'NETWORK', message: 'Нет сети. Проверьте интернет и попробуйте ещё раз' })

// The backend answers with RFC 7807 problem+json: {code, detail, errors[{field, message}], retryAfter?, …}.
// The contract describes {code, message, fields}; both shapes are accepted (see BACKEND_QUESTIONS.md).
function parseError(status: number, text: string, retryAfterHeader: string | null): ApiError {
	let body: Record<string, any> = {}
	try {
		body = text ? JSON.parse(text) : {}
	} catch {}

	let fields: Record<string, string> | undefined
	if (Array.isArray(body.errors)) {
		fields = Object.fromEntries(body.errors.map((e: { field: string; message: string }) => [e.field, e.message]))
	} else if (body.fields && typeof body.fields === 'object') {
		fields = body.fields
	}

	const retryAfter = Number(body.retryAfter ?? retryAfterHeader)
	const { code, detail, message, errors: _errors, fields: _fields, type: _type, title, status: _status, instance: _instance, ...extra } = body

	return new ApiError({
		status,
		code: typeof code === 'string' ? code : status === 401 ? 'UNAUTHORIZED' : status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
		message: detail ?? message ?? title ?? (status >= 500 ? 'Сервер недоступен, попробуйте позже' : 'Что-то пошло не так'),
		fields,
		retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
		extra,
	})
}

// ─── Session: tokens, language, expiry ───────────────────────────────────────

export type ApiLang = 'ru' | 'ky'

interface Tokens {
	accessToken: string
	refreshToken: string
}

const TOKENS_KEY = 'auth.tokens'
let tokens: Tokens | null = null

const config = {
	getLang: (): ApiLang => 'ru',
	/** Refresh failed — the session store logs out and sends the user to screen 01. */
	onSessionExpired: () => {},
}

export function configureApi(options: Partial<typeof config>) {
	Object.assign(config, options)
}

/** Reads saved tokens on app start. Returns true when a session exists. */
export async function loadTokens() {
	const raw = await getItem(TOKENS_KEY)
	try {
		tokens = raw ? (JSON.parse(raw) as Tokens) : null
	} catch {
		tokens = null
	}
	return tokens !== null
}

export async function saveTokens(next: Tokens | null) {
	tokens = next ? { accessToken: next.accessToken, refreshToken: next.refreshToken } : null
	await setItem(TOKENS_KEY, tokens ? JSON.stringify(tokens) : null)
}

export function getRefreshToken() {
	return tokens?.refreshToken ?? null
}

// Single-flight: parallel 401s wait for the same refresh call.
let refreshing: Promise<boolean> | null = null

export function refreshSession(): Promise<boolean> {
	refreshing ??= doRefresh().finally(() => {
		refreshing = null
	})
	return refreshing
}

async function doRefresh(): Promise<boolean> {
	const refreshToken = tokens?.refreshToken
	if (!refreshToken) return false

	let res: Response
	try {
		res = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ refreshToken }),
		})
	} catch {
		// Offline is not a logout: keep the tokens, the request fails as «Нет сети».
		throw networkError()
	}

	if (res.ok) {
		await saveTokens((await res.json()) as Tokens)
		return true
	}
	if (res.status === 400 || res.status === 401 || res.status === 403) {
		await saveTokens(null)
		config.onSessionExpired()
		return false
	}
	throw parseError(res.status, await res.text().catch(() => ''), res.headers.get('Retry-After'))
}

// ─── Requests ────────────────────────────────────────────────────────────────

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue | QueryValue[]>

export interface ApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	body?: unknown
	query?: Query
	/** false — do not send the token (guest endpoints, OTP). */
	auth?: boolean
	/** `Idempotency-Key` for POST /requests and POST /requests/{id}/replies. Reuse the same key on retry. */
	idempotencyKey?: string
	headers?: Record<string, string>
	signal?: AbortSignal
}

function buildUrl(path: string, query?: Query) {
	const params: string[] = []
	for (const [key, value] of Object.entries(query ?? {})) {
		for (const item of Array.isArray(value) ? value : [value]) {
			if (item === null || item === undefined || item === '') continue
			params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
		}
	}
	return `${API_BASE}${path}${params.length ? `?${params.join('&')}` : ''}`
}

const REQUEST_TIMEOUT = 20_000

export function newIdempotencyKey() {
	return Crypto.randomUUID()
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
	const { method = 'GET', body, query, auth = true, idempotencyKey, signal } = options
	const isForm = typeof FormData !== 'undefined' && body instanceof FormData

	const send = async () => {
		const usedToken = auth ? (tokens?.accessToken ?? null) : null
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Accept-Language': config.getLang(),
			...options.headers,
		}
		if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
		if (usedToken) headers.Authorization = `Bearer ${usedToken}`
		if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

		// Market mobile internet drops silently — give up after REQUEST_TIMEOUT instead of spinning forever.
		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
		const onAbort = () => controller.abort()
		signal?.addEventListener('abort', onAbort)
		try {
			const res = await fetch(buildUrl(path, query), {
				method,
				headers,
				signal: controller.signal,
				body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
			})
			return { res, usedToken }
		} catch (error) {
			// Cancelled by the caller (React Query) — not a network problem.
			if (signal?.aborted) throw error
			throw networkError()
		} finally {
			clearTimeout(timer)
			signal?.removeEventListener('abort', onAbort)
		}
	}

	let { res, usedToken } = await send()

	if (res.status === 401 && usedToken) {
		// Another request may have refreshed while this one was in flight.
		const renewed = tokens?.accessToken !== usedToken || (await refreshSession())
		if (renewed) ({ res } = await send())
	}

	if (!res.ok) throw parseError(res.status, await res.text().catch(() => ''), res.headers.get('Retry-After'))

	const text = res.status === 204 ? '' : await res.text()
	return (text ? JSON.parse(text) : undefined) as T
}

// ─── Photos ──────────────────────────────────────────────────────────────────

const MAX_PHOTO_SIDE = 1080

/** Market mobile internet is slow: shrink to 1080 px on the long side, re-encode as JPEG (no HEIC). */
export async function compressPhoto(uri: string): Promise<string> {
	const context = ImageManipulator.manipulate(uri)
	try {
		const original = await context.renderAsync()
		let image = original
		if (Math.max(original.width, original.height) > MAX_PHOTO_SIDE) {
			context.resize(original.width >= original.height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE })
			image = await context.renderAsync()
		}
		const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG })
		return result.uri
	} finally {
		context.release()
	}
}

/** A local file as a multipart part — a Blob on web, `{uri, name, type}` on iOS / Android. */
async function appendFile(form: FormData, field: string, uri: string, file: { name: string; type: string }) {
	if (Platform.OS === 'web') {
		const blob = await (await fetch(uri)).blob()
		form.append(field, new Blob([blob], { type: file.type }), file.name)
	} else {
		form.append(field, { uri, name: file.name, type: file.type } as unknown as Blob)
	}
}

/** Multipart form with a local file under `file` (+ extra text fields). */
export async function fileFormData(
	uri: string,
	file: { name: string; type: string },
	fields: Record<string, string | undefined> = {}
) {
	const form = new FormData()
	await appendFile(form, 'file', uri, file)
	for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.append(key, value)
	return form
}

/** JPEG under `file` — for /media/photos and /ocr/oem. */
export function imageFormData(uri: string, fields: Record<string, string> = {}) {
	return fileFormData(uri, { name: 'photo.jpg', type: 'image/jpeg' }, fields)
}

const photoFormData = (uri: string, purpose: MediaPurpose) => imageFormData(uri, { purpose })

/**
 * Multipart POST with upload progress (fetch has none, so XHR) and one retry after a token refresh.
 * `makeForm` is called again for the retry — a FormData can't be sent twice.
 */
async function uploadForm<T>(
	path: string,
	makeForm: () => Promise<FormData>,
	options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<T> {
	const send = (form: FormData) =>
		new Promise<{ status: number; text: string; retryAfter: string | null; usedToken: string | null }>(
			(resolve, reject) => {
				const usedToken = tokens?.accessToken ?? null
				const xhr = new XMLHttpRequest()
				xhr.open('POST', `${API_BASE}${path}`)
				xhr.setRequestHeader('Accept', 'application/json')
				xhr.setRequestHeader('Accept-Language', config.getLang())
				if (usedToken) xhr.setRequestHeader('Authorization', `Bearer ${usedToken}`)
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) options.onProgress?.(event.loaded / event.total)
				}
				xhr.onload = () =>
					resolve({
						status: xhr.status,
						text: xhr.responseText,
						retryAfter: xhr.getResponseHeader('Retry-After'),
						usedToken,
					})
				xhr.onerror = () => reject(networkError())
				xhr.onabort = () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
				options.signal?.addEventListener('abort', () => xhr.abort())
				xhr.send(form)
			}
		)

	let result = await send(await makeForm())
	if (result.status === 401 && result.usedToken) {
		const renewed = tokens?.accessToken !== result.usedToken || (await refreshSession())
		if (renewed) result = await send(await makeForm())
	}
	if (result.status < 200 || result.status >= 300) throw parseError(result.status, result.text, result.retryAfter)

	options.onProgress?.(1)
	return JSON.parse(result.text) as T
}

/**
 * Compresses and uploads a photo: multipart POST /media/photos → {id, url, thumbUrl}.
 * `onProgress` gets 0…1.
 */
export async function uploadPhoto(
	uri: string,
	purpose: MediaPurpose,
	options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<Photo> {
	const compressed = await compressPhoto(uri)
	return uploadForm<Photo>('/media/photos', () => photoFormData(compressed, purpose), options)
}

/**
 * A video for a service request [36]: multipart POST /media/videos?purpose=SERVICE — `file` up to 30 s and 100 MB,
 * optional `poster` (a frame from the phone). MP4 / MOV duration is read by the server; `durationSec` is for the rest.
 */
export async function uploadVideo(
	video: { uri: string; mimeType: string; durationSec?: number; posterUri?: string | null },
	options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<MediaItem> {
	const extension = video.mimeType.split('/')[1]?.split(';')[0] || 'mp4'
	const query = new URLSearchParams({ purpose: 'SERVICE' })
	if (video.durationSec) query.set('durationSec', String(Math.ceil(video.durationSec)))
	const makeForm = async () => {
		const form = await fileFormData(video.uri, { name: `video.${extension}`, type: video.mimeType })
		if (video.posterUri) await appendFile(form, 'poster', await compressPhoto(video.posterUri), { name: 'poster.jpg', type: 'image/jpeg' })
		return form
	}
	return uploadForm<MediaItem>(`/media/videos?${query}`, makeForm, options)
}

export type VoicePurpose = 'REQUEST' | 'REPLY' | 'SERVICE' | 'OFFER'

/**
 * A voice note [04, 14, 16, 19]: multipart POST /media/voices — up to 60 s. The server transcribes it and, for
 * REPLY / OFFER, parses the price and time out of what was said (`reply` / `offer` in the response).
 */
export async function uploadVoice(
	voice: { uri: string; durationSec: number; waveform?: number[] },
	purpose: VoicePurpose,
	options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<VoiceUpload> {
	const query = new URLSearchParams({ purpose, durationSec: String(Math.max(1, Math.round(voice.durationSec))) })
	const makeForm = async () => {
		const form = await fileFormData(voice.uri, { name: 'voice.m4a', type: 'audio/m4a' })
		if (voice.waveform?.length) form.append('waveform', JSON.stringify(voice.waveform))
		return form
	}
	return uploadForm<VoiceUpload>(`/media/voices?${query}`, makeForm, options)
}
