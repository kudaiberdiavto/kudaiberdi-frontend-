// Voice notes in the v23 flow [04, 05, 12–14, 16–19]: the pill player from the design and
// record → upload (POST /media/voices) → what the server understood (`reply` / `offer`).
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useVoiceRecorder } from '@/components/chat-media'
import { resolveUrl, uploadVoice, type VoicePurpose } from '@/lib/api'
import { fontFamily, useColors } from '@/theme'
import type { Voice, VoiceUpload } from '@/api/types'

const BARS = 24
/** Bar heights of the design's waveform — used when the server has no waveform for the note. */
const DESIGN_BARS = [6, 11, 20, 8, 17, 9, 14, 9, 14, 20, 17, 6, 17, 6, 13, 8, 6, 13, 8, 17, 13, 9, 12, 7]

export const voiceClock = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** ≤100 peaks 0…1 → 22 bar heights 6…20 px. */
function barHeights(waveform: number[] | null | undefined) {
	if (!waveform?.length) return DESIGN_BARS
	return Array.from({ length: BARS }, (_, i) => {
		const from = Math.floor((i * waveform.length) / BARS)
		const to = Math.max(from + 1, Math.floor(((i + 1) * waveform.length) / BARS))
		const peak = Math.max(...waveform.slice(from, to))
		return Math.round(6 + peak * 14)
	})
}

export function PlayIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round">
			<Path d="M8 5.5v13l10-6.5z" />
		</Svg>
	)
}

function PauseIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
			<Path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
		</Svg>
	)
}

/**
 * The pill player: ▶ in a circle, bars, «0:08». `tone` — green in answers (05), blue for the buyer's and
 * master's notes (12–14, 16–19). `background` — the pill colour (#F3F5F8 on cards, white on grey).
 * At rest all bars are pale; while playing they fill smoothly from the left.
 */
export function VoicePlayer({
	voice,
	tone = 'blue',
	background,
	height = 44,
}: {
	voice: Pick<Voice, 'url' | 'durationSec' | 'waveform'>
	tone?: 'green' | 'blue'
	background?: string
	height?: number
}) {
	const c = useColors()
	// 50 ms — the default 500 ms makes the fill jump
	const player = useAudioPlayer(resolveUrl(voice.url), { updateInterval: 50 })
	const status = useAudioPlayerStatus(player)
	const [barsWidth, setBarsWidth] = useState(0)
	const duration = status.duration || voice.durationSec || 0
	const finished = status.didJustFinish
	const started = status.playing || (status.currentTime > 0 && !finished)
	const progress = started && duration ? Math.min(1, status.currentTime / duration) : 0
	const color = tone === 'green' ? c.success : c.brand
	const bars = barHeights(voice.waveform)

	const toggle = () => {
		if (status.playing) player.pause()
		else {
			if (finished || progress >= 0.99) player.seekTo(0)
			player.play()
		}
	}

	const row = (opacity: number) => (
		<View style={{ width: barsWidth || undefined, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 24 }}>
			{bars.map((barHeight, i) => (
				<View key={i} style={{ width: 4, height: barHeight, borderRadius: 2, backgroundColor: color, opacity }} />
			))}
		</View>
	)

	return (
		<Pressable
			onPress={toggle}
			style={{
				height,
				borderRadius: height / 2,
				backgroundColor: background ?? c.surface,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 10,
				paddingLeft: 6,
				paddingRight: 14,
			}}
		>
			<View
				style={{
					width: height - 12,
					height: height - 12,
					borderRadius: (height - 12) / 2,
					backgroundColor: color,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{status.playing ? <PauseIcon /> : <PlayIcon />}
			</View>
			<View style={{ flex: 1 }} onLayout={(event) => setBarsWidth(event.nativeEvent.layout.width)}>
				{row(0.3)}
				{/* the played part: the same bars in full colour, clipped to the progress */}
				<View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: barsWidth * progress, overflow: 'hidden' }}>
					{row(1)}
				</View>
			</View>
			<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted, minWidth: 30, textAlign: 'right' }}>
				{voiceClock(started ? status.currentTime : duration)}
			</Text>
		</Pressable>
	)
}

/**
 * Record a voice note and upload it: start → stop → POST /media/voices. `result.voice.id` goes to `voiceMediaId`,
 * `result.reply` / `result.offer` fill the «Проверьте и отправьте» sheet [14, 19], `result.voice.transcript` —
 * the text the server heard.
 */
export function useVoiceNote(purpose: VoicePurpose, onUploaded?: (result: VoiceUpload) => void) {
	const [uploading, setUploading] = useState(false)
	const [result, setResult] = useState<VoiceUpload | null>(null)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const recorder = useVoiceRecorder(async (recorded) => {
		setUploading(true)
		setUploadError(null)
		try {
			const uploaded = await uploadVoice(
				{ uri: recorded.uri, durationSec: recorded.durationSeconds, waveform: recorded.waveform },
				purpose
			)
			setResult(uploaded)
			onUploaded?.(uploaded)
		} catch (error) {
			setUploadError((error as Error).message)
		} finally {
			setUploading(false)
		}
	})

	return {
		recording: recorder.recording,
		seconds: recorder.seconds,
		start: recorder.start,
		/** Stop and upload. */
		stop: recorder.send,
		cancel: recorder.cancel,
		uploading,
		result,
		error: recorder.error ?? uploadError,
		reset: () => {
			setResult(null)
			setUploadError(null)
		},
	}
}
