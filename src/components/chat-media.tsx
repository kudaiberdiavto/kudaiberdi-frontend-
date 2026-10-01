import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import {
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioPlayer,
	useAudioPlayerStatus,
	useAudioRecorder,
	useAudioRecorderState,
} from 'expo-audio'
import { useVideoPlayer, VideoView } from 'expo-video'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'

/** The server takes voice messages up to 60 s. */
export const MAX_VOICE_SECONDS = 60
const MAX_PEAKS = 100

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** MIME by the recorder's file extension (m4a on iOS/Android, webm on web). */
function audioMime(uri: string) {
	const ext = uri.split('?')[0].split('.').pop()?.toLowerCase()
	if (ext === 'webm') return 'audio/webm'
	if (ext === '3gp') return 'audio/3gpp'
	if (ext === 'caf') return 'audio/x-caf'
	if (ext === 'wav') return 'audio/wav'
	return 'audio/mp4'
}

/** Squeeze the collected loudness samples into ≤100 peaks 0…1 for the `waveform` field. */
function toPeaks(samples: number[]) {
	if (!samples.length) return []
	const bucket = Math.max(1, Math.ceil(samples.length / MAX_PEAKS))
	const peaks: number[] = []
	for (let i = 0; i < samples.length; i += bucket) peaks.push(Math.max(...samples.slice(i, i + bucket)))
	return peaks.map((p) => Math.round(p * 100) / 100)
}

export interface RecordedVoice {
	uri: string
	mimeType: string
	durationSeconds: number
	waveform: number[]
}

/** Voice recording for the chat composer [08, 13]: start → stop (send) / cancel, auto-stop at 60 s. */
export function useVoiceRecorder(onRecorded: (voice: RecordedVoice) => void) {
	const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true })
	const state = useAudioRecorderState(recorder, 100)
	const samples = useRef<number[]>([])
	const [error, setError] = useState<string | null>(null)
	const seconds = state.durationMillis / 1000

	// Metering is dBFS (−160…0): map −50…0 dB to 0…1.
	useEffect(() => {
		if (state.isRecording && typeof state.metering === 'number') {
			samples.current.push(Math.min(1, Math.max(0, (state.metering + 50) / 50)))
		}
	}, [state.isRecording, state.metering, state.durationMillis])

	const start = async () => {
		setError(null)
		const permission = await requestRecordingPermissionsAsync()
		if (!permission.granted) {
			setError('Разрешите доступ к микрофону в настройках')
			return
		}
		await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
		samples.current = []
		await recorder.prepareToRecordAsync()
		recorder.record()
	}

	const stop = async (send: boolean) => {
		if (!state.isRecording) return
		const duration = recorder.currentTime || seconds
		await recorder.stop()
		await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
		const uri = recorder.uri
		if (send && uri && duration >= 1) {
			onRecorded({ uri, mimeType: audioMime(uri), durationSeconds: duration, waveform: toPeaks(samples.current) })
		}
	}

	// The server rejects voice longer than 60 s — stop and send at the limit.
	useEffect(() => {
		if (state.isRecording && seconds >= MAX_VOICE_SECONDS) stop(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- react to the timer only
	}, [seconds, state.isRecording])

	return { recording: state.isRecording, seconds, start, send: () => stop(true), cancel: () => stop(false), error }
}

/** The recording bar that replaces the text field while recording. */
export function RecordingBar({ seconds, onCancel }: { seconds: number; onCancel: () => void }) {
	const c = useColors()
	return (
		<View
			style={{
				flex: 1,
				height: 48,
				borderRadius: 24,
				backgroundColor: c.card,
				paddingHorizontal: 16,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 10,
			}}
		>
			<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.danger }} />
			<Text style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>
				Запись {clock(seconds)} / {clock(MAX_VOICE_SECONDS)}
			</Text>
			<Text onPress={onCancel} style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.danger }}>
				Отмена
			</Text>
		</View>
	)
}

/** VOICE message: ▶ / ❚❚, waveform with progress, duration. */
export function VoiceBubble({
	mediaUrl,
	waveform,
	durationSeconds,
	mine,
}: {
	mediaUrl: string
	waveform: number[] | null
	durationSeconds: number | null
	mine: boolean
}) {
	const c = useColors()
	const player = useAudioPlayer(resolveUrl(mediaUrl))
	const status = useAudioPlayerStatus(player)
	const duration = status.duration || durationSeconds || 0
	const progress = duration ? status.currentTime / duration : 0
	const peaks = waveform?.length ? waveform : Array.from({ length: 28 }, () => 0.35)
	const fg = mine ? '#FFFFFF' : c.brand
	const dim = mine ? 'rgba(255,255,255,0.45)' : c.border

	const toggle = () => {
		if (status.playing) player.pause()
		else {
			if (status.didJustFinish || progress >= 0.99) player.seekTo(0)
			player.play()
		}
	}

	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 }}>
			<Pressable
				onPress={toggle}
				style={{
					width: 36,
					height: 36,
					borderRadius: 18,
					backgroundColor: mine ? 'rgba(255,255,255,0.22)' : c.brandTint,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(800), color: fg }}>{status.playing ? '❚❚' : '▶'}</Text>
			</Pressable>
			<View style={{ flex: 1, height: 28, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
				{peaks.slice(0, 40).map((peak, i, list) => (
					<View
						key={i}
						style={{
							flex: 1,
							height: Math.max(3, peak * 28),
							borderRadius: 2,
							backgroundColor: i / list.length <= progress ? fg : dim,
						}}
					/>
				))}
			</View>
			<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: mine ? '#FFFFFF' : c.muted }}>
				{clock(status.playing || status.currentTime ? status.currentTime : duration)}
			</Text>
		</View>
	)
}

/** VIDEO message: inline player with native controls. */
export function VideoBubble({ mediaUrl }: { mediaUrl: string }) {
	const player = useVideoPlayer(resolveUrl(mediaUrl))
	return <VideoView player={player} nativeControls contentFit="cover" style={{ width: 220, height: 220, borderRadius: 12 }} />
}
