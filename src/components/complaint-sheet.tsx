import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '@/components/ui'
import { CheckIcon, FlagIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { useComplain } from '@/api/complaints'
import type { ComplaintReason, ComplaintType } from '@/api/types'

const REASONS: { value: ComplaintReason; label: string; for?: ComplaintType[] }[] = [
	{ value: 'FAKE_ORIGINAL', label: 'Подделка под оригинал', for: ['PART', 'SHOP', 'SHOP_PHOTO'] },
	{ value: 'REVIEW_WITHOUT_PURCHASE', label: 'Отзыв без покупки', for: ['REVIEW', 'MASTER_REVIEW'] },
	{ value: 'WRONG_PLACE', label: 'Не тот контейнер или адрес', for: ['SHOP', 'SHOP_PHOTO', 'MASTER'] },
	{ value: 'SPAM_FRAUD', label: 'Спам или мошенничество' },
	{ value: 'RUDE', label: 'Грубость' },
	{ value: 'OTHER', label: 'Другое' },
]

export interface ComplaintTarget {
	type: ComplaintType
	targetId: number
	relatedRequestId?: number
	relatedServiceRequestId?: number
}

/**
 * «Пожаловаться» — no mockup; a bottom sheet in the style of 09. Reasons depend on what is reported,
 * the text is optional. After sending — «Спасибо, администрация проверит».
 */
export function ComplaintSheet({ target, onClose }: { target: ComplaintTarget | null; onClose: () => void }) {
	return (
		<Modal visible={target !== null} transparent animationType="slide" onRequestClose={onClose}>
			{target ? <Sheet key={`${target.type}-${target.targetId}`} target={target} onClose={onClose} /> : null}
		</Modal>
	)
}

function Sheet({ target, onClose }: { target: ComplaintTarget; onClose: () => void }) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const complain = useComplain()
	const [reason, setReason] = useState<ComplaintReason | null>(null)
	const [text, setText] = useState('')
	const reasons = REASONS.filter((r) => !r.for || r.for.includes(target.type))

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} />
			<View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28 + insets.bottom, gap: 14 }}>
				<View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: raw.dashed, alignSelf: 'center' }} />
				{complain.isSuccess ? (
					<>
						<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.successTint, alignItems: 'center', justifyContent: 'center' }}>
							<CheckIcon size={28} color={c.success} />
						</View>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>Жалоба отправлена</Text>
						<Text style={{ fontSize: 16.5, lineHeight: 23, fontFamily: fontFamily(400), color: c.muted }}>
							Администрация проверит и пришлёт пуш с решением.
						</Text>
						<Button label="Готово" onPress={onClose} />
					</>
				) : (
					<>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>Пожаловаться</Text>
						<View style={{ gap: 8 }}>
							{reasons.map((r) => {
								const active = r.value === reason
								return (
									<Pressable
										key={r.value}
										onPress={() => setReason(r.value)}
										style={{
											height: 48,
											borderRadius: 12,
											borderWidth: 2,
											borderColor: active ? c.brand : c.border,
											backgroundColor: active ? c.brandTint : c.card,
											paddingHorizontal: 14,
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 16.5, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>{r.label}</Text>
									</Pressable>
								)
							})}
						</View>
						<TextInput
							value={text}
							onChangeText={(v) => setText(v.slice(0, 500))}
							placeholder="Подробности — необязательно"
							placeholderTextColor={raw.fillInk}
							multiline
							style={{
								minHeight: 72,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								paddingVertical: 10,
								paddingHorizontal: 14,
								fontSize: 16.5,
								fontFamily: fontFamily(400),
								color: c.ink,
								textAlignVertical: 'top',
							}}
						/>
						{complain.error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{complain.error.message}</Text> : null}
						<Button
							label="Отправить"
							disabled={!reason}
							loading={complain.isPending}
							onPress={() => reason && complain.mutate({ ...target, reason, text: text.trim() || undefined })}
						/>
					</>
				)}
			</View>
		</KeyboardAvoidingView>
	)
}

/** Quiet «Пожаловаться» link at the bottom of a card or profile. */
export function ComplainLink({ onPress, label = 'Пожаловаться' }: { onPress: () => void; label?: string }) {
	const c = useColors()
	return (
		<Pressable onPress={onPress} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 12 }}>
			<FlagIcon size={16} color={c.muted} />
			<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.muted }}>{label}</Text>
		</Pressable>
	)
}
