// Photo attachments for requests, replies, parts and the box: pick → compress → upload,
// with per-photo progress and retry. The entity then gets `mediaIds`.
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { Platform } from 'react-native'
import { getThumbnailAsync } from 'expo-video-thumbnails'
import { uploadPhoto, uploadVideo } from '@/lib/api'
import type { MediaItem, MediaPurpose, Photo } from './types'

export interface PendingPhoto {
	key: string
	uri: string
	status: 'uploading' | 'done' | 'error'
	/** 0…1 */
	progress: number
	photo?: Photo
	error?: string
}

export function usePhotoUploads(
	purpose: MediaPurpose,
	max: number,
	/**
	 * Called once per photo after upload — e.g. to attach it to the box right away [22].
	 * The local placeholder is dropped when the returned promise settles.
	 */
	onUploaded?: (photo: Photo) => Promise<unknown>
) {
	const [photos, setPhotos] = useState<PendingPhoto[]>([])

	const patch = (key: string, next: Partial<PendingPhoto>) =>
		setPhotos((list) => list.map((p) => (p.key === key ? { ...p, ...next } : p)))

	const start = async (key: string, uri: string) => {
		patch(key, { status: 'uploading', progress: 0, error: undefined })
		try {
			const photo = await uploadPhoto(uri, purpose, { onProgress: (progress) => patch(key, { progress }) })
			patch(key, { status: 'done', progress: 1, photo })
			// Errors surface through the caller's mutation state.
			if (onUploaded) onUploaded(photo).catch(() => {}).finally(() => setPhotos((list) => list.filter((p) => p.key !== key)))
		} catch (error) {
			patch(key, { status: 'error', error: (error as Error).message })
		}
	}

	/** Opens the gallery (or camera) and uploads what was picked. */
	const pick = async (source: 'library' | 'camera' = 'library') => {
		const left = max - photos.length
		if (left <= 0) return
		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ['images'],
			quality: 1,
			allowsMultipleSelection: source === 'library' && left > 1,
			selectionLimit: left,
		}
		if (source === 'camera') {
			const permission = await ImagePicker.requestCameraPermissionsAsync()
			if (!permission.granted) return
		}
		const result =
			source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
		if (result.canceled) return

		const added = result.assets.slice(0, left).map((asset, i) => ({
			key: `${Date.now()}-${i}`,
			uri: asset.uri,
			status: 'uploading' as const,
			progress: 0,
		}))
		setPhotos((list) => [...list, ...added])
		added.forEach((p) => start(p.key, p.uri))
	}

	const retry = (key: string) => {
		const photo = photos.find((p) => p.key === key)
		if (photo) start(photo.key, photo.uri)
	}

	const remove = (key: string) => setPhotos((list) => list.filter((p) => p.key !== key))

	return {
		photos,
		pick,
		retry,
		remove,
		canAdd: photos.length < max,
		uploading: photos.some((p) => p.status === 'uploading'),
		/** Uploaded ids in the picked order (first — main photo). */
		mediaIds: photos.flatMap((p) => (p.photo ? [p.photo.id] : [])),
	}
}

export interface PendingMedia {
	key: string
	kind: 'PHOTO' | 'VIDEO'
	/** Local photo, or the video's poster frame (null — no frame, show a play tile). */
	previewUri: string | null
	status: 'uploading' | 'done' | 'error'
	progress: number
	media?: MediaItem
	error?: string
	source: { uri: string; mimeType: string; durationSec?: number; posterUri?: string | null }
}

const MAX_VIDEO_SEC = 30

/** First frame of a local video for the poster. Not available on web — the server shows none then. */
async function posterOf(uri: string) {
	if (Platform.OS === 'web') return null
	try {
		return (await getThumbnailAsync(uri, { time: 0, quality: 0.7 })).uri
	} catch {
		return null
	}
}

/**
 * Photos and videos of a service request [36]: up to 5 together, video up to 30 s (POST /media/videos,
 * purpose SERVICE, poster from the phone). `mediaIds` keeps the picked order.
 */
export function useServiceMedia(max = 5) {
	const [items, setItems] = useState<PendingMedia[]>([])

	const patch = (key: string, next: Partial<PendingMedia>) =>
		setItems((list) => list.map((item) => (item.key === key ? { ...item, ...next } : item)))

	const start = async (item: PendingMedia) => {
		patch(item.key, { status: 'uploading', progress: 0, error: undefined })
		const onProgress = (progress: number) => patch(item.key, { progress })
		try {
			const media: MediaItem =
				item.kind === 'VIDEO'
					? await uploadVideo(item.source, { onProgress })
					: { ...(await uploadPhoto(item.source.uri, 'SERVICE', { onProgress })), kind: 'PHOTO', durationSec: null }
			patch(item.key, { status: 'done', progress: 1, media })
		} catch (error) {
			patch(item.key, { status: 'error', error: (error as Error).message })
		}
	}

	const pick = async () => {
		const left = max - items.length
		if (left <= 0) return
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images', 'videos'],
			quality: 1,
			allowsMultipleSelection: left > 1,
			selectionLimit: left,
			videoMaxDuration: MAX_VIDEO_SEC,
		})
		if (result.canceled) return
		const added: PendingMedia[] = []
		for (const [i, asset] of result.assets.slice(0, left).entries()) {
			const video = asset.type === 'video'
			// expo-image-picker: milliseconds on iOS / Android, but seconds on web (HTMLVideoElement.duration).
			const raw = video && asset.duration && Number.isFinite(asset.duration) ? asset.duration : undefined
			const durationSec = raw === undefined ? undefined : Platform.OS === 'web' ? raw : raw / 1000
			const item: PendingMedia = {
				key: `${Date.now()}-${i}`,
				kind: video ? 'VIDEO' : 'PHOTO',
				previewUri: video ? await posterOf(asset.uri) : asset.uri,
				status: 'uploading',
				progress: 0,
				source: { uri: asset.uri, mimeType: asset.mimeType ?? (video ? 'video/mp4' : 'image/jpeg'), durationSec },
			}
			item.source.posterUri = video ? item.previewUri : null
			// Checked here too, so a long video fails at once instead of after the upload (400 VIDEO_TOO_LONG).
			if (durationSec && durationSec > MAX_VIDEO_SEC + 0.5) {
				added.push({ ...item, status: 'error', error: 'Видео длиннее 30 секунд' })
				continue
			}
			added.push(item)
		}
		setItems((list) => [...list, ...added])
		added.filter((item) => item.status === 'uploading').forEach(start)
	}

	const retry = (key: string) => {
		const item = items.find((i) => i.key === key)
		if (item && item.error !== 'Видео длиннее 30 секунд') start(item)
	}
	const remove = (key: string) => setItems((list) => list.filter((i) => i.key !== key))

	return {
		items,
		pick,
		retry,
		remove,
		canAdd: items.length < max,
		uploading: items.some((i) => i.status === 'uploading'),
		mediaIds: items.flatMap((i) => (i.media ? [i.media.id] : [])),
	}
}
