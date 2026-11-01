import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import {
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioRecorder,
	useAudioRecorderState,
} from 'expo-audio'
import { useVideoPlayer, VideoView } from 'expo-video'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { PlayIcon } from '@/components/voice'
import { t } from '@/i18n'

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
			setError(t('Разрешите доступ к микрофону в настройках'))
			return
		}
		await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
		samples.current = []
		await recorder.prepareToRecordAsync()
		recorder.record()
	}

	const stop = async (send: boolean) => {
		// Leave the recording mode in any case — in it iOS plays voice notes quietly, through the earpiece.
		if (!state.isRecording) {
			await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
			return
		}
		const duration = recorder.currentTime || seconds
		await recorder.stop()
		await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
		const uri = recorder.uri
		if (send && uri && duration >= 1) {
			onRecorded({ uri, mimeType: audioMime(uri), durationSeconds: duration, waveform: toPeaks(samples.current) })
		}
	}

	// The screen closed while recording (swiped away) — back to playback mode.
	useEffect(
		() => () => {
			setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
		},
		[]
	)

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
			<Text style={{ flex: 1, fontSize: 16.5, fontFamily: fontFamily(600), color: c.ink }}>
				{t('Запись {0} / {1}', clock(seconds), clock(MAX_VOICE_SECONDS))}
			</Text>
			<Text onPress={onCancel} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.danger }}>{t('Отмена')}</Text>
		</View>
	)
}

/** VIDEO message: the first frame with ▶; a tap opens it full screen (`onOpen`). */
export function VideoBubble({ mediaUrl, onOpen }: { mediaUrl: string; onOpen: () => void }) {
	const player = useVideoPlayer(resolveUrl(mediaUrl), (p) => {
		p.muted = true
	})
	return (
		<Pressable onPress={onOpen}>
			<View pointerEvents="none">
				<VideoView player={player} nativeControls={false} contentFit="cover" style={{ width: 220, height: 220, borderRadius: 12 }} />
			</View>
			<View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
				<View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
					<PlayIcon size={22} />
				</View>
			</View>
		</Pressable>
	)
}
