import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useConfirmLeave } from '@/lib/use-confirm-leave'
import { toast } from '@/components/ui'
import { VoicePlayer, VoiceRecordingPanel, VoiceResultPanel, useVoiceNote } from '@/components/voice'
import { CheckMark, MicOutline, SendPlane } from '@/components/master-v23'
import { MediaStrip } from '@/components/media-strip'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { formatClock, formatNumber } from '@/lib/format'
import { useMasterOffer, useMasterRequest } from '@/api/services'
import { t } from '@/i18n'

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
	const [times] = useState<Record<When, Date>>(() => ({ NOW: openedAt, TODAY: laterToday(openedAt), TOMORROW: tomorrowMorning(openedAt) }))
	// The voice goes to the client as is; the price and the time the master sets by hand.
	const voice = useVoiceNote('OFFER')

	// «Ответить голосом» [18] — start recording right away, once on open.
	useEffect(() => {
		if (params.record === '1') voice.start()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const priceValue = price ? Number(price) : null
	const busy = voice.recording || voice.uploading || offer.isPending
	const leave = useConfirmLeave(Boolean(price) || Boolean(voice.result) || voice.recording)
	const close = () => {
		if (voice.recording) voice.cancel()
		router.back()
	}

	const send = () => {
		if (busy) return
		const at = when === 'NOW' ? new Date() : times[when]
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
			{ onSuccess: () => (toast(t('Ответ отправлен клиенту')), leave(() => router.back())) }
		)
	}

	const timeLabel = (value: When) => {
		if (value === 'NOW') return t('Сейчас')
		if (value === 'TODAY') return t('Сегодня {0}', formatClock(times.TODAY))
		return t('Завтра')
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
							<CheckMark size={22} color={fixed.white} strokeWidth={2.2} />
						</View>
						<View style={{ flex: 1, gap: 1 }}>
							<Text style={{ fontSize: fs.h3, lineHeight: 28.6, fontFamily: fontFamily(800), color: c.ink }}>{t('Проверьте и отправьте')}</Text>
							<Text numberOfLines={1} style={{ fontSize: fs.md, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
								{subtitle}
							</Text>
						</View>
					</View>

					{/* The client's request stays in sight: the voice note to listen again, the photos and videos. */}
					{request && (request.voice || request.media.length) && !voice.recording ? (
						<View style={{ gap: 8 }}>
							{request.voice ? <VoicePlayer voice={request.voice} background={c.surface} /> : null}
							<MediaStrip media={request.media} />
						</View>
					) : null}

					{voice.recording || voice.uploading ? (
						<VoiceRecordingPanel seconds={voice.seconds} uploading={voice.uploading} onDone={voice.stop} onCancel={voice.cancel} />
					) : voice.result ? (
						<VoiceResultPanel voice={voice.result.voice} onRerecord={() => (voice.reset(), voice.start())} />
					) : (
						<Pressable
							onPress={voice.start}
							style={{ height: 48, borderRadius: 14, backgroundColor: c.brandTint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<MicOutline size={20} color={c.brandStrong} />
							<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Сказать голосом')}</Text>
						</Pressable>
					)}
					{voice.error ? <Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.danger }}>{voice.error}</Text> : null}

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(700), letterSpacing: 1.04, textTransform: 'uppercase', color: c.muted }}>
							{voice.result ? t('Заполнили из голоса') : t('Цена и время')}
						</Text>
						<View style={{ flex: 1 }} />
						{voice.result ? <Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.muted }}>{t('можно поправить')}</Text> : null}
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
						<Text style={{ fontSize: fs.xxl, fontFamily: fontFamily(700), color: c.muted }}>{t('от')}</Text>
						<TextInput
							value={priceValue ? formatNumber(priceValue) : ''}
							onChangeText={(value) => setPrice(value.replace(/\D/g, '').slice(0, 7))}
							keyboardType="number-pad"
							placeholder="0"
							placeholderTextColor={c.border}
							style={{ minWidth: 40, fontSize: fs.hero, fontFamily: fontFamily(800), letterSpacing: -0.64, color: c.ink, padding: 0 }}
						/>
						<Text style={{ fontSize: fs.xxl, fontFamily: fontFamily(700), color: c.muted }}>{t('сом')}</Text>
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
									<Text numberOfLines={1} style={{ fontSize: fs.base, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? c.brandStrong : c.ink }}>
										{timeLabel(value)}
									</Text>
								</Pressable>
							)
						})}
					</View>

					{offer.error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{offer.error.message}</Text> : null}

					<Pressable
						onPress={send}
						disabled={busy}
						style={{
							height: 58,
							borderRadius: 14,
							backgroundColor: c.brand,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
							opacity: busy ? 0.5 : 1,
						}}
					>
						<SendPlane size={20} color={fixed.white} />
						<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(700), color: fixed.white }}>{offer.isPending ? t('Отправляем…') : t('Отправить клиенту')}</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</>
	)
}
