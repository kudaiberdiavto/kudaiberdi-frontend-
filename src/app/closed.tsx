import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Button } from '@/components/ui'
import { CheckIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { useCloseRequest, useReviewTags } from '@/api/requests'
import { useCloseServiceRequest, useServiceOffers } from '@/api/services'
import type { CloseRequestBody } from '@/api/types'

type TagCode = NonNullable<CloseRequestBody['tags']>[number]

/**
 * 09 — «Купил — закрыть запрос» from the chat [08]. The request is closed with
 * the optional review in one call (POST /requests/{id}/close) on «Готово».
 * `kind=service` — «Договорились» for a service request [37]: pick the master, then the same review.
 */
export default function RequestClosedScreen() {
	const c = useColors()
	const params = useLocalSearchParams<{ id: string; shopId?: string; shopName?: string; kind?: string }>()
	const id = Number(params.id)
	const service = params.kind === 'service'
	const tags = useReviewTags()
	const closePart = useCloseRequest(service ? 0 : id)
	const closeService = useCloseServiceRequest(service ? id : 0)
	const close = service ? closeService : closePart
	// Masters who offered help — the deal is with one of them.
	const offers = (useServiceOffers(service ? id : 0).data ?? []).filter((o) => o.answer === 'CAN_HELP' && o.master)
	const [masterId, setMasterId] = useState<number | null>(null)
	const master = offers.find((o) => o.master?.id === masterId)?.master
	const shopId = params.shopId ? Number(params.shopId) : undefined
	const rated = service ? masterId !== null : Boolean(shopId)
	const [rating, setRating] = useState(0)
	const [picked, setPicked] = useState<TagCode[]>([])
	// «Легко найти бокс» is about the market box, not a master.
	const tagList = (tags.data ?? []).filter((tag) => !service || tag.code !== 'EASY_TO_FIND')

	const toggle = (code: TagCode) =>
		setPicked((list) => (list.includes(code) ? list.filter((t) => t !== code) : [...list, code]))

	const review = { stars: rating || undefined, tags: picked.length ? picked : undefined }
	const done = () =>
		service
			? closeService.mutate(masterId ? { masterId, ...review } : {}, { onSuccess: () => router.replace('/buyer') })
			: closePart.mutate(shopId ? { shopId, ...review } : {}, { onSuccess: () => router.replace('/buyer') })

	return (
		<View style={{ flex: 1, backgroundColor: raw.sheetBackdrop, justifyContent: 'flex-end' }}>
			<View
				style={{
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 12,
					paddingHorizontal: 20,
					paddingBottom: 28,
					gap: 18,
				}}
			>
				<View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: raw.dashed, alignSelf: 'center' }} />

				<View
					style={{
						width: 56,
						height: 56,
						borderRadius: 28,
						backgroundColor: c.successTint,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<CheckIcon size={28} color={c.success} />
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 24, fontFamily: fontFamily(700), color: c.ink }}>{service ? 'Договорились' : 'Запрос закрыт'}</Text>
					<Text style={{ fontSize: 16, lineHeight: 23.2, fontFamily: fontFamily(400), color: c.muted }}>
						{service ? 'Заявка закроется, другие мастера её больше не увидят. С кем договорились?' : 'Остальные продавцы больше его не видят.'}
						{!service && shopId && params.shopName ? ` Как прошло у ${params.shopName}?` : ''}
						{service && master ? ` Как прошло у ${master.name}?` : ''}
					</Text>
				</View>

				{service && offers.length ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{offers.map(({ master: m }) => {
							const active = m!.id === masterId
							return (
								<Pressable
									key={m!.id}
									onPress={() => setMasterId(active ? null : m!.id)}
									style={{
										height: 44,
										paddingHorizontal: 14,
										borderRadius: 20,
										borderWidth: 2,
										borderColor: active ? c.brand : c.border,
										backgroundColor: active ? c.brandTint : c.card,
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>{m!.name}</Text>
								</Pressable>
							)
						})}
					</View>
				) : null}

				{rated ? (
					<>
						<View style={{ flexDirection: 'row', gap: 10 }}>
							{[1, 2, 3, 4, 5].map((star) => {
								const active = star <= rating
								return (
									<Pressable
										key={star}
										onPress={() => setRating(star)}
										style={{
											flex: 1,
											height: 52,
											borderRadius: 12,
											backgroundColor: active ? c.brandTint : raw.fill,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 26, color: active ? c.brandStrong : raw.fillInk }}>★</Text>
									</Pressable>
								)
							})}
						</View>

						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{tagList.map((tag) => {
								const active = picked.includes(tag.code)
								return (
									<Pressable
										key={tag.code}
										onPress={() => toggle(tag.code)}
										style={{
											height: 44,
											paddingHorizontal: 12,
											borderRadius: 20,
											borderWidth: 2,
											borderColor: active ? c.brand : c.border,
											backgroundColor: active ? c.brandTint : raw.fill,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text
											style={{
												fontSize: 14,
												fontFamily: fontFamily(active ? 700 : 600),
												color: active ? c.brandStrong : c.inkSecondary,
											}}
										>
											{tag.label}
										</Text>
									</Pressable>
								)
							})}
						</View>
					</>
				) : null}

				{close.error ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{close.error.message}</Text>
				) : null}

				<Button label="Готово" loading={close.isPending} onPress={done} />
			</View>
		</View>
	)
}
