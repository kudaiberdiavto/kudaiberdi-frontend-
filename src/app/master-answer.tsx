import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { VoicePlayer, useVoiceNote, voiceClock } from '@/components/voice'
import { CheckMark, FromVoiceBadge, MicOutline, SendPlane, Sparkle } from '@/components/master-v23'
import { fontFamily, useColors } from '@/theme'
import { formatClock, formatNumber } from '@/lib/format'
import { useMasterOffer, useMasterRequest } from '@/api/services'
import type { OfferDraft } from '@/api/types'

type When = 'NOW' | 'TODAY' | 'TOMORROW'

/** Next full hour plus one: the default «Сегодня 15:00». */
function laterToday(now: Date) {
	const at = new Date(now)
	at.setHours(now.getHours() + 2, 0, 0, 0)
	return at
}

function tomorrowMorning(now: Date) {
	const at = new Date(now.getTime() + 86_400_000)
	at.setHours(10, 0, 0, 0)
	return at
}

/**
 * 19 «Проверьте и отправьте» — the master's «Могу помочь»: price «от» and time filled from the voice note
 * (POST /media/voices purpose=OFFER), editable, → POST /my/master/requests/{id}/offer. `record=1` — started
 * from «Ответить голосом»: recording begins at once.
 */
export default function MasterAnswerScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ id: string; record?: string }>()
	const id = Number(params.id)
	const request = useMasterRequest(id).data
	const offer = useMasterOffer()
	const [openedAt] = useState(() => new Date())
	const [price, setPrice] = useState('')
	// Late in the evening «today + 2 hours» is already tomorrow — offer the morning instead.
	const [when, setWhen] = useState<When>(() => (openedAt.getHours() >= 21 ? 'TOMORROW' : 'TODAY'))
	const [times, setTimes] = useState<Record<When, Date>>(() => ({ NOW: openedAt, TODAY: laterToday(openedAt), TOMORROW: tomorrowMorning(openedAt) }))
	const [fromVoice, setFromVoice] = useState<{ price: number | null; when: When | null }>({ price: null, when: null })

	const apply = (draft: OfferDraft | null) => {
		if (!draft) return
		if (draft.priceFrom) setPrice(String(draft.priceFrom))
		const spoken = draft.when === 'AT_TIME' ? null : draft.when
		if (spoken) {
			setWhen(spoken)
			if (draft.availableAt) {
				const at = new Date(draft.availableAt)
				setTimes((current) => ({ ...current, [spoken]: at }))
			}
		}
		setFromVoice({ price: draft.priceFrom, when: spoken })
	}
	const voice = useVoiceNote('OFFER', (result) => apply(result.offer))

	// «Ответить голосом» [18] — start recording right away, once on open.
	useEffect(() => {
		if (params.record === '1') voice.start()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const priceValue = price ? Number(price) : null
	const busy = voice.recording || voice.uploading || offer.isPending
	const close = () => {
		if (voice.recording) voice.cancel()
		router.back()
	}

	const send = () => {
		if (busy) return
		const at = when === 'NOW' ? (fromVoice.when === 'NOW' ? times.NOW : new Date()) : times[when]
		offer.mutate(
			{
				id,
				body: {
					answer: 'CAN_HELP',
					priceFrom: priceValue ?? undefined,
					availableAt: at.toISOString(),
					voiceMediaId: voice.result?.voice.id,
				},
			},
			{ onSuccess: () => router.back() }
		)
	}

	const timeLabel = (value: When) => {
		if (value === 'NOW') {
			const minutes = Math.round((times.NOW.getTime() - openedAt.getTime()) / 60_000)
			return fromVoice.when === 'NOW' && minutes > 5 ? `Через ${minutes} мин` : 'Сейчас'
		}
		if (value === 'TODAY') return `Сегодня ${formatClock(times.TODAY)}`
		return fromVoice.when === 'TOMORROW' ? `Завтра ${formatClock(times.TOMORROW)}` : 'Завтра'
	}

	const subtitle = request ? [request.description, request.car.modelLabel ?? request.car.label].filter(Boolean).join(' · ') : ' '

	return (
		<>
			<Stack.Screen options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={{ flex: 1, backgroundColor: 'rgba(32,31,29,0.45)' }} onPress={close} />
				<View
					style={{
						backgroundColor: c.card,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						paddingTop: 10,
						paddingHorizontal: 16,
						paddingBottom: 28 + insets.bottom,
						gap: 12,
					}}
				>
					<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}>
							<CheckMark size={22} color="#FFFFFF" strokeWidth={2.2} />
						</View>
						<View style={{ flex: 1, gap: 1 }}>
							<Text style={{ fontSize: 22, lineHeight: 28.6, fontFamily: fontFamily(800), color: c.ink }}>Проверьте и отправьте</Text>
							<Text numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
								{subtitle}
							</Text>
						</View>
					</View>

					{/* The client's voice note — to listen again before answering (not while recording). */}
					{request?.voice && !voice.recording ? (
						<View style={{ gap: 6 }}>
							<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Голос клиента</Text>
							<VoicePlayer voice={request.voice} background={c.surface} />
						</View>
					) : null}

					{voice.recording || voice.uploading ? (
						<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: voice.recording ? c.danger : c.brand, alignItems: 'center', justifyContent: 'center' }}>
								<MicOutline size={22} color="#FFFFFF" />
							</View>
							<Text style={{ flex: 1, fontSize: 16.5, fontFamily: fontFamily(600), color: c.ink }}>
								{voice.recording ? `Говорите… ${voiceClock(voice.seconds)}` : 'Распознаём…'}
							</Text>
							{voice.recording ? (
								<Pressable onPress={voice.stop} style={{ height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: c.brand, justifyContent: 'center' }}>
									<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Готово</Text>
								</Pressable>
							) : null}
						</View>
					) : voice.result ? (
						<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 10, gap: 8 }}>
							<VoicePlayer voice={voice.result.voice} background={c.card} />
							<View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 }}>
								<Text style={{ flex: 1, fontSize: 16.5, lineHeight: 22.5, fontStyle: 'italic', fontFamily: fontFamily(400), color: c.inkSecondary }}>
									{voice.result.voice.transcript ? `«${voice.result.voice.transcript}»` : 'Не удалось разобрать — заполните цену и время сами'}
								</Text>
								<Text onPress={voice.start} style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
									Перезаписать
								</Text>
							</View>
						</View>
					) : (
						<Pressable
							onPress={voice.start}
							style={{ height: 48, borderRadius: 14, backgroundColor: c.brandTint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<MicOutline size={20} color={c.brandStrong} />
							<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Сказать голосом</Text>
						</Pressable>
					)}
					{voice.error ? <Text style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: c.danger }}>{voice.error}</Text> : null}

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
						<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, textTransform: 'uppercase', color: c.muted }}>
							{voice.result ? 'Заполнили из голоса' : 'Цена и время'}
						</Text>
						<View style={{ flex: 1 }} />
						{voice.result ? <Text style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: c.muted }}>можно поправить</Text> : null}
					</View>

					<View
						style={{
							height: 64,
							borderRadius: 16,
							borderWidth: 2.5,
							borderColor: priceValue ? c.success : c.border,
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: 16,
							gap: 8,
						}}
					>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.muted }}>от</Text>
						<TextInput
							value={priceValue ? formatNumber(priceValue) : ''}
							onChangeText={(value) => setPrice(value.replace(/\D/g, '').slice(0, 7))}
							keyboardType="number-pad"
							placeholder="0"
							placeholderTextColor={c.border}
							style={{ minWidth: 40, fontSize: 32, fontFamily: fontFamily(800), letterSpacing: -0.64, color: c.ink, padding: 0 }}
						/>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.muted }}>сом</Text>
						<View style={{ flex: 1 }} />
						{fromVoice.price && fromVoice.price === priceValue ? <FromVoiceBadge /> : null}
					</View>

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						{(['NOW', 'TODAY', 'TOMORROW'] as const).map((value) => {
							const selected = value === when
							return (
								<Pressable
									key={value}
									onPress={() => setWhen(value)}
									style={{
										flex: value === 'TODAY' ? 1.6 : 1,
										height: 46,
										borderRadius: 12,
										backgroundColor: selected ? c.brandTint : c.card,
										borderWidth: 2,
										borderColor: selected ? c.brand : c.border,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 6,
									}}
								>
									<Text numberOfLines={1} style={{ fontSize: 16.5, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? c.brandStrong : c.ink }}>
										{timeLabel(value)}
									</Text>
									{fromVoice.when === value ? <Sparkle size={14} /> : null}
								</Pressable>
							)
						})}
					</View>

					{offer.error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{offer.error.message}</Text> : null}

					<Pressable
						onPress={send}
						disabled={busy}
						style={{
							height: 58,
							borderRadius: 14,
							backgroundColor: c.success,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
							opacity: busy ? 0.5 : 1,
						}}
					>
						<SendPlane size={20} color="#FFFFFF" />
						<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{offer.isPending ? 'Отправляем…' : 'Отправить клиенту'}</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</>
	)
}
