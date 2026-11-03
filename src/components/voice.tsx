// Voice notes in the v23 flow [04, 05, 12–14, 16–19]: the pill player from the design and
// record → upload (POST /media/voices) → what the server understood (`reply` / `offer`).
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useVoiceRecorder } from '@/components/chat-media'
import { MicIcon } from '@/components/icons'
import { resolveUrl, uploadVoice, type VoicePurpose } from '@/lib/api'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import type { Voice, VoiceUpload } from '@/api/types'
import { useVoiceSpeed } from '@/store/useVoiceSpeed'
import { t } from '@/i18n'

const BAR_WIDTH = 4
const BAR_GAP = 2
/** Bar heights of the design's waveform — repeated when the server has no waveform for the note. */
const DESIGN_BARS = [6, 11, 20, 8, 17, 9, 14, 9, 14, 20, 17, 6, 17, 6, 13, 8, 6, 13, 8, 17, 13, 9, 12, 7]

export const voiceClock = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** As many bars as fit the width (4 px bars, 2 px gaps); ≤100 peaks 0…1 → heights 6…20 px. */
function barHeights(waveform: number[] | null | undefined, width: number) {
	const count = Math.max(1, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP)))
	if (!waveform?.length) return Array.from({ length: count }, (_, i) => DESIGN_BARS[i % DESIGN_BARS.length])
	return Array.from({ length: count }, (_, i) => {
		const from = Math.floor((i * waveform.length) / count)
		const to = Math.max(from + 1, Math.floor(((i + 1) * waveform.length) / count))
		const peak = Math.max(...waveform.slice(from, Math.min(to, waveform.length)))
		return Math.round(6 + peak * 14)
	})
}

export function PlayIcon({ size = 14, color = fixed.white }: { size?: number; color?: string }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round">
			<Path d="M8 5.5v13l10-6.5z" />
		</Svg>
	)
}

function PauseIcon({ size = 14, color = fixed.white }: { size?: number; color?: string }) {
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
	const bars = barHeights(voice.waveform, barsWidth)
	const { speed, next: nextSpeed } = useVoiceSpeed()

	// 1× → 1.5× → 2×, pitch kept natural; the same speed for every note.
	useEffect(() => {
		player.setPlaybackRate(speed, 'high')
	}, [player, speed])

	const toggle = () => {
		if (status.playing) player.pause()
		else {
			if (finished || progress >= 0.99) player.seekTo(0)
			// again here: before the audio has loaded, some platforms drop a rate set earlier
			player.setPlaybackRate(speed, 'high')
			player.play()
		}
	}

	const row = (opacity: number) => (
		<View style={{ width: barsWidth || undefined, flexDirection: 'row', alignItems: 'center', gap: BAR_GAP, height: 24 }}>
			{bars.map((barHeight, i) => (
				<View key={i} style={{ width: BAR_WIDTH, height: barHeight, borderRadius: 2, backgroundColor: color, opacity }} />
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
			{started ? (
				<Pressable
					onPress={nextSpeed}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel={t('Скорость {0}', speed)}
					style={{ height: 24, minWidth: 36, paddingHorizontal: 6, borderRadius: 12, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
				>
					<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: fixed.white }}>{`${speed}×`.replace('.', ',')}</Text>
				</Pressable>
			) : null}
			<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted, minWidth: 30, textAlign: 'right' }}>
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

/** While recording: red mic, timer, then two equal buttons «Отмена» · «Готово»; «Слушаем…» while uploading. */
export function VoiceRecordingPanel({ seconds, uploading, onDone, onCancel }: { seconds: number; uploading: boolean; onDone: () => void; onCancel: () => void }) {
	const c = useColors()
	return (
		<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 12, gap: 12 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: uploading ? c.brand : c.danger, alignItems: 'center', justifyContent: 'center' }}>
					<MicIcon size={22} color={fixed.white} />
				</View>
				<Text style={{ flex: 1, fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>
					{uploading ? t('Слушаем…') : t('Говорите · {0}', voiceClock(seconds))}
				</Text>
			</View>
			{uploading ? null : (
				<View style={{ flexDirection: 'row', gap: 10 }}>
					<Pressable
						onPress={onCancel}
						style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 2, borderColor: c.border, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}
					>
						<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>{t('Отмена')}</Text>
					</Pressable>
					<Pressable onPress={onDone} style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
						<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{t('Готово')}</Text>
					</Pressable>
				</View>
			)}
		</View>
	)
}

/** The recorded answer: player, what was heard, and a real «Перезаписать» button. */
export function VoiceResultPanel({ voice, onRerecord }: { voice: Pick<Voice, 'url' | 'durationSec' | 'waveform' | 'transcript'>; onRerecord: () => void }) {
	const c = useColors()
	return (
		<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 10, gap: 10 }}>
			<VoicePlayer voice={voice} background={c.card} />
			{voice.transcript ? (
				<Text style={{ fontSize: fs.base, lineHeight: 22.5, fontStyle: 'italic', fontFamily: fontFamily(400), color: c.inkSecondary, paddingHorizontal: 4 }}>
					«{voice.transcript}»
				</Text>
			) : null}
			<Pressable
				onPress={onRerecord}
				style={{ height: 44, borderRadius: 12, borderWidth: 2, borderColor: c.border, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
			>
				<MicIcon size={18} color={c.brandStrong} />
				<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Перезаписать')}</Text>
			</Pressable>
		</View>
	)
}
