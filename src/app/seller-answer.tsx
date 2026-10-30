import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BrandLogo } from '@/components/ui'
import { VoicePlayer, useVoiceNote, voiceClock } from '@/components/voice'
import { Label, MicIcon, PlaneIcon, SparkleIcon, TickIcon } from '@/components/seller-v23'
import { fontFamily, raw, useColors } from '@/theme'
import { formatNumber } from '@/lib/format'
import { useIncomingRequest, useMarkSeen, useReplyToRequest } from '@/api/incoming'
import type { PartCondition, ReplyDraft } from '@/api/types'

const VIOLET = '#5B3FD1'
const VIOLET_TINT = '#F1ECFF'

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
	// What the voice filled: such fields carry ✧ until the seller changes them.
	const [heard, setHeard] = useState<ReplyDraft | null>(null)

	const note = useVoiceNote('REPLY', (result) => {
		const draft = result.reply
		setHeard(draft)
		if (draft?.price) setPrice(String(draft.price))
		if (draft?.condition) setCondition(draft.condition)
		if (draft?.original !== null && draft?.original !== undefined) setOriginal(draft.original)
	})

	useEffect(() => {
		markSeen.mutate(id)
		if (params.voice === '1') note.start()
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened request
	}, [id])

	const data = request.data
	const voice = note.result?.voice
	const amount = Number(price)
	const priceFromVoice = Boolean(heard?.price && heard.price === amount)

	const rerecord = () => {
		note.reset()
		setHeard(null)
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
				manufacturer: heard?.manufacturer ?? undefined,
				tags: heard?.tags.length ? heard.tags : undefined,
			},
			{ onSuccess: () => router.back() }
		)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			{/* The request under the dimmed backdrop, as in the mockup. */}
			<View style={{ paddingTop: insets.top + 60, paddingHorizontal: 16 }}>
				<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					{data ? <BrandLogo brand={data.car.brand} size={32} /> : null}
					<View style={{ flex: 1, gap: 1 }}>
						<Text style={{ fontSize: 16.5, lineHeight: 21.5, fontFamily: fontFamily(700), color: c.ink }}>{data?.car.label ?? ' '}</Text>
						<Text style={{ fontSize: 15.5, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>{data?.text ?? ' '}</Text>
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
							<TickIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
						</View>
						<View style={{ flex: 1, gap: 1 }}>
							<Text style={{ fontSize: 22, lineHeight: 28.6, fontFamily: fontFamily(800), color: c.ink }}>Проверьте и отправьте</Text>
							<Text numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
								{data ? `${data.text} · ${data.car.modelLabel}` : ' '}
							</Text>
						</View>
					</View>

					{note.recording || note.uploading ? (
						<Recording seconds={note.seconds} uploading={note.uploading} onDone={note.stop} onCancel={note.cancel} />
					) : voice ? (
						<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 10, gap: 8 }}>
							<VoicePlayer voice={voice} background={c.card} />
							<View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 }}>
								<Text style={{ flex: 1, fontSize: 16.5, lineHeight: 22.5, fontStyle: 'italic', fontFamily: fontFamily(400), color: c.inkSecondary }}>
									{voice.transcript ? `«${voice.transcript}»` : 'Не разобрали слова — заполните цену сами'}
								</Text>
								<Text onPress={rerecord} style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
									Перезаписать
								</Text>
							</View>
						</View>
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
							<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Сказать голосом</Text>
						</Pressable>
					)}
					{note.error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{note.error}</Text> : null}

					<Label
						right={
							heard ? <Text style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: c.muted }}>можно поправить</Text> : undefined
						}
					>
						{heard ? 'Заполнили из голоса' : 'Ваш ответ'}
					</Label>

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
							placeholder="Цена"
							placeholderTextColor={raw.fillInk}
							style={{ minWidth: 40, fontSize: 32, fontFamily: fontFamily(800), letterSpacing: -0.64, color: c.ink, padding: 0 }}
						/>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.muted }}>сом</Text>
						<View style={{ flex: 1 }} />
						{priceFromVoice ? <FromVoice /> : null}
					</View>

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Choice label="Новая" active={condition === 'NEW'} fromVoice={heard?.condition === 'NEW'} onPress={() => setCondition('NEW')} />
						<Choice label="Б/у" active={condition === 'USED'} fromVoice={heard?.condition === 'USED'} onPress={() => setCondition('USED')} />
					</View>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Choice label="Оригинал" active={original === true} fromVoice={heard?.original === true} onPress={() => setOriginal(true)} />
						<Choice label="Копия" active={original === false} fromVoice={heard?.original === false} onPress={() => setOriginal(false)} />
					</View>

					{reply.error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{reply.error.message}</Text> : null}

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
						<PlaneIcon size={20} color="#FFFFFF" />
						<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Отправить покупателю</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</View>
	)
}

/** ✧ «из голоса». */
function FromVoice() {
	return (
		<View style={{ height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: VIOLET_TINT, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
			<SparkleIcon size={13} color={VIOLET} />
			<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: VIOLET }}>из голоса</Text>
		</View>
	)
}

function Choice({ label, active, fromVoice, onPress }: { label: string; active: boolean; fromVoice: boolean; onPress: () => void }) {
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
			<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 17, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>{label}</Text>
			{active && fromVoice ? <SparkleIcon size={14} color={VIOLET} /> : null}
		</Pressable>
	)
}

/** While recording: red dot, timer, «Готово»; then «Слушаем…» while the server hears it. */
function Recording({ seconds, uploading, onDone, onCancel }: { seconds: number; uploading: boolean; onDone: () => void; onCancel: () => void }) {
	const c = useColors()
	return (
		<View style={{ borderRadius: 16, backgroundColor: c.surface, padding: 10, gap: 8 }}>
			<View
				style={{
					height: 44,
					borderRadius: 22,
					backgroundColor: c.card,
					paddingLeft: 14,
					paddingRight: 6,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: uploading ? c.brand : c.danger }} />
				<Text style={{ flex: 1, fontSize: 16.5, fontFamily: fontFamily(600), color: c.ink }}>
					{uploading ? 'Слушаем…' : `Говорите · ${voiceClock(seconds)}`}
				</Text>
				{uploading ? null : (
					<Pressable
						onPress={onDone}
						style={{ height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.success, justifyContent: 'center' }}
					>
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Готово</Text>
					</Pressable>
				)}
			</View>
			{uploading ? null : (
				<View style={{ flexDirection: 'row', paddingHorizontal: 4 }}>
					<View style={{ flex: 1 }} />
					<Text onPress={onCancel} style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.danger }}>
						Отмена
					</Text>
				</View>
			)}
		</View>
	)
}
