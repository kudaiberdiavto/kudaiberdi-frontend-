import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, QueryErrorBanner, SectionLabel } from '@/components/ui'
import { fontFamily, raw, useColors } from '@/theme'
import { formatSide } from '@/lib/format'
import { useRowContainers, useRows } from '@/api/market'
import { useMyShop, useRelocateShop } from '@/api/shop'
import { useSession } from '@/store/useSession'
import { useClaimContainer } from '@/api/complaints'
import { ApiError } from '@/lib/api'

/** 10а «Где ваш бокс?» — registration step 1, or moving to another box when the shop exists. */
export default function BoxSelectScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const hasShop = useSession((s) => s.hasShop)
	const shop = useMyShop()
	const rows = useRows()
	const relocate = useRelocateShop()

	const current = shop.data?.location
	const [rowId, setRowId] = useState<number | null>(null)
	const [box, setBox] = useState<{ id: number; number: number } | null>(null)
	// «Это мой контейнер» — a taken box that is actually yours.
	const [claim, setClaim] = useState<{ id: number; number: number } | null>(null)
	const activeRowId = rowId ?? current?.rowId ?? rows.data?.[0]?.id
	const row = rows.data?.find((r) => r.id === activeRowId)
	const detail = useRowContainers(activeRowId ?? 0)

	const next = () => {
		if (!box || !row) return
		if (hasShop) {
			// Place checks are off on the server for now (SHOP_VERIFICATION_REQUIRED=false) — the move applies at once.
			relocate.mutate(box.id, { onSuccess: (v) => (v.required ? router.replace('/verify-box') : router.back()) })
		} else {
			router.push({
				pathname: '/my-box',
				params: { containerId: String(box.id), place: `${row.label} · Бокс ${box.number}` },
			})
		}
	}

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 8,
				paddingHorizontal: 16,
				paddingBottom: 16,
				gap: 14,
			}}
		>
			<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>
				{hasShop ? 'Переезд в другой бокс' : 'Шаг 1 из 2'}
			</Text>
			<Text style={{ fontSize: 26, lineHeight: 29.9, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>
				Где ваш бокс?
			</Text>

			<QueryErrorBanner error={rows.error ?? detail.error} onRetry={() => rows.refetch()} />

			<ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
				<SectionLabel>Ряд</SectionLabel>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
					{(rows.data ?? []).map((item) => {
						const active = item.id === activeRowId
						return (
							<Pressable
								key={item.id}
								onPress={() => {
									setRowId(item.id)
									setBox(null)
								}}
								style={{
									minWidth: 55,
									height: 44,
									paddingHorizontal: 8,
									borderRadius: 10,
									borderWidth: 2,
									borderColor: active ? c.brand : c.border,
									backgroundColor: active ? c.brandTint : c.card,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>
									{item.code}
								</Text>
							</Pressable>
						)
					})}
					<Pressable
						onPress={() => router.push('/buyer/market')}
						style={{
							width: 55,
							height: 44,
							borderRadius: 10,
							borderWidth: 2,
							borderStyle: 'dashed',
							borderColor: raw.dashed,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Карта</Text>
					</Pressable>
				</View>

				<SectionLabel style={{ paddingTop: 6 }}>{`Ваш контейнер в ряду ${row?.code ?? ''}`}</SectionLabel>

				<View style={{ borderRadius: 14, backgroundColor: c.card, padding: 10 }}>
					{(detail.data?.sides ?? []).map((side, index) => (
						<View key={side.side}>
							{index > 0 ? (
								<View style={{ height: 20, justifyContent: 'center', marginVertical: 4 }}>
									<View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: c.border }} />
								</View>
							) : null}

							<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted, paddingBottom: 6 }}>
								{`${formatSide(side.side)} сторона`.replace(/^./, (ch) => ch.toUpperCase())}
							</Text>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
								{side.containers.map((slot) => {
									const active = box?.id === slot.id
									// Taken by another seller in the app — grey; your own current box stays selectable.
									const taken = slot.occupied && slot.id !== current?.containerId
									return (
										<Pressable
											key={slot.id}
											onPress={() => (taken ? setClaim({ id: slot.id, number: slot.number }) : setBox({ id: slot.id, number: slot.number }))}
											style={{
												width: 40,
												height: 44,
												borderRadius: 8,
												backgroundColor: active ? c.brand : raw.fill,
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<Text
												style={{
													fontSize: 14,
													fontFamily: fontFamily(700),
													color: active ? '#FFFFFF' : taken ? raw.fillInk : c.inkSecondary,
												}}
											>
												{slot.number}
											</Text>
										</Pressable>
									)
								})}
							</View>
						</View>
					))}
				</View>

				<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
					Серый номер — бокс уже занят другим продавцом. Если это ваш бокс — нажмите на номер.
				</Text>
			</ScrollView>

			{relocate.error ? (
				<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{relocate.error.message}</Text>
			) : null}

			<ClaimSheet
				box={claim && row ? { ...claim, place: `${row.label} · Бокс ${claim.number}` } : null}
				onClose={() => setClaim(null)}
				onFree={(free) => {
					setClaim(null)
					setBox(free)
				}}
			/>

			<Button
				label={box && row ? `${row.label} · Бокс ${box.number} — далее` : 'Выберите бокс'}
				disabled={!box}
				loading={relocate.isPending}
				onPress={next}
			/>
		</View>
	)
}

/**
 * «Это мой контейнер» — no mockup; a sheet in the style of 09. POST /market/containers/{id}/claim → the dispute goes
 * to the administration, the answer comes as a DISPUTE_RESOLVED push. 409 CONTAINER_FREE — the box is free after all.
 */
function ClaimSheet({
	box,
	onClose,
	onFree,
}: {
	box: { id: number; number: number; place: string } | null
	onClose: () => void
	onFree: (box: { id: number; number: number }) => void
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const claim = useClaimContainer()
	const [text, setText] = useState('')
	const code = claim.error instanceof ApiError ? claim.error.code : null

	const close = () => {
		claim.reset()
		setText('')
		onClose()
	}

	return (
		<Modal visible={box !== null} transparent animationType="slide" onRequestClose={close}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={close} />
				<View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 + insets.bottom, gap: 14 }}>
					{claim.isSuccess ? (
						<>
							<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>Заявка на спор отправлена</Text>
							<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
								Администрация рынка проверит, чей это бокс, и пришлёт пуш с решением.
							</Text>
							<Button label="Понятно" onPress={close} />
						</>
					) : (
						<>
							<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{box?.place ?? ' '} занят</Text>
							<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
								Если это ваш бокс, а в приложении его занял другой продавец, — откройте спор. Администрация рынка разберётся.
							</Text>
							<TextInput
								value={text}
								onChangeText={(v) => setText(v.slice(0, 500))}
								placeholder="Комментарий — необязательно: с какого года аренда, договор…"
								placeholderTextColor={raw.fillInk}
								multiline
								style={{ minHeight: 72, borderRadius: 12, borderWidth: 2, borderColor: c.border, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, fontFamily: fontFamily(400), color: c.ink, textAlignVertical: 'top' }}
							/>
							{claim.error ? (
								<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{claim.error.message}</Text>
							) : null}
							{code === 'CONTAINER_FREE' && box ? (
								<Button label="Занять этот бокс" variant="secondary" onPress={() => onFree({ id: box.id, number: box.number })} />
							) : (
								<Button
									label="Это мой контейнер"
									loading={claim.isPending}
									disabled={code === 'OWN_CONTAINER'}
									onPress={() => box && claim.mutate({ containerId: box.id, text: text.trim() || undefined })}
								/>
							)}
						</>
					)}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}
