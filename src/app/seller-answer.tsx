import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useConfirmLeave } from '@/lib/use-confirm-leave'
import { BrandLogo, toast } from '@/components/ui'
import { VoicePlayer, VoiceRecordingPanel, VoiceResultPanel, useVoiceNote } from '@/components/voice'
import { Label, MicIcon, PlaneIcon, TickIcon } from '@/components/seller-v23'
import { MediaStrip, photosAsMedia } from '@/components/media-strip'
import { isPlaceholderText } from '@/components/request-text'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { formatNumber } from '@/lib/format'
import { useIncomingRequest, useMarkSeen, useReplyToRequest } from '@/api/incoming'
import type { PartCondition } from '@/api/types'
import { t } from '@/i18n'


/**
 * 14 «Проверьте и отправьте» — the answer «Есть» with a price. `voice=1` (from «Ответить голосом» [13]) starts the
 * recording at once: the server hears the note and fills the price, «Новая / Б/у» and «Оригинал / Копия»
 * (marked ✧ «из голоса», the seller can fix them). Without it — the same sheet with the price typed by hand.
 */
export default function SellerAnswerScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ id: string; voice?: string }>()
	const id = Number(params.id)
	const request = useIncomingRequest(id)
	const markSeen = useMarkSeen()
	const reply = useReplyToRequest(id)

	const [price, setPrice] = useState('')
	const [condition, setCondition] = useState<PartCondition | null>(null)
	const [original, setOriginal] = useState<boolean | null>(null)
	// The voice goes to the buyer as is; the price and the condition the seller sets by hand.
	const note = useVoiceNote('REPLY')

	useEffect(() => {
		markSeen.mutate(id)
		if (params.voice === '1') note.start()
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened request
	}, [id])

	const data = request.data
	const voice = note.result?.voice
	const amount = Number(price)
	const leave = useConfirmLeave(Boolean(price) || Boolean(voice) || note.recording)

	const rerecord = () => {
		note.reset()
		note.start()
	}

	const send = () =>
		reply.mutate(
			{
				answer: 'HAVE',
				price: amount,
				condition: condition ?? undefined,
				original: original ?? undefined,
				voiceMediaId: voice?.id,
			},
			{ onSuccess: () => (toast(t('Ответ отправлен покупателю')), leave(() => router.back())) }
		)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			{/* The request under the dimmed backdrop, as in the mockup. */}
			<View style={{ paddingTop: insets.top + 60, paddingHorizontal: 16 }}>
				<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					{data ? <BrandLogo brand={data.car.brand} size={32} /> : null}
					<View style={{ flex: 1, gap: 1 }}>
						<Text style={{ fontSize: fs.base, lineHeight: 21.5, fontFamily: fontFamily(700), color: c.ink }}>{data?.car.label ?? ' '}</Text>
						<Text style={{ fontSize: fs.md, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>{data?.text ?? ' '}</Text>
					</View>
				</View>
			</View>
			<Pressable
				onPress={() => router.back()}
				style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(32,31,29,0.45)' }}
			/>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
			>
				<View
					style={{
						backgroundColor: c.card,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						paddingTop: 10,
						paddingHorizontal: 16,
						paddingBottom: Math.max(28, insets.bottom + 12),
						gap: 12,
					}}
				>
					<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}>
							<TickIcon size={22} color={fixed.white} strokeWidth={2.2} />
						</View>
						<View style={{ flex: 1, gap: 1 }}>
							<Text style={{ fontSize: fs.h3, lineHeight: 28.6, fontFamily: fontFamily(800), color: c.ink }}>{t('Проверьте и отправьте')}</Text>
							<Text numberOfLines={1} style={{ fontSize: fs.md, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
								{data ? [data.buyerName, data.car.label].filter(Boolean).join(' · ') : ' '}
							</Text>
						</View>
					</View>

					{/* The request itself stays in sight while answering: the words, the buyer's voice, the photos. */}
					{data && (!isPlaceholderText(data.text) || data.voice || data.photos.length) ? (
						<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 12, gap: 8 }}>
							{isPlaceholderText(data.text) ? null : (
								<Text style={{ fontSize: fs.lg, lineHeight: 22, fontFamily: fontFamily(600), color: c.ink }}>{data.text}</Text>
							)}
							{data.voice ? <VoicePlayer voice={data.voice} background={c.card} /> : null}
							<MediaStrip media={photosAsMedia(data.photos)} />
						</View>
					) : null}

					{note.recording || note.uploading ? (
						<VoiceRecordingPanel seconds={note.seconds} uploading={note.uploading} onDone={note.stop} onCancel={note.cancel} />
					) : voice ? (
						<VoiceResultPanel voice={voice} onRerecord={rerecord} />
					) : (
						<Pressable
							onPress={note.start}
							style={{
								height: 48,
								borderRadius: 14,
								backgroundColor: c.brandTint,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
							}}
						>
							<MicIcon size={20} color={c.brandStrong} />
							<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Сказать голосом')}</Text>
						</Pressable>
					)}
					{note.error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{note.error}</Text> : null}

					<Label>{t('Ваш ответ')}</Label>

					<View
						style={{
							height: 64,
							borderRadius: 16,
							borderWidth: 2.5,
							borderColor: amount > 0 ? c.success : c.border,
							paddingHorizontal: 16,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 8,
						}}
					>
						<TextInput
							value={amount > 0 ? formatNumber(amount) : price}
							onChangeText={(text) => setPrice(text.replace(/\D/g, '').slice(0, 7))}
							keyboardType="number-pad"
							placeholder={t('Цена')}
							placeholderTextColor={c.fillInk}
							style={{ minWidth: 40, fontSize: fs.hero, fontFamily: fontFamily(800), letterSpacing: -0.64, color: c.ink, padding: 0 }}
						/>
						<Text style={{ fontSize: fs.xxl, fontFamily: fontFamily(700), color: c.muted }}>{t('сом')}</Text>
					</View>

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Choice label={t('Новая')} active={condition === 'NEW'} onPress={() => setCondition('NEW')} />
						<Choice label={t('Б/у')} active={condition === 'USED'} onPress={() => setCondition('USED')} />
					</View>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Choice label={t('Оригинал')} active={original === true} onPress={() => setOriginal(true)} />
						<Choice label={t('Копия')} active={original === false} onPress={() => setOriginal(false)} />
					</View>

					{reply.error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{reply.error.message}</Text> : null}

					<Pressable
						disabled={!(amount > 0) || reply.isPending || note.recording || note.uploading}
						onPress={send}
						style={{
							height: 58,
							borderRadius: 14,
							backgroundColor: c.success,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
							opacity: amount > 0 && !reply.isPending ? 1 : 0.4,
						}}
					>
						<PlaneIcon size={20} color={fixed.white} />
						<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(700), color: fixed.white }}>{t('Отправить покупателю')}</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</View>
	)
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				flex: 1,
				height: 46,
				borderRadius: 12,
				borderWidth: 2,
				borderColor: active ? c.brand : c.border,
				backgroundColor: active ? c.brandTint : c.card,
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 6,
			}}
		>
			<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs.lg, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>{label}</Text>
		</Pressable>
	)
}
